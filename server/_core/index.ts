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

  // Image proxy for Instagram (DALL-E URLs expire, IG needs a public URL to fetch)
  try {
    const { registerImageProxy } = require("../social/image-proxy");
    registerImageProxy(app);
  } catch (err: any) {
    console.warn("[Server] Image proxy registration failed (non-fatal):", err.message);
  }

  // ─── /recommends/:slug — Affiliate link redirects ─────────────────────────
  // Looks up the CTA offer by slug, tracks the click, and redirects to the affiliate URL.
  // If no affiliate URL is set, redirects to the CTA URL on the site.
  app.get("/recommends/:slug", async (req, res) => {
    const { slug } = req.params;
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) {
        return res.redirect("/products");
      }

      const { sql } = await import("drizzle-orm");

      // Look up the CTA offer by matching the slug in the ctaUrl
      const [rows] = await db.execute(
        sql`SELECT id, cta_url, affiliate_url, name FROM cta_offers
            WHERE cta_url LIKE ${`%/recommends/${slug}%`}
            OR cta_url LIKE ${`%recommends/${slug}%`}
            LIMIT 1`
      ) as any;

      const offer = (rows as any[])?.[0];

      if (!offer) {
        console.log(`[Recommends] No offer found for slug: ${slug}`);
        return res.redirect("/products");
      }

      // Track the click
      try {
        await db.execute(
          sql`UPDATE cta_offers SET clicks = clicks + 1 WHERE id = ${offer.id}`
        );
      } catch {
        // Non-fatal — click tracking failure shouldn't block redirect
      }

      // Redirect to affiliate URL if set, otherwise fall back to products page
      const redirectUrl = offer.affiliate_url || "/products";
      console.log(`[Recommends] ${slug} → ${redirectUrl} (offer: ${offer.name})`);
      return res.redirect(302, redirectUrl);
    } catch (err: any) {
      console.error(`[Recommends] Error for ${slug}:`, err.message);
      return res.redirect("/products");
    }
  });

  // TikTok domain verification - serves verification file from env var
  // Set TIKTOK_VERIFICATION_CODE in Railway, e.g. "tiktok-developers-site-verification=XXXXX"
  app.get("/tiktok-*.txt", (req, res) => {
    const code = process.env.TIKTOK_VERIFICATION_CODE;
    if (code) {
      res.type("text/plain").send(code);
    } else {
      res.status(404).send("Not found");
    }
  });

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

  // Bootstrap first admin account - POST /api/admin/bootstrap
  // Creates account + promotes to admin in one step using ADMIN_SECRET
  app.post("/api/admin/bootstrap", async (req, res) => {
    try {
      const { secret, email, password, name } = req.body;
      const adminSecret = process.env.ADMIN_SECRET;

      if (!adminSecret || secret !== adminSecret) {
        return res.status(403).json({ error: "Invalid admin secret" });
      }
      if (!email || !password || !name) {
        return res.status(400).json({ error: "email, password, and name are required" });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const { drizzle } = await import("drizzle-orm/mysql2");
      const { users } = await import("../../drizzle/schema");
      const { eq, sql } = await import("drizzle-orm");
      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);

      const db = drizzle(process.env.DATABASE_URL!);

      // Ensure passwordHash column exists
      try {
        await db.execute(sql`ALTER TABLE users ADD COLUMN passwordHash VARCHAR(256) NULL`);
      } catch (e: any) {
        if (!e.message?.includes("Duplicate column")) throw e;
      }

      // Hash password
      const salt = randomBytes(16).toString("hex");
      const buf = await scryptAsync(password, salt, 64) as Buffer;
      const hash = `${salt}:${buf.toString("hex")}`;

      // Check if user exists
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (existing.length > 0) {
        // Promote existing user to admin + set password
        await db.update(users).set({
          role: "admin",
          passwordHash: hash,
          name,
          lastSignedIn: new Date(),
        }).where(eq(users.id, existing[0].id));

        return res.json({ success: true, message: `Existing user ${email} promoted to admin` });
      }

      // Create new admin user
      const openId = `email_${Date.now()}_${randomBytes(8).toString("hex")}`;
      await db.insert(users).values({
        openId,
        email,
        name,
        passwordHash: hash,
        loginMethod: "email",
        role: "admin",
        lastSignedIn: new Date(),
      });

      return res.json({ success: true, message: `Admin account created for ${email}` });
    } catch (err: any) {
      console.error("[Bootstrap] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // HeyGen webhook - receives video completion notifications
  app.post("/api/heygen/webhook", async (req, res) => {
    try {
      const { event_type, event_data } = req.body;
      console.log(`[HeyGen Webhook] Event: ${event_type}`, event_data?.video_id);

      if (event_type === "avatar_video.success" && event_data?.video_id) {
        // Video completed - could auto-trigger YouTube upload here
        console.log(`[HeyGen Webhook] Video completed: ${event_data.video_id}, URL: ${event_data.url}`);
      } else if (event_type === "avatar_video.fail") {
        console.error(`[HeyGen Webhook] Video failed: ${event_data?.video_id}`);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[HeyGen Webhook] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Auth helper for scheduler endpoints
  function verifySchedulerAuth(req: any): boolean {
    const secret = process.env.N8N_WEBHOOK_SECRET;
    if (!secret) return true;
    const authHeader = req.headers.authorization || "";
    const queryToken = req.query.token || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    return bearerToken === secret || queryToken === secret;
  }

  // n8n / external scheduler trigger — runs one full content pipeline cycle
  // Now uses LangGraph orchestration for research → content → publish → metrics
  // Secured via N8N_WEBHOOK_SECRET (Bearer token or query param)
  app.post("/api/scheduler/run", async (req, res) => {
    try {
      if (!verifySchedulerAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Use LangGraph orchestrator (wraps the same underlying functions)
      const { runContentGraph } = await import("../agent/langgraph-orchestrator");
      const result = await runContentGraph();
      console.log(`[Scheduler] LangGraph pipeline completed:`, result);
      res.json(result);
    } catch (err: any) {
      console.error("[Scheduler] LangGraph pipeline error, falling back to legacy:", err.message);
      // Fallback to legacy scheduler if LangGraph fails
      try {
        const { runSchedulerCycle } = await import("../social/scheduler");
        const result = await runSchedulerCycle();
        console.log(`[Scheduler] Legacy fallback completed:`, result);
        res.json({ ...result, fallback: true });
      } catch (fallbackErr: any) {
        res.status(500).json({ error: fallbackErr.message });
      }
    }
  });

  // Full orchestration endpoint — runs all loops (content + revenue + strategy + niche)
  // Use this for the hourly n8n trigger when you want the full autonomous cycle
  app.post("/api/orchestrator/run", async (req, res) => {
    try {
      if (!verifySchedulerAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { runFullOrchestration } = await import("../agent/langgraph-orchestrator");
      const result = await runFullOrchestration();
      console.log(`[Orchestrator] Full LangGraph orchestration completed:`, result);
      res.json(result);
    } catch (err: any) {
      console.error("[Orchestrator] Full orchestration error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Telegram webhook — receives button callbacks (approve/deny actions)
  app.post("/api/telegram/webhook", async (req, res) => {
    try {
      const { handleTelegramWebhook } = await import("../agent/telegram");
      const result = await handleTelegramWebhook(req.body);
      res.json(result);
    } catch (err: any) {
      console.error("[Telegram] Webhook error:", err.message);
      res.json({ handled: false, error: err.message });
    }
  });

  // Telegram test — send a test message to verify the bot works
  app.post("/api/telegram/test", async (req, res) => {
    try {
      if (!verifySchedulerAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { sendMessage, diagnoseTelegram } = await import("../agent/telegram");
      const diag = await diagnoseTelegram();
      if (!diag.botWorking) {
        return res.json({ success: false, ...diag });
      }
      const result = await sendMessage(
        `🤖 *Engine Test*\n\nTelegram integration is working\\. Bot: @${diag.botUsername}\n\nYou will receive:\n• Daily briefings\n• Tier 3\\-4 approval requests\n• Critical alerts`,
        { parseMode: "Markdown" }
      );
      res.json({ success: true, ...diag, messageSent: result.success });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Self-monitoring endpoint — engine checks its own health
  app.get("/api/engine/health", async (req, res) => {
    try {
      const { getEngineHealth } = await import("../agent/self-monitor");
      const health = await getEngineHealth();
      const statusCode = health.overall === "critical" ? 503 : 200;
      res.status(statusCode).json(health);
    } catch (err: any) {
      res.status(500).json({ overall: "critical", error: err.message });
    }
  });

  // Self-monitoring — full diagnostic run
  app.post("/api/engine/diagnose", async (req, res) => {
    try {
      if (!verifySchedulerAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { runFullDiagnostic } = await import("../agent/self-monitor");
      const report = await runFullDiagnostic();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // YouTube OAuth flow - connect YouTube account
  app.get("/api/youtube/connect", (_req, res) => {
    try {
      const { getYouTubeAuthUrl } = require("../social/youtube");
      res.redirect(getYouTubeAuthUrl());
    } catch (err: any) {
      res.status(500).json({ error: "YouTube not configured: " + err.message });
    }
  });

  app.get("/api/youtube/callback", async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) return res.status(400).send("No authorization code");

      const { exchangeYouTubeCode, getChannelInfo } = await import("../social/youtube");
      const tokens = await exchangeYouTubeCode(code);

      // Get channel info to confirm connection
      const channel = await getChannelInfo();

      // Display the refresh token so the user can save it to Railway env vars
      res.send(`
        <html><body style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px;">
          <h1 style="color: green;">YouTube Connected!</h1>
          ${channel ? `<p>Channel: <strong>${channel.title}</strong> (${channel.subscriberCount} subscribers)</p>` : ""}
          <h2>Save this refresh token to Railway:</h2>
          <p style="background: #f0f0f0; padding: 12px; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 14px;">
            YOUTUBE_REFRESH_TOKEN=${tokens.refreshToken}
          </p>
          <p>Go to Railway → memoir service → Variables → Add the above variable, then redeploy.</p>
          <p><a href="/admin/content-pipeline">Back to Content Pipeline →</a></p>
        </body></html>
      `);
    } catch (err: any) {
      res.status(500).send(`YouTube OAuth error: ${err.message}`);
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

    // Start Mission Control autonomous agent (non-blocking)
    try {
      import("../agent/mission-control").then(({ startMissionControl }) => {
        startMissionControl();
      }).catch((err) => {
        console.error("[MissionControl] Failed to start (non-fatal):", err.message);
      });
    } catch (err: any) {
      console.error("[MissionControl] Import failed (non-fatal):", err.message);
    }

    // Start Self-Monitor health checks every 30 minutes (non-blocking)
    try {
      import("../agent/self-monitor").then(({ startSelfMonitor }) => {
        startSelfMonitor();
      }).catch((err) => {
        console.error("[SelfMonitor] Failed to start (non-fatal):", err.message);
      });
    } catch (err: any) {
      console.error("[SelfMonitor] Import failed (non-fatal):", err.message);
    }
  });
}

startServer().catch(console.error);
