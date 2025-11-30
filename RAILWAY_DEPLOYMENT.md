# Railway Deployment Guide

Complete guide for deploying the Shaun Critzer memoir website to Railway with MySQL database, Stripe integration, and ConvertKit.

## Prerequisites

- Railway account (https://railway.app)
- Stripe account with test products created
- ConvertKit account configured
- GitHub repository connected to Railway

---

## Step 1: Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose the `shauncritzer/memoir` repository
5. Select branch: `claude/add-stripe-credentials-01URJqc8GgkB8KbWV3qgP3Sz` (or `main` if merged)

---

## Step 2: Add MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway will automatically create a MySQL database
4. The `DATABASE_URL` will be automatically added to your environment variables

---

## Step 3: Configure Environment Variables

In your Railway service (not the database), go to the **Variables** tab and add:

### Authentication & Core
```bash
VITE_APP_ID=your-manus-app-id
JWT_SECRET=your-random-jwt-secret-here
OAUTH_SERVER_URL=https://oauth.manus.space
OWNER_OPEN_ID=your-owner-open-id
NODE_ENV=production
```

### Database (Auto-populated)
```bash
# This is automatically set by Railway when you add MySQL
DATABASE_URL=mysql://user:password@host:port/database
```

### Stripe Integration
```bash
# Use your test keys initially, then switch to live keys for production
# Get these from: https://dashboard.stripe.com/test/apikeys
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Get these from Stripe Dashboard → Products → Copy Price IDs
STRIPE_PRICE_RESET_CHALLENGE=price_YOUR_RESET_CHALLENGE_PRICE_ID
STRIPE_PRICE_RECOVERY_ROADMAP=price_YOUR_RECOVERY_ROADMAP_PRICE_ID
STRIPE_PRICE_MONTHLY_MEMBERSHIP=price_YOUR_MONTHLY_MEMBERSHIP_PRICE_ID

# Optional - for webhooks (leave blank for now)
STRIPE_WEBHOOK_SECRET=
```

### ConvertKit (Optional)
```bash
CONVERTKIT_API_KEY=your-convertkit-api-key
CONVERTKIT_API_SECRET=your-convertkit-api-secret
```

### AWS S3 (Optional - for file uploads)
```bash
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### Forge API (Optional - for AI features)
```bash
BUILT_IN_FORGE_API_URL=https://forge.manus.space
BUILT_IN_FORGE_API_KEY=your-forge-api-key
```

---

## Step 4: Deploy and Build

1. Railway will automatically trigger a deployment after you add environment variables
2. Wait for the build to complete (check the **Deployments** tab)
3. If the build fails, check the logs for errors

---

## Step 5: Run Database Migrations

Once the app is deployed, you need to create the database tables:

### Option A: Using Railway CLI (Recommended)

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link to your project:
   ```bash
   railway link
   ```

4. Run migrations:
   ```bash
   railway run pnpm db:push
   ```

### Option B: Using Railway Dashboard

1. Go to your service in Railway
2. Click on the **Settings** tab
3. Scroll to **Deploy Command**
4. Temporarily change it to: `pnpm db:push && pnpm start`
5. Trigger a new deployment
6. Once migrations run successfully, change it back to: `pnpm start`

---

## Step 6: Seed the Database

After migrations are complete, seed the database with initial data:

### Using Railway CLI

```bash
railway run pnpm seed
```

This will populate:
- ✅ 5 blog posts
- ✅ 3 lead magnets (First 3 Chapters, Recovery Toolkit, Reading Guide)

**Note:** Paid products are managed in Stripe, not the local database. The app fetches product information from Stripe using the Price IDs you configured.

### Verify Seeding

You should see output like:
```
🌱 Starting database seeding...

📋 Checking for admin user...
✓ Admin user found: your-email@example.com

📝 Seeding blog posts...
  ✓ The Difference Between Sobriety and Recovery
  ✓ Why I Finally Talked About My Childhood Sexual Abuse
  ✓ The Armor We Build Becomes Our Prison
  ✓ What EMDR Therapy Did for My Trauma
  ✓ How I Co-Parent Peacefully with My Ex-Wife
✓ Seeded 5 blog posts

📚 Seeding lead magnets...
  ✓ First 3 Chapters - Free Excerpt
  ✓ Recovery Toolkit - Practical Worksheets
  ✓ Crooked Lines Reading Guide
✓ Seeded 3 lead magnets

✅ Database seeding complete!
```

---

## Step 7: First Login (Create Admin User)

**IMPORTANT:** Before running the seed script, you must log in to the website to create your admin account.

1. Visit your Railway app URL
2. Log in using your OAuth provider (Google, GitHub, etc.)
3. This creates your user account in the database
4. **Then** run the seed script (Step 6)

If you run the seed script before logging in, it will fail because it can't find an admin user to assign as the blog post author.

---

## Step 8: Verify Deployment

### Check the Website

1. Visit your Railway app URL (found in **Settings** → **Domains**)
2. Verify these pages load:
   - **Homepage** (/)
   - **About** (/about)
   - **Blog** (/blog) - should show 5 posts
   - **Resources** (/resources) - should show 3 lead magnets

### Test Stripe Integration

1. Go to a product page (if you've created one)
2. Click "Purchase"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Verify checkout redirects to Stripe and back
5. Check Stripe Dashboard → Payments for the test transaction

### Test Lead Magnets

1. Go to `/resources`
2. Enter an email and download a lead magnet
3. Check ConvertKit to verify the subscriber was added
4. Check that the PDF downloads successfully

---

## Step 9: Get Stripe Price IDs

If you haven't already, get your Stripe Price IDs:

1. Go to https://dashboard.stripe.com/test/products
2. Click on each product:
   - 7-Day Reset Challenge ($27)
   - Recovery Roadmap Course ($97)
   - Monthly Membership ($29/month)
3. Copy the **Price ID** (starts with `price_`)
4. Add them to Railway environment variables (Step 3)

---

## Troubleshooting

### Build Fails

- Check the build logs in Railway
- Ensure all required environment variables are set
- Verify `DATABASE_URL` is set correctly

### Database Connection Fails

- Make sure the MySQL database is running in Railway
- Verify `DATABASE_URL` environment variable is set
- Check that the database and app service are in the same project

### Seed Script Fails

**Error: "No admin user found"**
- Solution: Log in to the website first to create your account
- Then run `railway run pnpm seed`

**Error: "connect ETIMEDOUT"**
- Solution: The database might not be ready yet
- Wait a few minutes and try again

### Stripe Checkout Doesn't Work

- Verify `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` are set
- Verify `STRIPE_PRICE_*` environment variables have the correct Price IDs
- Check Stripe Dashboard logs for errors

---

## Production Checklist

Before switching to production:

- [ ] Switch Stripe keys from test to live mode
- [ ] Get live Stripe Product/Price IDs
- [ ] Set up Stripe webhooks for subscription management
- [ ] Configure custom domain in Railway
- [ ] Set `NODE_ENV=production`
- [ ] Update ConvertKit forms for production
- [ ] Test complete purchase flow end-to-end
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Configure backups for MySQL database
- [ ] Set up SSL certificate (automatic with Railway)

---

## Useful Railway Commands

```bash
# View logs
railway logs

# Run command in Railway environment
railway run <command>

# Push database schema
railway run pnpm db:push

# Seed database
railway run pnpm seed

# SSH into container
railway shell

# Open Railway dashboard
railway open
```

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Stripe Docs: https://stripe.com/docs
- Drizzle ORM Docs: https://orm.drizzle.team

---

**You're all set! 🚀**
