import Stripe from "stripe";
import { storage } from "../storage";
import { addDays } from "date-fns";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const TRIAL_PERIOD_DAYS = 30;

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

    // Note: We would normally set the trial end date here,
    // but that functionality would need to be implemented with a
    // separate method since trialEndsAt is not part of the updateUser fields.
    // For now, we'll skip setting the trial end date as part of customer creation.

    return customer;
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    throw error;
  }
}

export async function createCheckoutSession(customerId: string, userId: number) {
  try {
    const priceId = process.env.STRIPE_PRICE_ID;
    console.log("Raw STRIPE_PRICE_ID value:", priceId);

    if (!priceId) {
      throw new Error("Missing STRIPE_PRICE_ID environment variable");
    }

    // Validate price ID format
    if (!priceId.startsWith('price_')) {
      throw new Error(`Invalid price ID format. Expected price ID starting with 'price_', got: ${priceId}`);
    }

    console.log('Creating checkout session for customer:', customerId);
    console.log('Using price ID:', priceId);

    const baseUrl = process.env.PUBLIC_URL || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    console.log('Base URL for redirects:', baseUrl);

    const successUrl = new URL('/profile', baseUrl);
    successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
    const cancelUrl = new URL('/profile', baseUrl);

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      metadata: {
        userId: userId.toString(),
      },
    };

    console.log('Creating session with config:', JSON.stringify(sessionConfig, null, 2));
    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log('Checkout session created:', session.id);
    console.log('Session URL:', session.url);

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