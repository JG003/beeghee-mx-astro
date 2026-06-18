// Stripe Checkout (MXN) for Beeghee México.
//
// Mirrors co-beeghee's `create-checkout` but charges in MXN and returns to the
// MX domain. Product charges are server-authoritative — Stripe charges by the
// `priceId` (an MXN Price on Beeghee's Stripe account). The client-reported
// `price` is only used to decide the shipping line, so a spoofed value can at
// most change shipping, never the product price.
//
// DEPLOY (one-time):
//   1. Create MXN Prices on Beeghee's Stripe account for each MX SKU, then put
//      each Price ID into PRICING[*].stripePriceId in src/data/site.ts.
//   2. Set the secret on the MX Supabase project (ref nqskllzyphlhmuhzpcdy):
//        supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx --project-ref nqskllzyphlhmuhzpcdy
//      (use Beeghee's key — NOT the Anabasis account key).
//   3. Deploy:
//        supabase functions deploy mx-create-checkout --project-ref nqskllzyphlhmuhzpcdy --no-verify-jwt
//   4. Flip CART_CONFIG.stripeEnabled = true in src/data/site.ts and redeploy the site.
//
// Optional follow-up: an `mx-stripe-webhook` for order recording/fulfillment.
// Not required for card payments to complete — Stripe charges and returns the
// shopper to success_url regardless.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LineItem {
  priceId: string;
  quantity: number;
  name: string;
  price: number;
}

interface CheckoutRequest {
  lineItems: LineItem[];
  customerEmail?: string;
}

// Flat-rate shipping in MXN cents. Adjust to Beeghee's real MX shipping policy,
// or remove this block to collect shipping manually via WhatsApp instead.
const SHIPPING_MXN_CENTS = 9900; // $99.00 MXN
// Free shipping at/above this subtotal (MXN). Set to a very large number to
// always charge shipping, or 0 to always ship free.
const FREE_SHIPPING_THRESHOLD_MXN = 1500;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe secret key not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { lineItems, customerEmail }: CheckoutRequest = await req.json();
    if (!lineItems || lineItems.length === 0) {
      throw new Error("No items provided for checkout");
    }
    if (lineItems.some((i) => !i.priceId)) {
      throw new Error("Missing Stripe priceId on one or more items");
    }

    const stripeLineItems = lineItems.map((item) => ({
      price: item.priceId,
      quantity: item.quantity,
    }));

    const subtotal = lineItems.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    );

    const allLineItems =
      subtotal >= FREE_SHIPPING_THRESHOLD_MXN
        ? [...stripeLineItems]
        : [
            ...stripeLineItems,
            {
              price_data: {
                currency: "mxn",
                product_data: { name: "Envío" },
                unit_amount: SHIPPING_MXN_CENTS,
              },
              quantity: 1,
            },
          ];

    const origin = req.headers.get("origin") || "https://mx.beeghee.energy";

    const session = await stripe.checkout.sessions.create({
      line_items: allLineItems,
      mode: "payment",
      allow_promotion_codes: true,
      success_url: `${origin}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/tienda`,
      customer_email: customerEmail,
      shipping_address_collection: { allowed_countries: ["MX"] },
      billing_address_collection: "required",
      metadata: {
        items: JSON.stringify(
          lineItems.map((i) => ({ name: i.name, qty: i.quantity, price: i.price }))
        ),
      },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
