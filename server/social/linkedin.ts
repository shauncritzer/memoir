/**
 * LinkedIn API Connector
 * Supports posting text and articles to LinkedIn personal profile or organization
 *
 * Required env vars:
 *   LINKEDIN_ACCESS_TOKEN - OAuth 2.0 access token (from LinkedIn developer app)
 *   LINKEDIN_PERSON_URN - Your LinkedIn person URN (e.g., "urn:li:person:ABC123")
 *   LINKEDIN_ORG_URN - (Optional) Organization URN for posting as a company page
 *
 * LinkedIn API uses the "Share on LinkedIn" product (Community Management API)
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
 */

// ─── Credentials ───────────────────────────────────────────────────────────

function getLinkedInCredentials() {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const personUrn = process.env.LINKEDIN_PERSON_URN;
  const orgUrn = process.env.LINKEDIN_ORG_URN;

  return { accessToken, personUrn, orgUrn };
}

export function isLinkedInConfigured(): boolean {
  const { accessToken, personUrn } = getLinkedInCredentials();
  return !!(accessToken && personUrn);
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type LinkedInPostResult = {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
};

// ─── LinkedIn Posting ──────────────────────────────────────────────────────

/**
 * Post text content to LinkedIn
 * Uses the Posts API (v2) for creating shares
 */
export async function postToLinkedIn(
  text: string,
  options: { asOrganization?: boolean; articleUrl?: string; articleTitle?: string } = {}
): Promise<LinkedInPostResult> {
  const { accessToken, personUrn, orgUrn } = getLinkedInCredentials();

  if (!accessToken) {
    return { success: false, error: "LINKEDIN_ACCESS_TOKEN not configured" };
  }

  const authorUrn = options.asOrganization && orgUrn ? orgUrn : personUrn;
  if (!authorUrn) {
    return { success: false, error: "No LinkedIn author URN configured (LINKEDIN_PERSON_URN or LINKEDIN_ORG_URN)" };
  }

  try {
    // Build the post body
    const postBody: any = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
      },
      commentary: text,
    };

    // Add article attachment if provided
    if (options.articleUrl) {
      postBody.content = {
        article: {
          source: options.articleUrl,
          title: options.articleTitle || "",
        },
      };
    }

    const response = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202401",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[LinkedIn] Post failed:", response.status, errorText);
      return { success: false, error: `LinkedIn API error ${response.status}: ${errorText}` };
    }

    // LinkedIn returns the post URN in the x-restli-id header
    const postUrn = response.headers.get("x-restli-id") || "";
    const postId = postUrn.replace("urn:li:share:", "");

    console.log(`[LinkedIn] Posted successfully: ${postUrn}`);
    return {
      success: true,
      postId,
      postUrl: `https://www.linkedin.com/feed/update/${postUrn}`,
    };
  } catch (err: any) {
    console.error("[LinkedIn] Error posting:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get metrics for a LinkedIn post
 */
export async function getLinkedInPostMetrics(postUrn: string): Promise<{
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
} | null> {
  const { accessToken } = getLinkedInCredentials();
  if (!accessToken) return null;

  try {
    const response = await fetch(
      `https://api.linkedin.com/rest/socialMetadata/${encodeURIComponent(postUrn)}`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "LinkedIn-Version": "202401",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      likes: data.totalLikes || 0,
      comments: data.totalComments || 0,
      shares: data.totalShares || 0,
      impressions: data.totalImpressions || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Verify LinkedIn credentials are working
 */
export async function verifyLinkedInCredentials(): Promise<{ valid: boolean; name?: string; error?: string }> {
  const { accessToken } = getLinkedInCredentials();
  if (!accessToken) return { valid: false, error: "No access token configured" };

  try {
    const response = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return { valid: false, error: `API returned ${response.status}` };
    }

    const data = await response.json();
    return { valid: true, name: data.name || data.localizedFirstName };
  } catch (err: any) {
    return { valid: false, error: err.message };
  }
}
