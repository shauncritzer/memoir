/**
 * ConvertKit Configuration
 * 
 * All Form UIDs and Tag IDs for the email marketing integration
 */

export const CONVERTKIT_CONFIG = {
  // Form IDs (from ConvertKit dashboard URLs)
  FORMS: {
    FIRST_3_CHAPTERS: '8815112',
    READING_GUIDE: '8815140',
    RECOVERY_TOOLKIT: '8815131',
    HOMEPAGE_NEWSLETTER: '776aa512c9', // TODO: Get correct ID
    BLOG_SIDEBAR: '01295fddb5', // TODO: Get correct ID
    COURSE_INTEREST: '5e54fb6d38', // TODO: Get correct ID
  },

  // Tag IDs (from ConvertKit dashboard - hover over tag to see ID in URL)
  TAGS: {
    FIRST_3_CHAPTERS: 12900740,
    READING_GUIDE: 12900743,
    RECOVERY_TOOLKIT: 12900742,
    HOMEPAGE_NEWSLETTER: 8012737, // TODO: Get correct ID
    BLOG_SIDEBAR: 8012738, // TODO: Get correct ID
    COURSE_INTEREST: 8012739, // TODO: Get correct ID
    MEMOIR_READER: 8012740, // TODO: Get correct ID
    REWIRED_INTEREST: 8012741, // TODO: Get correct ID
    ACTIVE_SUBSCRIBER: 8012742, // TODO: Get correct ID
    LEAD_MAGNET_DOWNLOADED: 8012743, // TODO: Get correct ID
  },
} as const;

/**
 * Map lead magnet slugs to ConvertKit form UIDs and tag IDs
 */
export const LEAD_MAGNET_MAPPING = {
  'first-3-chapters': {
    formUid: CONVERTKIT_CONFIG.FORMS.FIRST_3_CHAPTERS,
    tagId: CONVERTKIT_CONFIG.TAGS.FIRST_3_CHAPTERS,
    additionalTags: [
      CONVERTKIT_CONFIG.TAGS.MEMOIR_READER,
      CONVERTKIT_CONFIG.TAGS.LEAD_MAGNET_DOWNLOADED,
    ],
  },
  'reading-guide': {
    formUid: CONVERTKIT_CONFIG.FORMS.READING_GUIDE,
    tagId: CONVERTKIT_CONFIG.TAGS.READING_GUIDE,
    additionalTags: [
      CONVERTKIT_CONFIG.TAGS.MEMOIR_READER,
      CONVERTKIT_CONFIG.TAGS.LEAD_MAGNET_DOWNLOADED,
    ],
  },
  'recovery-toolkit': {
    formUid: CONVERTKIT_CONFIG.FORMS.RECOVERY_TOOLKIT,
    tagId: CONVERTKIT_CONFIG.TAGS.RECOVERY_TOOLKIT,
    additionalTags: [
      CONVERTKIT_CONFIG.TAGS.LEAD_MAGNET_DOWNLOADED,
    ],
  },
} as const;
