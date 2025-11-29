import Stripe from 'stripe';
import { ENV } from './_core/env.js';
import { adminProcedure, publicProcedure, router } from './_core/trpc.js';
import { z } from 'zod';

// Initialize Stripe
export const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: '2025-01-27.acacia',
});

// Stripe Product/Price IDs Configuration
// Update these with your actual Stripe Price IDs from the dashboard
const STRIPE_PRICES = {
  RESET_CHALLENGE: process.env.STRIPE_PRICE_RESET_CHALLENGE ?? '',
  RECOVERY_ROADMAP: process.env.STRIPE_PRICE_RECOVERY_ROADMAP ?? '',
  MONTHLY_MEMBERSHIP: process.env.STRIPE_PRICE_MONTHLY_MEMBERSHIP ?? '',
};

export const stripeRouter = router({
  /**
   * Create a Stripe Checkout Session for a product
   */
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        priceId: z.string(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
        customerEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const session = await stripe.checkout.sessions.create({
          mode: input.priceId === STRIPE_PRICES.MONTHLY_MEMBERSHIP ? 'subscription' : 'payment',
          line_items: [
            {
              price: input.priceId,
              quantity: 1,
            },
          ],
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          customer_email: input.customerEmail,
          allow_promotion_codes: true,
          billing_address_collection: 'auto',
        });

        return {
          sessionId: session.id,
          url: session.url,
        };
      } catch (error) {
        console.error('Error creating checkout session:', error);
        throw new Error('Failed to create checkout session');
      }
    }),

  /**
   * Get product information from Stripe
   */
  getProducts: publicProcedure.query(async () => {
    try {
      const prices = await stripe.prices.list({
        expand: ['data.product'],
        active: true,
      });

      return prices.data.map((price) => {
        const product = price.product as Stripe.Product;
        return {
          priceId: price.id,
          productId: product.id,
          name: product.name,
          description: product.description,
          amount: price.unit_amount,
          currency: price.currency,
          type: price.type,
          recurring: price.recurring
            ? {
                interval: price.recurring.interval,
                intervalCount: price.recurring.interval_count,
              }
            : null,
        };
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }),

  /**
   * Verify a Stripe Checkout Session
   */
  verifyCheckoutSession: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);

        return {
          id: session.id,
          status: session.status,
          paymentStatus: session.payment_status,
          customerEmail: session.customer_email,
          amountTotal: session.amount_total,
          currency: session.currency,
        };
      } catch (error) {
        console.error('Error verifying checkout session:', error);
        throw new Error('Failed to verify checkout session');
      }
    }),

  /**
   * Create a Customer Portal session for subscription management
   */
  createPortalSession: publicProcedure
    .input(
      z.object({
        customerId: z.string(),
        returnUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: input.customerId,
          return_url: input.returnUrl,
        });

        return {
          url: session.url,
        };
      } catch (error) {
        console.error('Error creating portal session:', error);
        throw new Error('Failed to create portal session');
      }
    }),

  /**
   * Get a customer's subscriptions
   */
  getSubscriptions: adminProcedure
    .input(
      z.object({
        customerId: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        let customerId = input.customerId;

        // If email provided but no customer ID, find the customer
        if (!customerId && input.email) {
          const customers = await stripe.customers.list({
            email: input.email,
            limit: 1,
          });

          if (customers.data.length === 0) {
            return { subscriptions: [] };
          }

          customerId = customers.data[0].id;
        }

        if (!customerId) {
          throw new Error('Customer ID or email is required');
        }

        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'all',
        });

        return {
          subscriptions: subscriptions.data.map((sub) => ({
            id: sub.id,
            status: sub.status,
            currentPeriodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            items: sub.items.data.map((item) => ({
              priceId: item.price.id,
              quantity: item.quantity,
            })),
          })),
        };
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        throw new Error('Failed to fetch subscriptions');
      }
    }),
});

export type StripeRouter = typeof stripeRouter;
