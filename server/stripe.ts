import Stripe from 'stripe';
import { nanoid } from 'nanoid';
import {
  createOrder,
  getOrderBySessionId,
  updateOrder,
  getProductById,
  createPaymentEvent,
  markPaymentEventProcessed
} from './db';
import { subscribeToConvertKit } from './convertkit';

// Initialize Stripe with secret key from environment
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-11-17.clover'
  });
};

/**
 * Create a Stripe checkout session for a product
 */
export async function createCheckoutSession(params: {
  productId: number;
  email?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();
  const product = await getProductById(params.productId);

  if (!product) {
    throw new Error('Product not found');
  }

  if (product.status !== 'active') {
    throw new Error('Product is not available');
  }

  // Generate order number
  const orderNumber = `ORD-${nanoid(10).toUpperCase()}`;

  // Create order in pending state
  const order = await createOrder({
    orderNumber,
    productId: product.id,
    email: params.email || '',
    amount: product.price,
    currency: product.currency,
    status: 'pending'
  });

  // Create Stripe checkout session
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: product.type === 'recurring' ? 'subscription' : 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: orderNumber,
    metadata: {
      orderId: order.id.toString(),
      productId: product.id.toString(),
      orderNumber
    }
  };

  // Add customer email if provided
  if (params.email) {
    sessionParams.customer_email = params.email;
  }

  // Configure line items based on product type
  if (product.type === 'recurring' && product.stripePriceId) {
    // Recurring subscription
    sessionParams.line_items = [
      {
        price: product.stripePriceId,
        quantity: 1
      }
    ];
  } else if (product.stripePriceId) {
    // One-time payment with existing price
    sessionParams.line_items = [
      {
        price: product.stripePriceId,
        quantity: 1
      }
    ];
  } else {
    // One-time payment with dynamic price
    sessionParams.line_items = [
      {
        price_data: {
          currency: product.currency,
          product_data: {
            name: product.name,
            description: product.description || undefined,
            images: product.coverImage ? [product.coverImage] : undefined
          },
          unit_amount: product.price
        },
        quantity: 1
      }
    ];
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  // Update order with session ID
  await updateOrder(order.id, {
    stripeSessionId: session.id
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return {
    sessionId: session.id,
    url: session.url
  };
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhook(params: {
  payload: string;
  signature: string;
}): Promise<{ success: boolean; message: string }> {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      params.payload,
      params.signature,
      webhookSecret
    );
  } catch (err) {
    const error = err as Error;
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }

  // Record the event
  const paymentEvent = await createPaymentEvent({
    eventType: event.type,
    stripeEventId: event.id,
    payload: JSON.stringify(event),
    processed: 0
  });

  try {
    // Process the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'invoice.paid':
        // Handle recurring subscription payments
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await markPaymentEventProcessed(paymentEvent.id);

    return {
      success: true,
      message: `Event ${event.type} processed successfully`
    };
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    throw error;
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const orderNumber = session.client_reference_id;

  if (!orderNumber) {
    console.error('No order number in checkout session');
    return;
  }

  const order = await getOrderBySessionId(session.id);

  if (!order) {
    console.error(`Order not found for session ${session.id}`);
    return;
  }

  // Update order status
  await updateOrder(order.id, {
    status: 'completed',
    email: session.customer_email || order.email,
    stripePaymentIntentId: session.payment_intent as string,
    completedAt: new Date()
  });

  // Get product details for ConvertKit tagging
  const product = await getProductById(order.productId);

  if (product && session.customer_email) {
    // Subscribe to ConvertKit with product tag
    try {
      await subscribeToConvertKit({
        email: session.customer_email,
        firstName: session.customer_details?.name?.split(' ')[0],
        source: `product-purchase-${product.slug}`,
        tags: product.convertKitTagId ? [product.convertKitTagId] : []
      });
    } catch (error) {
      console.error('Failed to add customer to ConvertKit:', error);
    }
  }

  console.log(`Order ${orderNumber} completed successfully`);
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`PaymentIntent ${paymentIntent.id} succeeded`);
  // Additional processing if needed
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`PaymentIntent ${paymentIntent.id} failed`);

  // Find order and mark as failed
  const order = await getOrderBySessionId(paymentIntent.id);
  if (order) {
    await updateOrder(order.id, {
      status: 'failed'
    });
  }
}

/**
 * Handle invoice.paid event (for subscriptions)
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`Invoice ${invoice.id} paid`);

  // For recurring subscriptions, you might want to:
  // 1. Track the payment
  // 2. Extend access to content
  // 3. Send confirmation email
}

/**
 * Retrieve a checkout session
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId);
}
