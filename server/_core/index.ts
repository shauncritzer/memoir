import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleStripeWebhook, verifyWebhookSignature } from "../stripe-webhook";
import { quickSeedHandler } from "../quickSeed.js";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Stripe webhook endpoint - MUST be before body parser middleware
  // Stripe requires raw body for signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const signature = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!signature || typeof signature !== "string") {
        console.error("[Stripe Webhook] No signature header");
        return res.status(400).send("No signature");
      }

      if (!webhookSecret) {
        console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured");
        return res.status(500).send("Webhook secret not configured");
      }

      // Verify webhook signature
      const event = verifyWebhookSignature(req.body, signature, webhookSecret);

      if (!event) {
        console.error("[Stripe Webhook] Invalid signature");
        return res.status(400).send("Invalid signature");
      }

      // Handle the event
      const result = await handleStripeWebhook(event);

      if (result.success) {
        res.json({ received: true, message: result.message });
      } else {
        res.status(500).json({ error: result.message });
      }
    }
  );
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Quick seed endpoint - direct database seeding bypass
  app.get("/api/quick-seed", quickSeedHandler);

  // Diagnostic endpoint to check database state
  app.get("/api/debug/products", async (req, res) => {
    try {
      const { getActiveProducts } = await import("../db.js");
      const products = await getActiveProducts();

      const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.length > 0);

      return res.json({
        productsCount: products.length,
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          stripePriceId: p.stripePriceId,
          type: p.type,
          status: p.status,
        })),
        stripeConfigured,
        stripeKeyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 10) + "..." : "NOT SET",
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message, stack: error.stack });
    }
  });

  // Diagnostic endpoint to test Stripe connection
  app.get("/api/debug/stripe", async (req, res) => {
    try {
      const key = process.env.STRIPE_SECRET_KEY;

      if (!key) {
        return res.json({
          error: "STRIPE_SECRET_KEY not set",
          keyExists: false,
        });
      }

      // Check for invalid characters
      const hasInvalidChars = /[^\x20-\x7E]/.test(key);
      const trimmedLength = key.trim().length;
      const actualLength = key.length;

      const result: any = {
        keyExists: true,
        keyLength: actualLength,
        keyTrimmedLength: trimmedLength,
        hasWhitespace: actualLength !== trimmedLength,
        hasInvalidChars,
        keyPrefix: key.substring(0, 15),
        keySuffix: key.substring(key.length - 10),
        keyStartsWithSkTest: key.startsWith('sk_test_'),
      };

      // Try to initialize Stripe
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(key, { apiVersion: '2025-01-27.acacia' });

        // Try to make a simple API call
        const balance = await stripe.balance.retrieve();
        result.stripeConnectionSuccess = true;
        result.stripeAccountCurrency = balance.available[0]?.currency;
      } catch (stripeError: any) {
        result.stripeConnectionSuccess = false;
        result.stripeError = {
          message: stripeError.message,
          type: stripeError.type,
          code: stripeError.code,
        };
      }

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        error: error.message,
        stack: error.stack
      });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
