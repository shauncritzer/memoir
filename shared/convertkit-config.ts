/**
 * ConvertKit Configuration
 * 
 * All Form UIDs and Tag IDs for the email marketing integration
 */

export const CONVERTKIT_CONFIG = {
  // Form UIDs (from ConvertKit form embed codes)
  FORMS: {
    FIRST_3_CHAPTERS: 'd43af38a5e',
    READING_GUIDE: 'dd5d1bcd6a',
    RECOVERY_TOOLKIT: '3a152c8af9',
    HOMEPAGE_NEWSLETTER: '776aa512c9',
    BLOG_SIDEBAR: '01295fddb5',
    COURSE_INTEREST: '5e54fb6d38',
  },

  // Tag IDs (created via API)
  TAGS: {
    FIRST_3_CHAPTERS: 8012734,
    READING_GUIDE: 8012735,
    RECOVERY_TOOLKIT: 8012736,
    HOMEPAGE_NEWSLETTER: 8012737,
    BLOG_SIDEBAR: 8012738,
    COURSE_INTEREST: 8012739,
    MEMOIR_READER: 8012740,
    REWIRED_INTEREST: 8012741,
    ACTIVE_SUBSCRIBER: 8012742,
    LEAD_MAGNET_DOWNLOADED: 8012743,
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
