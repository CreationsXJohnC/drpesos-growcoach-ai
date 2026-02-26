// Shared user types

export type SubscriptionTier = "free" | "grower_monthly" | "commercial_monthly" | "lifetime";

export interface User {
  id: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  trialStartDate: string | null; // ISO date string
  questionsToday: number;
  lastQuestionDate: string | null; // ISO date string
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}
