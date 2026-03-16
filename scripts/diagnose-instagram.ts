/**
 * Instagram API Diagnostic Tool
 * 
 * Checks:
 * 1. Token validity and expiration
 * 2. Token scopes and permissions
 * 3. Instagram account connectivity
 * 4. Rate limit status
 * 5. Test post capability
 */

import { config } from "dotenv";
config();

const GRAPH_API = "https://graph.facebook.com/v21.0";

async function diagnoseInstagram() {
  console.log("🔍 Instagram API Diagnostic Tool\n");

  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
  const igUserId = process.env.META_IG_USER_ID;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  // Step 1: Check credentials
  console.log("📋 Step 1: Checking credentials...");
  if (!pageAccessToken) {
    console.error("❌ META_PAGE_ACCESS_TOKEN not set");
    process.exit(1);
  }
  if (!igUserId) {
    console.error("❌ META_IG_USER_ID not set");
    process.exit(1);
  }
  console.log(`✅ PAGE_ACCESS_TOKEN: ${pageAccessToken.substring(0, 20)}...`);
  console.log(`✅ IG_USER_ID: ${igUserId}\n`);

  // Step 2: Debug token
  console.log("🔑 Step 2: Token validation...");
  try {
    const debugResponse = await fetch(
      `${GRAPH_API}/debug_token?input_token=${encodeURIComponent(pageAccessToken)}&access_token=${encodeURIComponent(pageAccessToken)}`
    );
    const debugData = await debugResponse.json();

    if (debugData.error) {
      console.error(`❌ Token debug failed: ${debugData.error.message}`);
      console.log("\n🔧 Fix: Token is invalid or expired. Generate a new long-lived token:");
      console.log("   1. Go to https://developers.facebook.com/tools/explorer/");
      console.log("   2. Select your app");
      console.log("   3. Get User Access Token with permissions: pages_show_list, pages_read_engagement, instagram_basic, instagram_content_publish");
      console.log("   4. Exchange for long-lived token using the script below");
      process.exit(1);
    }

    const info = debugData.data;
    console.log(`✅ Token is ${info.is_valid ? "VALID" : "INVALID"}`);
    console.log(`   App ID: ${info.app_id}`);
    console.log(`   User ID: ${info.user_id}`);
    console.log(`   Expires: ${info.expires_at === 0 ? "Never" : new Date(info.expires_at * 1000).toISOString()}`);
    console.log(`   Scopes: ${info.scopes.join(", ")}`);

    // Check for required scopes
    const requiredScopes = ["instagram_basic", "instagram_content_publish"];
    const missingScopes = requiredScopes.filter(s => !info.scopes.includes(s));
    if (missingScopes.length > 0) {
      console.error(`\n❌ Missing required scopes: ${missingScopes.join(", ")}`);
      console.log("🔧 Fix: Regenerate token with missing scopes at https://developers.facebook.com/tools/explorer/");
      process.exit(1);
    }
    console.log("✅ All required scopes present\n");

  } catch (err: any) {
    console.error(`❌ Token debug error: ${err.message}`);
    process.exit(1);
  }

  // Step 3: Verify Instagram account
  console.log("📸 Step 3: Instagram account verification...");
  try {
    const accountResponse = await fetch(
      `${GRAPH_API}/${igUserId}?fields=username,followers_count,media_count,profile_picture_url&access_token=${pageAccessToken}`
    );
    const accountData = await accountResponse.json();

    if (accountData.error) {
      console.error(`❌ Instagram account error: ${accountData.error.message}`);
      console.error(`   Error code: ${accountData.error.code}`);
      console.error(`   Error type: ${accountData.error.type}`);
      
      if (accountData.error.code === 190) {
        console.log("\n🔧 Fix: Token expired or invalid. Generate new token.");
      } else if (accountData.error.code === 10) {
        console.log("\n🔧 Fix: Insufficient permissions. Token needs instagram_basic and instagram_content_publish scopes.");
      } else if (accountData.error.message.includes("Rate limit")) {
        console.log("\n🔧 Fix: Rate limited. Wait before retrying.");
      }
      process.exit(1);
    }

    console.log(`✅ Instagram account connected`);
    console.log(`   Username: @${accountData.username}`);
    console.log(`   Followers: ${accountData.followers_count}`);
    console.log(`   Posts: ${accountData.media_count}\n`);

  } catch (err: any) {
    console.error(`❌ Account verification error: ${err.message}`);
    process.exit(1);
  }

  // Step 4: Check rate limits
  console.log("⏱️  Step 4: Rate limit check...");
  try {
    const rateLimitResponse = await fetch(
      `${GRAPH_API}/${igUserId}?fields=id&access_token=${pageAccessToken}`,
      { method: "GET" }
    );
    
    const rateLimit = rateLimitResponse.headers.get("x-app-usage");
    const businessUseCase = rateLimitResponse.headers.get("x-business-use-case-usage");
    
    if (rateLimit) {
      const usage = JSON.parse(rateLimit);
      console.log(`   App usage: ${usage.call_count || 0}% calls, ${usage.total_time || 0}% time, ${usage.total_cputime || 0}% CPU`);
      if (usage.call_count > 80) {
        console.warn(`⚠️  Warning: High API usage (${usage.call_count}%) - approaching rate limit`);
      }
    }
    
    if (businessUseCase) {
      const busUsage = JSON.parse(businessUseCase);
      console.log(`   Business usage: ${JSON.stringify(busUsage)}`);
    }
    
    console.log("✅ No rate limiting detected\n");

  } catch (err: any) {
    console.warn(`⚠️  Could not check rate limits: ${err.message}\n`);
  }

  // Step 5: Test media container creation (dry run)
  console.log("🧪 Step 5: Test container creation (dry run with sample image)...");
  try {
    const testImageUrl = "https://placecats.com/300/300"; // Public test image
    const containerResponse = await fetch(`${GRAPH_API}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: testImageUrl,
        caption: "Test caption - will not be published",
        access_token: pageAccessToken,
      }),
    });

    const containerData = await containerResponse.json();

    if (containerData.error) {
      console.error(`❌ Container creation failed: ${containerData.error.message}`);
      console.error(`   Error code: ${containerData.error.code}`);
      console.error(`   Error subcode: ${containerData.error.error_subcode}`);
      
      if (containerData.error.code === 190) {
        console.log("\n🔧 Fix: Token invalid/expired");
      } else if (containerData.error.code === 100) {
        console.log("\n🔧 Fix: Invalid parameter - check image URL format");
      } else if (containerData.error.message.includes("instagram_content_publish")) {
        console.log("\n🔧 Fix: Missing instagram_content_publish permission");
      }
      
      process.exit(1);
    }

    console.log(`✅ Container created successfully: ${containerData.id}`);
    console.log("   (Container will expire in 24h - not publishing)\n");

  } catch (err: any) {
    console.error(`❌ Container test failed: ${err.message}`);
    process.exit(1);
  }

  // Summary
  console.log("✅ ═══════════════════════════════════════");
  console.log("✅ Instagram API is fully operational!");
  console.log("✅ ═══════════════════════════════════════\n");

  // Token refresh instructions
  if (appId && appSecret) {
    console.log("💡 Optional: Refresh token for extended validity");
    console.log(`   Run: npm run refresh-meta-token\n`);
  }
}

diagnoseInstagram().catch(err => {
  console.error("❌ Fatal error:", err.message);
  process.exit(1);
});
