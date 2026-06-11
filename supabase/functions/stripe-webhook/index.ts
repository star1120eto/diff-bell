import Stripe from "npm:stripe@16";
import { createServiceClient, jsonResponse } from "../_shared/supabase.ts";

const FREE_LIMITS = { max_monitors: 3, min_interval_hours: 6 };
const PRO_LIMITS = { max_monitors: 20, min_interval_hours: 1 };

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    console.error("Stripe env vars not configured");
    return new Response("Server misconfiguration", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("No signature", { status: 400 });

  const stripe = new Stripe(stripeKey);
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const db = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (!userId || session.mode !== "subscription") break;

      const subscriptionId = session.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      await Promise.all([
        db.from("subscriptions").update({
          stripe_subscription_id: subscriptionId,
          plan: "pro",
          status: "active",
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }).eq("user_id", userId),
        db.from("user_settings").update(PRO_LIMITS).eq("user_id", userId),
      ]);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (!userId) break;

      const isPro = subscription.status === "active" || subscription.status === "trialing";
      await Promise.all([
        db.from("subscriptions").update({
          plan: isPro ? "pro" : "free",
          status: subscription.status as string,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }).eq("stripe_subscription_id", subscription.id),
        db.from("user_settings").update(isPro ? PRO_LIMITS : FREE_LIMITS).eq("user_id", userId),
      ]);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (!userId) break;

      await Promise.all([
        db.from("subscriptions").update({
          plan: "free",
          status: "canceled",
          stripe_subscription_id: null,
          current_period_end: null,
        }).eq("user_id", userId),
        db.from("user_settings").update(FREE_LIMITS).eq("user_id", userId),
      ]);
      break;
    }

    default:
      break;
  }

  return jsonResponse({ received: true });
});
