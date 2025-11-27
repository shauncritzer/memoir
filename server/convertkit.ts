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
 * Form UIDs - From ConvertKit (used in API calls)
 * These are the unique identifiers from the embed codes
 */
export const CONVERTKIT_FORMS = {
  FIRST_3_CHAPTERS: 'd43af38a5e',
  RECOVERY_TOOLKIT: '3a152c8af9',
  READING_GUIDE: 'dd5d1bcd6a',
  HOMEPAGE_NEWSLETTER: '776aa512c9',
  BLOG_SIDEBAR: '01295fddb5',
  COURSE_INTEREST: '5e54fb6d38',
};

/**
 * Tag IDs - Created in ConvertKit via API
 */
export const CONVERTKIT_TAGS = {
  LEAD_MAGNET_FIRST_3_CHAPTERS: 8012734,
  LEAD_MAGNET_RECOVERY_TOOLKIT: 8012736,
  LEAD_MAGNET_READING_GUIDE: 8012735,
  HOMEPAGE_NEWSLETTER: 8012737,
  BLOG_SIDEBAR: 8012738,
  COURSE_INTEREST: 8012739,
  MEMOIR_READER: 8012740,
  REWIRED_INTEREST: 8012741,
  ACTIVE_SUBSCRIBER: 8012742,
  LEAD_MAGNET_DOWNLOADED: 8012743,
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
    tags: tagId ? [tagId, CONVERTKIT_TAGS.LEAD_MAGNET_DOWNLOADED] : [CONVERTKIT_TAGS.LEAD_MAGNET_DOWNLOADED],
  });

  return result;
}
