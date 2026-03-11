/**
 * Image Proxy for Instagram Posting
 *
 * Instagram's Content Publishing API requires a publicly-accessible image URL.
 * DALL-E image URLs (Azure blob storage) expire in ~1 hour, causing failures.
 *
 * Solution: Download the image, cache it in-memory, and serve via our own
 * Express endpoint. Since our Railway server is publicly accessible,
 * Instagram can fetch images from us.
 *
 * Flow: DALL-E URL → download → cache in-memory → serve at /api/media-proxy/:id
 *       → Instagram fetches from our URL → cache auto-expires after 30 min
 */

import { randomBytes } from "crypto";
import type { Express } from "express";

type CachedImage = {
  buffer: Buffer;
  contentType: string;
  expires: number;
};

const imageCache = new Map<string, CachedImage>();

/** Register the /api/media-proxy/:id endpoint on the Express app */
export function registerImageProxy(app: Express): void {
  app.get("/api/media-proxy/:id", (req, res) => {
    const entry = imageCache.get(req.params.id);
    if (!entry || Date.now() > entry.expires) {
      imageCache.delete(req.params.id);
      return res.status(404).send("Not found");
    }
    res.set("Cache-Control", "public, max-age=1800");
    res.type(entry.contentType).send(entry.buffer);
  });

  // Cleanup expired entries every 10 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of imageCache) {
      if (now > entry.expires) imageCache.delete(id);
    }
  }, 10 * 60 * 1000);
}

/**
 * Download an image and cache it on our server, returning a public URL.
 * Used by Instagram posting since IG requires a URL it can fetch (no multipart upload).
 */
export async function cacheImageForInstagram(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`[ImageProxy] Failed to download image: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/png";
    const id = randomBytes(16).toString("hex");

    // Cache for 30 minutes — more than enough for Instagram to fetch
    imageCache.set(id, { buffer, contentType, expires: Date.now() + 30 * 60 * 1000 });

    // Build our public URL from environment
    const appUrl = process.env.APP_URL
      || process.env.VITE_APP_URL
      || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "")
      || "https://shauncritzer.com";

    if (!appUrl) {
      console.warn("[ImageProxy] No APP_URL or RAILWAY_PUBLIC_DOMAIN set — cannot serve cached images");
      imageCache.delete(id);
      return null;
    }

    const publicUrl = `${appUrl}/api/media-proxy/${id}`;
    console.log(`[ImageProxy] Cached image (${(buffer.length / 1024).toFixed(0)}KB) → ${publicUrl}`);
    return publicUrl;
  } catch (err: any) {
    console.error("[ImageProxy] Failed to cache image:", err.message);
    return null;
  }
}
