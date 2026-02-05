import { getDb } from "./server/db.js";

/**
 * Seed script to populate the lessons table with 7-Day REWIRED Reset course content
 * All content is already uploaded to Cloudflare R2 bucket "rewired"
 * Public URL base: https://pub-c6dbcc3c636f459ca30a6067b6dbc758.r2.dev/
 */

const CLOUDFLARE_R2_BASE = "https://pub-c6dbcc3c636f459ca30a6067b6dbc758.r2.dev";

const lessons = [
  {
    productId: "7-day-reset",
    dayNumber: 1,
    title: "RECOGNIZE - Understanding Your Patterns",
    description: "Learn to identify your behavioral patterns and understand the root causes of your addiction.",
    videoUrl: `${CLOUDFLARE_R2_BASE}/videos/REWIRED%20DAY%201.mp4`,
    slideshowUrl: `${CLOUDFLARE_R2_BASE}/slideshows/Day_1_RECOGNIZE_-_Understanding_Your_Patterns.pdf`,
    workbookUrl: `${CLOUDFLARE_R2_BASE}/workbooks/1_RECOGNIZE_Workbook.pdf`,
    durationMinutes: 45,
  },
  {
    productId: "7-day-reset",
    dayNumber: 2,
    title: "ESTABLISH - Safety & Connection",
    description: "Build a foundation of safety and connection to support your recovery journey.",
    videoUrl: `${CLOUDFLARE_R2_BASE}/videos/REWIRED_DAY_2.mp4`,
    slideshowUrl: `${CLOUDFLARE_R2_BASE}/slideshows/Day_2_ESTABLISH_-_Safety_%26_Connection.pdf`,
    workbookUrl: `${CLOUDFLARE_R2_BASE}/workbooks/2_ESTABLISH_Workbook.pdf`,
    durationMinutes: 50,
  },
  {
    productId: "7-day-reset",
    dayNumber: 3,
    title: "WORK - Triggers as Teachers",
    description: "Transform your triggers from obstacles into opportunities for growth and healing.",
    videoUrl: `${CLOUDFLARE_R2_BASE}/videos/Rewired_Day_3.mp4`,
    slideshowUrl: `${CLOUDFLARE_R2_BASE}/slideshows/Day_3_WORK_-_Triggers_as_Teachers.pdf`,
    workbookUrl: `${CLOUDFLARE_R2_BASE}/workbooks/3_WORK_Workbook.pdf`,
    durationMinutes: 55,
  },
  {
    productId: "7-day-reset",
    dayNumber: 4,
    title: "INTEGRATE - Building Sustainable Routines",
    description: "Create daily routines and habits that support long-term recovery and well-being.",
    videoUrl: `${CLOUDFLARE_R2_BASE}/videos/Rewired_Day_4.mp4`,
    slideshowUrl: `${CLOUDFLARE_R2_BASE}/slideshows/Day_4_INTEGRATE_-_Building_Sustainable_Routines.pdf`,
    workbookUrl: `${CLOUDFLARE_R2_BASE}/workbooks/4_INTEGRATE_Workbook.pdf`,
    durationMinutes: 48,
  },
  {
    productId: "7-day-reset",
    dayNumber: 5,
    title: "RELEASE - Letting Go of Shame",
    description: "Break free from shame and self-judgment to embrace self-compassion and healing.",
    videoUrl: `${CLOUDFLARE_R2_BASE}/videos/Welcome_everyone._This_is_Day_5_of_The_REWIRED_7-D.mp4`,
    slideshowUrl: `${CLOUDFLARE_R2_BASE}/slideshows/Day_5_RELEASE_-_Letting_Go_of_Shame%20(1).pdf`,
    workbookUrl: `${CLOUDFLARE_R2_BASE}/workbooks/5_RELEASE_Workbook.pdf`,
    durationMinutes: 52,
  },
  {
    productId: "7-day-reset",
    dayNumber: 6,
    title: "EMBRACE - Your New Identity",
    description: "Step into your new identity as someone who is healing, growing, and thriving.",
    videoUrl: `${CLOUDFLARE_R2_BASE}/videos/Welcome_everyone._This_is_Day_6_of_The_REWIRED_7-D.mp4`,
    slideshowUrl: `${CLOUDFLARE_R2_BASE}/slideshows/Day_6_EMBRACE_-_Your_New_Identity.pdf`,
    workbookUrl: `${CLOUDFLARE_R2_BASE}/workbooks/6_EMBRACE_Workbook.pdf`,
    durationMinutes: 47,
  },
  {
    productId: "7-day-reset",
    dayNumber: 7,
    title: "DISCOVER - Your Purpose & Path Forward",
    description: "Find your purpose and create a clear path forward for sustained recovery and growth.",
    videoUrl: `${CLOUDFLARE_R2_BASE}/videos/Welcome_everyone._This_is_Day_7_of_The_REWIRED_7-D.mp4`,
    slideshowUrl: `${CLOUDFLARE_R2_BASE}/slideshows/Day_7_DISCOVER_-_Your_Purpose_%26_Path_Forward.pdf`,
    workbookUrl: `${CLOUDFLARE_R2_BASE}/workbooks/7_DISCOVER_Workbook.pdf`,
    durationMinutes: 60,
  },
];

async function seedLessons() {
  console.log("🌱 Starting to seed 7-Day REWIRED Reset lessons...");
  
  const db = await getDb();
  if (!db) {
    console.error("❌ Failed to connect to database");
    process.exit(1);
  }

  const { lessons: lessonsTable } = await import("./drizzle/schema.js");
  const { eq } = await import("drizzle-orm");

  try {
    // Check if lessons already exist
    const existingLessons = await db
      .select()
      .from(lessonsTable)
      .where(eq(lessonsTable.productId, "7-day-reset"));

    if (existingLessons.length > 0) {
      console.log(`⚠️  Found ${existingLessons.length} existing lessons for 7-day-reset`);
      console.log("   Deleting existing lessons to avoid duplicates...");
      
      await db
        .delete(lessonsTable)
        .where(eq(lessonsTable.productId, "7-day-reset"));
      
      console.log("✅ Deleted existing lessons");
    }

    // Insert all lessons
    console.log(`📝 Inserting ${lessons.length} lessons...`);
    
    for (const lesson of lessons) {
      await db.insert(lessonsTable).values(lesson);
      console.log(`   ✓ Day ${lesson.dayNumber}: ${lesson.title}`);
    }

    console.log("\n✅ Successfully seeded all 7 lessons!");
    console.log("\n📊 Summary:");
    console.log(`   Product ID: 7-day-reset`);
    console.log(`   Total Lessons: ${lessons.length}`);
    console.log(`   Total Duration: ${lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0)} minutes`);
    console.log("\n🎉 Course content is now ready!");
    
  } catch (error) {
    console.error("❌ Error seeding lessons:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the seed function
seedLessons();
