import Stripe from "stripe";
import { storage } from "../storage";
import { addDays } from "date-fns";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

if (!process.env.STRIPE_PRICE_ID) {
  console.warn("Warning: STRIPE_PRICE_ID environment variable not set. Using test mode.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const TRIAL_PERIOD_DAYS = 30;
const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_PRICE_ID;

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
      subscriptionStatus: "trial" as any,
      trialEndsAt: trialEnd,
    });

    return customer;
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    throw error;
  }
}

export async function createCheckoutSession(customerId: string, userId: number) {
  try {
    if (!SUBSCRIPTION_PRICE_ID) {
      throw new Error("STRIPE_PRICE_ID environment variable not set");
    }

    console.log('Creating checkout session for customer:', customerId);
    console.log('Using price ID:', SUBSCRIPTION_PRICE_ID);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: SUBSCRIPTION_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.PUBLIC_URL || 'https://trackedfr.com'}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_URL || 'https://trackedfr.com'}/profile`,
      metadata: {
        userId: userId.toString(),
      },
    });

    console.log('Checkout session created:', session.id);
    return session;
  } catch (error) {
    console.error("Error creating checkout session:", error);
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