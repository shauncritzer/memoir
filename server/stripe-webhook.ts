/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for product purchases and subscriptions.
 * Automatically adds customers to ConvertKit forms after successful payment.
 * 
 * Stripe Webhook Documentation: https://stripe.com/docs/webhooks
 */

import Stripe from "stripe";
import { subscribeToForm, CONVERTKIT_FORMS } from "./convertkit";

// Initialize Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.warn("[Stripe Webhook] STRIPE_SECRET_KEY not configured");
}
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: "2025-11-17.clover",
}) : null;

/**
 * Stripe Price ID to ConvertKit Form ID mapping
 * 
 * Actual Price IDs from Stripe dashboard (via Railway environment variables)
 */
export const STRIPE_PRICE_TO_CONVERTKIT_FORM: Record<string, string> = {
  // 7-Day Reset ($27 one-time)
  "price_1SYt2tC2dOpPzSOOpg5Pw7eU": CONVERTKIT_FORMS.SEVEN_DAY_RESET_PURCHASE,
  
  // From Broken to Whole ($97 one-time)
  "price_1SYt3kC2dOpPzSOOpAokf1UQ": CONVERTKIT_FORMS.FROM_BROKEN_TO_WHOLE_PURCHASE,
  
  // Bent Not Broken Circle ($29/month recurring)
  "price_1SYt3iC2dOpPzSOOR7dbuGtY": CONVERTKIT_FORMS.BENT_NOT_BROKEN_CIRCLE_MEMBERSHIP,
};

/**
 * Product names for logging
 */
export const STRIPE_PRICE_TO_PRODUCT_NAME: Record<string, string> = {
  "price_1SYt2tC2dOpPzSOOpg5Pw7eU": "7-Day Reset",
  "price_1SYt3kC2dOpPzSOOpAokf1UQ": "From Broken to Whole",
  "price_1SYt3iC2dOpPzSOOR7dbuGtY": "Bent Not Broken Circle Membership",
};

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<{ success: boolean; message: string }> {
  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        return await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      
      case "invoice.payment_succeeded":
        return await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        return { success: true, message: "Event type not handled" };
    }
  } catch (error) {
    console.error("[Stripe Webhook] Error handling event:", error);
    return { success: false, message: String(error) };
  }
}

/**
 * Handle successful checkout session
 * Triggered when a customer completes a one-time purchase
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<{ success: boolean; message: string }> {
  const customerEmail = session.customer_email || session.customer_details?.email;
  
  if (!customerEmail) {
    console.error("[Stripe Webhook] No customer email found in session");
    return { success: false, message: "No customer email" };
  }

  // Get line items to determine which product was purchased
  if (!stripe) {
    return { success: false, message: "Stripe not configured" };
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
  
  for (const item of lineItems.data) {
    const priceId = item.price?.id;
    if (!priceId) continue;

    const convertKitFormId = STRIPE_PRICE_TO_CONVERTKIT_FORM[priceId];
    const productName = STRIPE_PRICE_TO_PRODUCT_NAME[priceId] || "Unknown Product";

    if (!convertKitFormId) {
      console.warn(`[Stripe Webhook] No ConvertKit form mapped for price ID: ${priceId}`);
      continue;
    }

    // Subscribe customer to ConvertKit form
    console.log(`[Stripe Webhook] Adding ${customerEmail} to ConvertKit form ${convertKitFormId} for ${productName}`);
    
    const result = await subscribeToForm({
      email: customerEmail,
      firstName: session.customer_details?.name?.split(" ")[0],
      formUid: convertKitFormId,
    });

    if (result.success) {
      console.log(`[Stripe Webhook] Successfully added ${customerEmail} to ConvertKit for ${productName}`);
    } else {
      console.error(`[Stripe Webhook] Failed to add ${customerEmail} to ConvertKit:`, result.error);
      return { success: false, message: result.error || "ConvertKit subscription failed" };
    }

    // Also create purchase record in database for course access
    const productInfo = STRIPE_PRICE_TO_PRODUCT_ID[priceId];
    if (productInfo) {
      await createPurchaseRecord({
        customerEmail,
        customerName: session.customer_details?.name,
        productId: productInfo.productId,
        amount: productInfo.amount,
        stripePaymentId: session.payment_intent as string,
        stripeCustomerId: session.customer as string,
      });
    }
  }

  return { success: true, message: "Customer added to ConvertKit and database" };
}

/**
 * Handle successful invoice payment
 * Triggered for recurring subscription payments
 */
