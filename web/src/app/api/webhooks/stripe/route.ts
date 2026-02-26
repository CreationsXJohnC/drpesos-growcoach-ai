import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { updateSubscriptionTier } from "@/lib/supabase/queries";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Stripe sends raw body — must disable Next.js body parsing
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Subscription created / updated ──────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;

        const plan = sub.metadata?.plan as string;
        const tier =
          plan === "commercial_monthly"
            ? "commercial_monthly"
            : "grower_monthly";

        const periodEnd = new Date(
          (sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000
        ).toISOString();

        await updateSubscriptionTier(userId, tier, {
          stripeSubscriptionId: sub.id,
          subscriptionPeriodEnd: periodEnd,
        });
        break;
      }

      // ── Subscription cancelled / expired ───────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;
        await updateSubscriptionTier(userId, "free");
        break;
      }

      // ── One-time lifetime payment completed ────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "payment") break;

        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan;
        if (!userId || plan !== "lifetime") break;

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        await updateSubscriptionTier(userId, "lifetime", {
          stripeCustomerId: customerId,
        });
        break;
      }

      default:
        // Unhandled event type — that's fine
        break;
    }
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
