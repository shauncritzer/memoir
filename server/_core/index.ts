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
  // Health check endpoint - MUST be before static file catch-all
  app.get("/api/health", async (_req, res) => {
    const health: Record<string, any> = { status: "ok", timestamp: new Date().toISOString() };

    // Parse DATABASE_URL to show host/port (without password)
    const dbUrl = process.env.DATABASE_URL || "";
    try {
      const parsed = new URL(dbUrl);
      health.dbHost = parsed.hostname;
      health.dbPort = parsed.port || "3306";
      health.dbName = parsed.pathname?.replace("/", "") || "unknown";
      health.dbUser = parsed.username || "unknown";
    } catch {
      health.dbHost = "could not parse DATABASE_URL";
    }

    // Try raw mysql2 connection directly
    try {
      const mysql = await import("mysql2/promise");
      const conn = await mysql.default.createConnection(dbUrl);
      const [rows] = await conn.execute("SELECT 1 as test");
      health.database = "connected";
      health.rawQuery = rows;

      // List tables
      const [tables] = await conn.execute("SHOW TABLES");
      health.tables = (tables as any[]).map((r: any) => Object.values(r)[0]);

      await conn.end();
    } catch (err: any) {
      health.database = `error: ${err.message}`;
      health.dbErrorCode = err.code || "unknown";
      health.dbErrorErrno = err.errno || "unknown";
    }

    health.env = {
      NODE_ENV: process.env.NODE_ENV || "not set",
      hasDbUrl: !!process.env.DATABASE_URL,
      dbUrlLength: dbUrl.length,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    };
    res.json(health);
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
    // Start the social media content pipeline scheduler (non-blocking, can't crash server)
    try {
      import("../social/scheduler").then(({ startScheduler }) => {
        startScheduler();
      }).catch((err) => {
        console.error("[Scheduler] Failed to start (non-fatal):", err.message);
      });
    } catch (err: any) {
      console.error("[Scheduler] Import failed (non-fatal):", err.message);
    }
  });
}

startServer().catch(console.error);
