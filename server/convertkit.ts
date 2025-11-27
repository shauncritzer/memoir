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
 * Form IDs - These will be created in ConvertKit and updated here
 */
export const CONVERTKIT_FORMS = {
  FIRST_3_CHAPTERS: 0, // To be created
  RECOVERY_TOOLKIT: 0, // To be created
  READING_GUIDE: 0, // To be created
  AI_RECOVERY_COACH: 0, // To be created
  NERVOUS_SYSTEM_ASSESSMENT: 0, // To be created
  NEWSLETTER: 0, // To be created
  COURSE_WAITLIST: 0, // To be created
};

/**
 * Tag IDs - These will be created in ConvertKit and updated here
 */
export const CONVERTKIT_TAGS = {
  LEAD_MAGNET_FIRST_3_CHAPTERS: 0,
  LEAD_MAGNET_RECOVERY_TOOLKIT: 0,
  LEAD_MAGNET_READING_GUIDE: 0,
  LEAD_MAGNET_AI_COACH: 0,
  INTEREST_MEMOIR: 0,
  INTEREST_REWIRED: 0,
  INTEREST_WEALTH: 0,
  CUSTOMER_7_DAY_RESET: 0,
  CUSTOMER_30_DAY_FOUNDATION: 0,
  CUSTOMER_FROM_BROKEN_TO_WHOLE: 0,
  CUSTOMER_90_DAY_RESET: 0,
  MEMBER_ACTIVE: 0,
};

/**
 * Subscribe a user to a ConvertKit form
 */
export async function subscribeToForm(params: {
  email: string;
  firstName?: string;
  formId: number;
  tags?: number[];
}): Promise<{ success: boolean; subscriberId?: number; error?: string }> {
  try {
    const response = await fetch(`${CONVERTKIT_API_BASE}/forms/${params.formId}/subscribe`, {
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
  leadMagnetType: "first_3_chapters" | "recovery_toolkit" | "reading_guide" | "ai_coach";
}): Promise<{ success: boolean; error?: string }> {
  const formMap = {
    first_3_chapters: CONVERTKIT_FORMS.FIRST_3_CHAPTERS,
    recovery_toolkit: CONVERTKIT_FORMS.RECOVERY_TOOLKIT,
    reading_guide: CONVERTKIT_FORMS.READING_GUIDE,
    ai_coach: CONVERTKIT_FORMS.AI_RECOVERY_COACH,
  };

  const tagMap = {
    first_3_chapters: CONVERTKIT_TAGS.LEAD_MAGNET_FIRST_3_CHAPTERS,
    recovery_toolkit: CONVERTKIT_TAGS.LEAD_MAGNET_RECOVERY_TOOLKIT,
    reading_guide: CONVERTKIT_TAGS.LEAD_MAGNET_READING_GUIDE,
    ai_coach: CONVERTKIT_TAGS.LEAD_MAGNET_AI_COACH,
  };

  const formId = formMap[params.leadMagnetType];
  const tagId = tagMap[params.leadMagnetType];

  if (!formId) {
    return { success: false, error: "Form not configured in ConvertKit yet" };
  }

  // Subscribe to form (this will trigger the email sequence with download link)
  const result = await subscribeToForm({
    email: params.email,
    firstName: params.firstName,
    formId,
    tags: tagId ? [tagId] : undefined,
  });

  return result;
}
