# Stripe Integration Setup Guide

This guide will help you complete the Stripe integration for the Shaun Critzer memoir website.

## Current Status ✅

The following has been completed:
- ✅ Stripe SDK installed (`stripe@20.0.0`)
- ✅ Environment variables configured in `server/_core/env.ts`
- ✅ Stripe router created with all payment procedures (`server/stripe.ts`)
- ✅ Router integrated into the main app (`server/routers.ts`)
- ✅ `.env.example` file created with all required variables

## Products Already Created in Stripe ✅

You've already created these products in your Stripe Test account:
1. **7-Day Reset Challenge** - $27.00 USD (one-time)
2. **Recovery Roadmap Course** - $97.00 USD (one-time)
3. **Monthly Membership** - $29.00 USD (recurring monthly)

## What You Need to Do Now

### Step 1: Get Stripe Price IDs

You need to get the **Price IDs** (not Product IDs) for each product:

1. Go to https://dashboard.stripe.com/test/products
2. Click on each product
3. In the "Pricing" section, you'll see the **Price ID** (starts with `price_`)
4. Copy each Price ID

Example:
```
7-Day Reset Challenge: price_1ABC123...
Recovery Roadmap Course: price_1DEF456...
Monthly Membership: price_1GHI789...
```

### Step 2: Add Price IDs to Environment Variables

On Railway (or your local `.env` file), add these variables:

```bash
# Stripe API Keys (use your test keys from the user message)
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Stripe Price IDs (replace with your actual Price IDs from Step 1)
STRIPE_PRICE_RESET_CHALLENGE=price_YOUR_RESET_CHALLENGE_PRICE_ID
STRIPE_PRICE_RECOVERY_ROADMAP=price_YOUR_RECOVERY_ROADMAP_PRICE_ID
STRIPE_PRICE_MONTHLY_MEMBERSHIP=price_YOUR_MONTHLY_MEMBERSHIP_PRICE_ID

# Stripe Webhook Secret (optional for now, needed for production)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Step 3: How to Use the Stripe Integration

The Stripe integration provides several endpoints via tRPC:

#### 1. Create a Checkout Session

From your React components, you can create a checkout session like this:

```typescript
import { trpc } from '@/lib/trpc';

function PurchaseButton({ priceId, productName }) {
  const createCheckout = trpc.stripe.createCheckoutSession.useMutation();

  const handlePurchase = async () => {
    const result = await createCheckout.mutateAsync({
      priceId: priceId, // e.g., process.env.STRIPE_PRICE_RESET_CHALLENGE
      successUrl: `${window.location.origin}/purchase/success`,
      cancelUrl: `${window.location.origin}/purchase/cancelled`,
      customerEmail: 'user@example.com', // Optional
    });

    // Redirect to Stripe Checkout
    window.location.href = result.url;
  };

  return (
    <button onClick={handlePurchase}>
      Purchase {productName}
    </button>
  );
}
```

#### 2. Get All Available Products

```typescript
const { data: products } = trpc.stripe.getProducts.useQuery();

// Returns all active products with pricing info
products?.map(product => ({
  name: product.name,
  price: product.amount / 100, // Convert cents to dollars
  priceId: product.priceId,
}));
```

#### 3. Verify a Purchase

After Stripe redirects back to your success page:

```typescript
const sessionId = new URLSearchParams(window.location.search).get('session_id');
const { data: session } = trpc.stripe.verifyCheckoutSession.useQuery({
  sessionId: sessionId!,
});

if (session.paymentStatus === 'paid') {
  // Purchase successful!
}
```

## Railway Deployment Setup

### Environment Variables to Add on Railway:

1. Go to your Railway project
2. Click on your service
3. Go to the **Variables** tab
4. Add these variables:

```
# Use the Stripe test credentials provided separately
STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>
STRIPE_SECRET_KEY=<your_stripe_secret_key>
STRIPE_PRICE_RESET_CHALLENGE=<your_price_id>
STRIPE_PRICE_RECOVERY_ROADMAP=<your_price_id>
STRIPE_PRICE_MONTHLY_MEMBERSHIP=<your_price_id>
```

## Branch and Deployment Strategy

### Option 1: Deploy from Feature Branch (Recommended for Testing)
- Railway can deploy directly from `claude/add-stripe-credentials-01URJqc8GgkB8KbWV3qgP3Sz`
- Good for testing before merging to main
- Set the branch in Railway's deployment settings

### Option 2: Merge to Main First
- Merge the branch to main after testing locally
- Deploy main branch to Railway
- Better for production-ready code

**Recommendation:** Test on this branch first, then merge to main once everything works.

## Testing the Integration

### 1. Test Locally First

```bash
# Create a .env file with your Stripe credentials
cp .env.example .env

# Edit .env and add your Stripe keys and Price IDs

# Run the development server
pnpm dev
```

### 2. Use Stripe Test Cards

When testing checkout, use these test card numbers:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- Use any future expiry date and any CVC

### 3. Monitor in Stripe Dashboard

- Go to https://dashboard.stripe.com/test/payments
- You'll see all test payments appear here

## Next Steps

1. ✅ Get Price IDs from Stripe Dashboard
2. ✅ Add Price IDs to Railway environment variables
3. ✅ Deploy to Railway
4. ✅ Test a checkout flow end-to-end
5. ⏳ (Future) Set up webhooks for subscription management
6. ⏳ (Future) Switch to Live mode when ready to accept real payments

## Available Stripe Procedures

The following tRPC procedures are available in `server/stripe.ts`:

- `stripe.createCheckoutSession` - Create a new checkout session
- `stripe.getProducts` - List all products and their prices
- `stripe.verifyCheckoutSession` - Verify a completed purchase
- `stripe.createPortalSession` - Create customer portal for subscription management
- `stripe.getSubscriptions` - Get customer's subscriptions (admin only)

## Questions?

If you run into issues:
1. Check the Stripe Dashboard logs: https://dashboard.stripe.com/test/logs
2. Check your Railway logs for errors
3. Ensure all environment variables are set correctly
4. Verify your Price IDs are correct (they start with `price_`)

---

**Ready to deploy!** Just get those Price IDs and add them to Railway. 🚀
