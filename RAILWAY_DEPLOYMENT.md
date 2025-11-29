# Railway Deployment Guide

Complete guide for deploying the Shaun Critzer memoir website to Railway with Stripe integration.

## 📋 Pre-Deployment Checklist

- [x] GitHub repo connected to Railway: `shauncritzer/memoir`
- [x] Railway deployment successful
- [x] Stripe integration code complete
- [x] ConvertKit integration working
- [ ] Environment variables configured
- [ ] MySQL database connected
- [ ] Database migrations run
- [ ] Products seeded
- [ ] Stripe products created
- [ ] Webhook endpoint configured
- [ ] Public domain generated

---

## 🚀 Step 1: Railway Environment Variables

In your Railway project dashboard, go to **Variables** tab and add the following:

### Core System
```bash
NODE_ENV=production
PORT=3000
```

### Security
```bash
JWT_SECRET=7k9mP2nQ5xR8wT4vL6jH3sD1fG9aB2cE5uY8iO0pM4nX7zV3hK6tW9rJ2qL5dN8b
```

### Database
```bash
# Railway will provide this automatically when you add MySQL
DATABASE_URL=mysql://user:password@host:port/database
```

### ConvertKit
```bash
CONVERTKIT_API_KEY=dZ4CxMb5Zwp-5jy87pwcvQ
CONVERTKIT_API_SECRET=x9Uzt8Xs2179XCHdJ6vZrb_-sq12AGihK_sxmuqK3ZY
```

### Stripe (GET THESE FROM YOUR STRIPE DASHBOARD)
```bash
# For test mode (recommended first):
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# For live mode (after testing):
# STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
# STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
# STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

### App Branding
```bash
VITE_APP_TITLE=Shaun Critzer - Crooked Lines
VITE_APP_LOGO=/logo.png
```

### Manus/OAuth (Optional - only if using blog editor auth)
```bash
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=your_oauth_url
VITE_OAUTH_PORTAL_URL=your_portal_url
OWNER_OPEN_ID=your_open_id
OWNER_NAME=Shaun Critzer
BUILT_IN_FORGE_API_URL=your_forge_url
BUILT_IN_FORGE_API_KEY=your_forge_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
VITE_FRONTEND_FORGE_API_URL=your_frontend_url
```

---

## 🗄️ Step 2: Railway MySQL Database Setup

1. In Railway dashboard, click **New** → **Database** → **MySQL**
2. Railway will automatically create a MySQL instance
3. Copy the `DATABASE_URL` connection string
4. Add it to your environment variables (may be automatic)
5. Wait for database to be ready (~30 seconds)

---

## 🔧 Step 3: Run Database Migrations

### Option A: Via Railway CLI (Recommended)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run migrations
railway run pnpm db:push
```

### Option B: Via Railway Dashboard
1. Go to your service → **Settings** → **Deploy**
2. Add build command: `pnpm install && pnpm db:push && pnpm build`
3. Redeploy

---

## 🌱 Step 4: Seed Products

After migrations are complete, seed the products:

```bash
# Via Railway CLI
railway run tsx seed-products.ts

# Or via Railway shell
# In Railway dashboard → Service → Shell tab
# Then run: tsx seed-products.ts
```

This creates three products:
- 7-Day Reset Challenge ($27)
- Recovery Roadmap Course ($97)
- Monthly Membership ($29/month)

---

## 💳 Step 5: Stripe Configuration

### 5.1 Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Toggle **Test mode** ON (top right)
3. Go to **Developers** → **API keys**
4. Copy **Publishable key** → Add to Railway as `STRIPE_PUBLISHABLE_KEY`
5. Reveal and copy **Secret key** → Add to Railway as `STRIPE_SECRET_KEY`

### 5.2 Create Stripe Products (Optional - for Price IDs)

You can either use dynamic pricing (already configured) OR create products in Stripe:

1. In Stripe Dashboard, go to **Products**
2. Click **Add Product** for each:

   **Product 1: 7-Day Reset Challenge**
   - Name: `7-Day Reset Challenge`
   - Price: `$27.00 USD` (one-time)
   - Copy the **Price ID** (starts with `price_`)

   **Product 2: Recovery Roadmap Course**
   - Name: `Recovery Roadmap Course`
   - Price: `$97.00 USD` (one-time)
   - Copy the **Price ID**

   **Product 3: Monthly Membership**
   - Name: `Monthly Membership`
   - Price: `$29.00 USD` (recurring monthly)
   - Copy the **Price ID**

3. Update database with Stripe IDs:
```sql
-- Connect to your Railway MySQL database
UPDATE products SET stripe_price_id = 'price_xxxxx' WHERE slug = '7-day-reset';
UPDATE products SET stripe_price_id = 'price_xxxxx' WHERE slug = 'recovery-roadmap';
UPDATE products SET stripe_price_id = 'price_xxxxx' WHERE slug = 'membership';
```