async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<{ success: boolean; message: string }> {
  const customerEmail = invoice.customer_email;
  
  if (!customerEmail) {
    console.error("[Stripe Webhook] No customer email found in invoice");
    return { success: false, message: "No customer email" };
  }

  // For recurring payments, we only want to trigger on the FIRST payment
  // Check if this is the first invoice for this subscription
  if (invoice.billing_reason !== "subscription_create") {
    console.log(`[Stripe Webhook] Skipping recurring invoice (billing_reason: ${invoice.billing_reason})`);
    return { success: true, message: "Recurring payment, no action needed" };
  }

  // Get the price ID from the invoice line items
  const lineItems = invoice.lines.data;
  
  for (const item of lineItems) {
    const priceId = (item as any).price?.id;
    if (!priceId) continue;

    const convertKitFormId = STRIPE_PRICE_TO_CONVERTKIT_FORM[priceId];
    const productName = STRIPE_PRICE_TO_PRODUCT_NAME[priceId] || "Unknown Product";

    if (!convertKitFormId) {
      console.warn(`[Stripe Webhook] No ConvertKit form mapped for price ID: ${priceId}`);
      continue;
    }

    // Subscribe customer to ConvertKit form
    console.log(`[Stripe Webhook] Adding ${customerEmail} to ConvertKit form ${convertKitFormId} for ${productName}`);
    
    const result = await subscribeToForm({
      email: customerEmail,
      formUid: convertKitFormId,
    });

    if (result.success) {
      console.log(`[Stripe Webhook] Successfully added ${customerEmail} to ConvertKit for ${productName}`);
    } else {
      console.error(`[Stripe Webhook] Failed to add ${customerEmail} to ConvertKit:`, result.error);
      return { success: false, message: result.error || "ConvertKit subscription failed" };
    }

    // Also create purchase record in database for course access
    const productInfo = STRIPE_PRICE_TO_PRODUCT_ID[priceId];
    if (productInfo) {
      await createPurchaseRecord({
        customerEmail,
        customerName: null, // Invoice doesn't have customer name
        productId: productInfo.productId,
        amount: productInfo.amount,
        stripePaymentId: invoice.id, // Use invoice ID for subscriptions
        stripeCustomerId: invoice.customer as string,
      });
    }
  }

  return { success: true, message: "Customer added to ConvertKit and database" };
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event | null {
  if (!stripe) {
    console.error("[Stripe Webhook] Stripe not configured");
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("[Stripe Webhook] Signature verification failed:", error);
    return null;
  }
}


/**
 * Stripe Price ID to Product ID mapping for database
 */
export const STRIPE_PRICE_TO_PRODUCT_ID: Record<string, { productId: string; amount: number }> = {
  "price_1SYt2tC2dOpPzSOOpg5Pw7eU": { productId: "7-day-reset", amount: 2700 },
  "price_1SYt3kC2dOpPzSOOpAokf1UQ": { productId: "from-broken-to-whole", amount: 9700 },
  "price_1SYt3iC2dOpPzSOOR7dbuGtY": { productId: "bent-not-broken-circle", amount: 2900 },
};

/**
 * Create purchase record in database for course access
 */
async function createPurchaseRecord(data: {
  customerEmail: string;
  customerName?: string | null;
  productId: string;
  amount: number;
  stripePaymentId: string;
  stripeCustomerId: string;
}) {
  const { getDb } = await import("./db");
  const { purchases, users } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return;
  }

  // Find or create user
  let user = await db
    .select()
    .from(users)
    .where(eq(users.email, data.customerEmail))
    .limit(1);

  let userId: number;

  if (user[0]) {
    userId = user[0].id;
    console.log(`[Stripe Webhook] Found existing user: ${userId}`);
  } else {
    // Create new user account
    const result = await db.insert(users).values({
      email: data.customerEmail,
      name: data.customerName || data.customerEmail.split("@")[0],
      openId: `stripe_${data.stripeCustomerId}`,
      loginMethod: "email",
      role: "user",
      lastSignedIn: new Date(),
    });
    
    userId = Number(result[0].insertId);
    console.log(`[Stripe Webhook] Created new user: ${userId}`);
  }

  // Create purchase record
  await db.insert(purchases).values({
    userId,
    productId: data.productId,
    stripePaymentId: data.stripePaymentId,
    stripeCustomerId: data.stripeCustomerId,
    amount: data.amount,
    status: "completed",
    purchasedAt: new Date(),
  });

  console.log(`[Stripe Webhook] Purchase recorded: ${data.productId} for user ${userId}`);
}
