import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

// Price IDs — set these in your .env after creating products in Stripe Dashboard
export const STRIPE_PRICES = {
  grower_monthly: process.env.STRIPE_PRICE_GROWER_MONTHLY ?? "",
  commercial_monthly: process.env.STRIPE_PRICE_COMMERCIAL_MONTHLY ?? "",
  lifetime: process.env.STRIPE_PRICE_LIFETIME ?? "",
} as const;

export type StripePriceKey = keyof typeof STRIPE_PRICES;