### 5.3 Configure Stripe Webhook

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-railway-domain.up.railway.app/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.paid` (for subscriptions)
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to Railway as `STRIPE_WEBHOOK_SECRET`

---

## 🏷️ Step 6: ConvertKit Tag Setup

Create tags in ConvertKit for each product:

1. Go to ConvertKit → **Subscribers** → **Tags**
2. Create three new tags:
   - `Product: 7-Day Reset`
   - `Product: Recovery Roadmap`
   - `Product: Monthly Member`
3. Hover over each tag to see the tag ID in the URL
4. Update database with tag IDs:

```sql
UPDATE products SET convertkit_tag_id = '12345678' WHERE slug = '7-day-reset';
UPDATE products SET convertkit_tag_id = '12345679' WHERE slug = 'recovery-roadmap';
UPDATE products SET convertkit_tag_id = '12345680' WHERE slug = 'membership';
```

---

## 🌐 Step 7: Domain Configuration

### Get Railway Public Domain
1. In Railway dashboard, go to your service → **Settings**
2. Scroll to **Domains**
3. Click **Generate Domain**
4. You'll get: `your-project.up.railway.app`

### Connect Custom Domain (Optional)
1. In Railway → **Settings** → **Domains**
2. Click **Custom Domain**
3. Enter: `shauncritzer.com`
4. Railway will show you DNS records to add
5. Go to Namecheap → DNS settings
6. Add the CNAME record provided by Railway
7. Wait 5-10 minutes for propagation

---

## ✅ Step 8: Testing Checklist

### Test in Stripe Test Mode

1. **Test Email Capture**
   - Visit homepage
   - Enter email in newsletter form
   - Check ConvertKit for new subscriber

2. **Test Product Pages**
   - Visit: `/products/7-day-reset`
   - Visit: `/products/recovery-roadmap`
   - Visit: `/products/membership`
   - All should load with correct pricing

3. **Test Stripe Checkout**
   - Click "Continue to Checkout" on any product
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Complete purchase

4. **Test Success Flow**
   - After successful payment, should redirect to `/success`
   - Check order details are displayed
   - Check email received (from ConvertKit)
   - Check ConvertKit for product tag applied

5. **Test Cancel Flow**
   - Start checkout, then click "Back" in Stripe
   - Should redirect to `/cancel`

6. **Test Webhook**
   - In Stripe Dashboard → **Developers** → **Webhooks**
   - Click on your webhook
   - View **Event log** to see received events
   - Should show `checkout.session.completed` events

---

## 🔴 Going Live (After Testing)

When ready to accept real payments:

1. **Switch to Live Mode**
   - Go to Stripe Dashboard
   - Toggle **Test mode** OFF (top right)
   - Get new live API keys from **Developers** → **API keys**
   - Update Railway environment variables:
     ```bash
     STRIPE_SECRET_KEY=sk_live_xxxxx
     STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
     ```

2. **Recreate Products in Live Mode**
   - Products created in test mode don't transfer
   - Create all 3 products again in live mode
   - Update database with new live Price IDs

3. **Update Webhook to Live Mode**
   - Create new webhook in live mode
   - Same endpoint URL
   - Get new signing secret
   - Update `STRIPE_WEBHOOK_SECRET` in Railway

4. **Final Test**
   - Make a small real purchase ($1 test)
   - Refund immediately in Stripe Dashboard
   - Verify everything works

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check DATABASE_URL format
mysql://user:password@host:port/database

# Verify connection
railway run tsx -e "import('./server/db.js').then(db => db.getDb())"
```

### Webhook Not Receiving Events
- Check endpoint URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` is set
- Check Railway logs for errors
- Test webhook in Stripe Dashboard → **Send test webhook**

### Products Not Showing
```bash
# Check products exist in database
railway run tsx -e "import('./server/db.js').then(db => db.getActiveProducts().then(console.log))"
```

### ConvertKit Tags Not Applying
- Check `convertKitTagId` in products table
- Verify ConvertKit API keys are correct
- Check Railway logs for ConvertKit errors

---

## 📊 Monitoring

### Railway Logs
View real-time logs in Railway Dashboard → **Deployments** → Click latest → **View Logs**

### Stripe Dashboard
Monitor payments, customers, and events in real-time

### ConvertKit Dashboard
View new subscribers and tag applications

---

## 🔐 Security Notes

- Never commit `.env` file to git
- Rotate `JWT_SECRET` if exposed
- Use Stripe test mode until fully ready
- Keep webhook secrets secure
- Monitor Railway logs for suspicious activity

---

## 📞 Support Resources

- **Railway Docs**: https://docs.railway.app/
- **Stripe Docs**: https://stripe.com/docs
- **ConvertKit API**: https://developers.convertkit.com/
- **GitHub Issues**: https://github.com/shauncritzer/memoir/issues

---

## ✨ Summary

Your memoir site is now configured with:

✅ **Email Marketing**: ConvertKit integration for lead capture
✅ **Payment Processing**: Stripe for one-time and recurring payments
✅ **Product Management**: 3 products ready for sale
✅ **Automated Workflows**: Customers automatically tagged in ConvertKit
✅ **Professional Checkout**: Secure Stripe checkout flow
✅ **Order Tracking**: Full order history in database

**Revenue-ready in ~90 minutes!** 🚀
