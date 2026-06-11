import Stripe from "npm:stripe@16";
import { createUserClient, createServiceClient, errorResponse, jsonResponse } from "../_shared/supabase.ts";

const PRO_PLAN_LIMITS = { max_monitors: 20, min_interval_hours: 1 };

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return errorResponse("Method Not Allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Unauthorized", 401);

  const userClient = createUserClient(authHeader);
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return errorResponse("Unauthorized", 401);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const priceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
  const appUrl = Deno.env.get("APP_URL") ?? "https://diffbell.app";

  if (!stripeKey || !priceId) {
    console.error("STRIPE_SECRET_KEY or STRIPE_PRO_PRICE_ID not configured");
    return errorResponse("Payment service not configured", 500);
  }

  const stripe = new Stripe(stripeKey);
  const db = createServiceClient();

  // 既存の Stripe Customer ID を取得
  const { data: sub } = await db
    .from("subscriptions")
    .select("stripe_customer_id, plan")
    .eq("user_id", user.id)
    .single();

  if (sub?.plan === "pro") {
    return errorResponse("既に Pro プランに登録されています", 400);
  }

  let customerId = sub?.stripe_customer_id ?? null;

  // Stripe Customer が未作成なら作成
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;

    await db
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${appUrl}/billing?success=1`,
    cancel_url: `${appUrl}/billing?canceled=1`,
    metadata: { user_id: user.id },
    subscription_data: { metadata: { user_id: user.id } },
    locale: "ja",
    allow_promotion_codes: true,
  });

  return jsonResponse({ url: session.url });
});
