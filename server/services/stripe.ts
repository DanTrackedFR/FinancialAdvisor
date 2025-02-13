import Stripe from "stripe";
import { storage } from "../storage";
import { addDays } from "date-fns";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const TRIAL_PERIOD_DAYS = 30;
const SUBSCRIPTION_PRICE_ID = "price_monthly"; // Replace with your actual price ID

export async function createCustomer(userId: number, email: string, name: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId.toString(),
      },
    });

    await storage.updateStripeCustomerId(userId, customer.id);
    
    // Set trial end date
    const trialEnd = addDays(new Date(), TRIAL_PERIOD_DAYS);
    await storage.updateUser(userId, {
      subscriptionStatus: "trial",
      trialEndsAt: trialEnd,
    });

    return customer;
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    throw error;
  }
}

export async function createSubscription(customerId: string, userId: number) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: SUBSCRIPTION_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      trial_period_days: TRIAL_PERIOD_DAYS,
    });

    await storage.createSubscription({
      userId,
      stripeSubscriptionId: subscription.id,
      status: "trial",
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    });

    return subscription;
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string, userId: number) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    
    await storage.updateUserSubscriptionStatus(userId, "cancelled");
    
    return subscription;
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = parseInt(subscription.metadata.userId);
  
  await storage.updateSubscription(userId, {
    status: subscription.status as any,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
  });
}
