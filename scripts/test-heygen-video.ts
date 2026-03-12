/**
 * Test HeyGen Video Pipeline
 *
 * Queries the database for the first lesson of the 7-Day REWIRED Reset,
 * then triggers a test HeyGen video render.
 *
 * Usage (run from project root):
 *   npx tsx scripts/test-heygen-video.ts
 *
 * Required env vars: DATABASE_URL, HEYGEN_API_KEY
 * Optional: HEYGEN_AVATAR_ID
 */

import "dotenv/config";

const HEYGEN_BASE = "https://api.heygen.com";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  const heygenKey = process.env.HEYGEN_API_KEY;

  if (!dbUrl) {
    console.error("ERROR: DATABASE_URL not set");
    process.exit(1);
  }
  if (!heygenKey) {
    console.error("ERROR: HEYGEN_API_KEY not set");
    process.exit(1);
  }

  // ─── Step 1: Check HeyGen credits ───────────────────────────────────────
  console.log("\n=== Step 1: Checking HeyGen credits ===");
  try {
    const creditRes = await fetch(`${HEYGEN_BASE}/v2/user/remaining_quota`, {
      headers: { "X-Api-Key": heygenKey, Accept: "application/json" },
    });
    if (creditRes.ok) {
      const creditData = await creditRes.json();
      console.log("Credits:", JSON.stringify(creditData.data, null, 2));
    } else {
      console.log("Credit check failed:", creditRes.status, await creditRes.text());
    }
  } catch (err: any) {
    console.log("Credit check error:", err.message);
  }

  // ─── Step 2: Query DB for first lesson ──────────────────────────────────
  console.log("\n=== Step 2: Querying database for first lesson ===");

  const mysql = await import("mysql2/promise");
  const conn = await mysql.createConnection(dbUrl);

  // Try course_lessons first
  let [rows] = await conn.execute(
    `SELECT id, title, content, video_script, sort_order, module_id
     FROM course_lessons
     ORDER BY sort_order ASC, id ASC
     LIMIT 5`
  ) as any;

  if (!rows || rows.length === 0) {
    // Fallback to lessons table
    [rows] = await conn.execute(
      `SELECT id, title, content, day_number
       FROM lessons
       ORDER BY day_number ASC, id ASC
       LIMIT 5`
    ) as any;
  }

  if (!rows || rows.length === 0) {
    console.error("No lessons found in database");
    await conn.end();
    process.exit(1);
  }

  console.log(`Found ${rows.length} lessons. First lesson:`);
  const lesson = rows[0];
  console.log(`  ID: ${lesson.id}`);
  console.log(`  Title: ${lesson.title}`);
  console.log(`  Content preview: ${(lesson.content || lesson.video_script || "").substring(0, 200)}...`);

  // Build a script from the lesson content
  const scriptText = lesson.video_script || lesson.content || lesson.title;
  // HeyGen has a 3000 char limit
  const trimmedScript = scriptText.substring(0, 2800);

  await conn.end();

  // ─── Step 3: Trigger HeyGen test video ──────────────────────────────────
  console.log("\n=== Step 3: Triggering HeyGen test video render ===");
  console.log(`Script length: ${trimmedScript.length} chars`);

  const avatarId = process.env.HEYGEN_AVATAR_ID || "";

  // If no avatar ID, list available avatars first
  let resolvedAvatarId = avatarId;
  if (!resolvedAvatarId) {
    console.log("No HEYGEN_AVATAR_ID set, listing available avatars...");
    try {
      const avatarRes = await fetch(`${HEYGEN_BASE}/v2/avatars`, {
        headers: { "X-Api-Key": heygenKey, Accept: "application/json" },
      });
      if (avatarRes.ok) {
        const avatarData = await avatarRes.json();
        const avatars = avatarData.data?.avatars || [];
        if (avatars.length > 0) {
          resolvedAvatarId = avatars[0].avatar_id;
          console.log(`Using first avatar: ${resolvedAvatarId} (${avatars[0].avatar_name})`);
        }
      }
    } catch {}
  }

  if (!resolvedAvatarId) {
    console.error("No avatar available. Set HEYGEN_AVATAR_ID.");
    process.exit(1);
  }

  const payload = {
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id: resolvedAvatarId,
          avatar_style: "normal",
        },
        voice: {
          type: "text",
          input_text: trimmedScript,
          voice_id: "en-US-default",
        },
        background: {
          type: "color",
          value: "#1a1a2e",
        },
      },
    ],
    dimension: { width: 1920, height: 1080 },
    test: true, // TEST MODE — watermarked, doesn't burn credits
    title: `Test: ${lesson.title}`,
  };

  console.log("Sending request to HeyGen (test mode = true, no credits used)...");

  const response = await fetch(`${HEYGEN_BASE}/v2/video/generate`, {
    method: "POST",
    headers: {
      "X-Api-Key": heygenKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok || result.error) {
    console.error("HeyGen video creation FAILED:");
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  const videoId = result.data?.video_id;
  console.log("\n=== SUCCESS ===");
  console.log(`Video ID: ${videoId}`);
  console.log(`Lesson: ${lesson.title}`);
  console.log(`Mode: TEST (watermarked, no credits burned)`);
  console.log(`\nTo check status later, run:`);
  console.log(`  curl -H "X-Api-Key: $HEYGEN_API_KEY" "https://api.heygen.com/v1/video_status.get?video_id=${videoId}"`);

  // ─── Step 4: Poll for status (wait up to 3 min) ────────────────────────
  console.log("\n=== Step 4: Polling for completion (up to 3 min) ===");
  const startTime = Date.now();
  const maxWait = 3 * 60 * 1000;

  while (Date.now() - startTime < maxWait) {
    await new Promise((r) => setTimeout(r, 15000));

    const statusRes = await fetch(
      `${HEYGEN_BASE}/v1/video_status.get?video_id=${videoId}`,
      { headers: { "X-Api-Key": heygenKey, Accept: "application/json" } }
    );

    if (!statusRes.ok) {
      console.log(`  Poll failed: ${statusRes.status}`);
      continue;
    }

    const statusData = await statusRes.json();
    const status = statusData.data?.status;
    console.log(`  Status: ${status} (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);

    if (status === "completed") {
      console.log(`\n=== VIDEO COMPLETED ===`);
      console.log(`Video URL: ${statusData.data.video_url}`);
      console.log(`Thumbnail: ${statusData.data.thumbnail_url}`);
      console.log(`Duration: ${statusData.data.duration}s`);
      process.exit(0);
    }

    if (status === "failed") {
      console.error(`\nVideo FAILED: ${statusData.data.error || "unknown error"}`);
      process.exit(1);
    }
  }

  console.log("\nTimeout reached (3 min). Video is still processing.");
  console.log(`Check status manually with the curl command above.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
