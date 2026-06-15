import Stripe from "npm:stripe@16";
import { createUserClient, createServiceClient, errorResponse, jsonResponse } from "../_shared/supabase.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return errorResponse("Method Not Allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Unauthorized", 401);

  const userClient = createUserClient(authHeader);
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return errorResponse("Unauthorized", 401);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const appUrl = Deno.env.get("APP_URL") ?? "https://diffbell.app";

  if (!stripeKey) {
    return errorResponse("Payment service not configured", 500);
  }

  const db = createServiceClient();
  const { data: sub } = await db
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!sub?.stripe_customer_id) {
    return errorResponse("Stripe の顧客情報が見つかりません", 404);
  }

  const stripe = new Stripe(stripeKey);
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${appUrl}/billing`,
  });

  return jsonResponse({ url: session.url });
});
