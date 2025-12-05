/**
 * ConvertKit API Integration
 * 
 * This module handles all interactions with the ConvertKit API for email marketing automation.
 * 
 * API Documentation: https://developers.convertkit.com/
 */

const CONVERTKIT_API_KEY = "dZ4CxMb5Zwp-5jy87pwcvQ";
const CONVERTKIT_API_SECRET = "x9Uzt8Xs2179XCHdJ6vZrb_-sq12AGihK_sxmuqK3ZY";
const CONVERTKIT_API_BASE = "https://api.convertkit.com/v3";

/**
 * Form IDs - From ConvertKit (used in API calls)
 * These are the numeric IDs from the form URLs in ConvertKit dashboard
 */
export const CONVERTKIT_FORMS = {
  // Lead Magnets
  FIRST_3_CHAPTERS: '8815112',
  RECOVERY_TOOLKIT: '8815131',
  READING_GUIDE: '8815140',
  // Newsletter Signups
  HOMEPAGE_NEWSLETTER: '776aa512c9', // TODO: Get correct ID from ConvertKit
  BLOG_SIDEBAR: '01295fddb5', // TODO: Get correct ID from ConvertKit
  COURSE_INTEREST: '5e54fb6d38', // TODO: Get correct ID from ConvertKit
  // Product Purchases (Stripe Webhook Triggers)
  SEVEN_DAY_RESET_PURCHASE: '8842147',
  FROM_BROKEN_TO_WHOLE_PURCHASE: '8842151',
  BENT_NOT_BROKEN_CIRCLE_MEMBERSHIP: '8842155',
};

/**
 * Tag IDs - From ConvertKit dashboard (hover over tag to see ID in URL)
 */
export const CONVERTKIT_TAGS = {
  LEAD_MAGNET_FIRST_3_CHAPTERS: 12900740,
  LEAD_MAGNET_RECOVERY_TOOLKIT: 12900742,
  LEAD_MAGNET_READING_GUIDE: 12900743,
  HOMEPAGE_NEWSLETTER: 8012737, // TODO: Get correct ID from ConvertKit
  BLOG_SIDEBAR: 8012738, // TODO: Get correct ID from ConvertKit
  COURSE_INTEREST: 8012739, // TODO: Get correct ID from ConvertKit
  MEMOIR_READER: 8012740, // TODO: Get correct ID from ConvertKit
  REWIRED_INTEREST: 8012741, // TODO: Get correct ID from ConvertKit
  ACTIVE_SUBSCRIBER: 8012742, // TODO: Get correct ID from ConvertKit
  LEAD_MAGNET_DOWNLOADED: 8012743, // TODO: Get correct ID from ConvertKit
};

/**
 * Subscribe a user to a ConvertKit form
 */
export async function subscribeToForm(params: {
  email: string;
  firstName?: string;
  formUid: string;
  tags?: number[];
}): Promise<{ success: boolean; subscriberId?: number; error?: string }> {
  try {
    const response = await fetch(`${CONVERTKIT_API_BASE}/forms/${params.formUid}/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: CONVERTKIT_API_KEY,
        email: params.email,
        first_name: params.firstName,
        tags: params.tags,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[ConvertKit] Subscribe failed:", error);
      return { success: false, error };
    }

    const data = await response.json();
    return {
      success: true,
      subscriberId: data.subscription?.subscriber?.id,
    };
  } catch (error) {
    console.error("[ConvertKit] Subscribe error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Add a tag to a subscriber
 */
export async function tagSubscriber(params: {
  email: string;
  tagId: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${CONVERTKIT_API_BASE}/tags/${params.tagId}/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: CONVERTKIT_API_KEY,
        email: params.email,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[ConvertKit] Tag failed:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("[ConvertKit] Tag error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get subscriber by email
 */
export async function getSubscriber(email: string): Promise<{
  success: boolean;
  subscriber?: any;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${CONVERTKIT_API_BASE}/subscribers?api_secret=${CONVERTKIT_API_SECRET}&email_address=${encodeURIComponent(email)}`
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("[ConvertKit] Get subscriber failed:", error);
      return { success: false, error };
    }

    const data = await response.json();
    return {
      success: true,
      subscriber: data.subscribers?.[0],
    };
  } catch (error) {
    console.error("[ConvertKit] Get subscriber error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Unsubscribe a user from all emails
 */
export async function unsubscribe(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${CONVERTKIT_API_BASE}/unsubscribe`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_secret: CONVERTKIT_API_SECRET,
        email,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[ConvertKit] Unsubscribe failed:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("[ConvertKit] Unsubscribe error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Helper: Subscribe and deliver lead magnet
 */
export async function subscribeForLeadMagnet(params: {
  email: string;
  firstName?: string;
  leadMagnetType: "first_3_chapters" | "recovery_toolkit" | "reading_guide";
}): Promise<{ success: boolean; error?: string }> {
  const formMap = {
    first_3_chapters: CONVERTKIT_FORMS.FIRST_3_CHAPTERS,
    recovery_toolkit: CONVERTKIT_FORMS.RECOVERY_TOOLKIT,
    reading_guide: CONVERTKIT_FORMS.READING_GUIDE,
  };

  const tagMap = {
    first_3_chapters: CONVERTKIT_TAGS.LEAD_MAGNET_FIRST_3_CHAPTERS,
    recovery_toolkit: CONVERTKIT_TAGS.LEAD_MAGNET_RECOVERY_TOOLKIT,
    reading_guide: CONVERTKIT_TAGS.LEAD_MAGNET_READING_GUIDE,
  };

  const formUid = formMap[params.leadMagnetType];
  const tagId = tagMap[params.leadMagnetType];

  if (!formUid) {
    return { success: false, error: "Form not configured in ConvertKit yet" };
  }

  // Subscribe to form (this will trigger the email sequence with download link)
  const result = await subscribeToForm({
    email: params.email,
    firstName: params.firstName,
    formUid,
    tags: tagId ? [tagId] : undefined,
  });

  return result;
}
