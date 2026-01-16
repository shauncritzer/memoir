import { getDb } from "./server/db";
import { courseModules, courseLessons, type InsertCourseModule, type InsertCourseLesson } from "./drizzle/schema";
import { eq, and } from "drizzle-orm";

// S3 URLs for course assets (uploaded 12 hours ago)
const BASE_CDN_URL = "https://d3926qbfab6fkv.cloudfront.net/7day-reset";

const courseData = {
  moduleId: "7-day-reset",
  moduleTitle: "REWIRED 7-Day Reset",
  moduleDescription: "A Journey to Reclaim Your Nervous System and Your Life",
  lessons: [
    {
      day: 1,
      letter: "R",
      title: "RECOGNIZE",
      subtitle: "Understanding Your Patterns",
      videoUrl: `${BASE_CDN_URL}/Day_1_RECOGNIZE_-_Understanding_Your_Patterns.mp4`,
      pdfUrl: `${BASE_CDN_URL}/Day_1_RECOGNIZE_-_Understanding_Your_Patterns.pdf`,
      duration: 8,
      description: "Recognize the patterns, triggers, and rock bottom moments that brought you here. Honesty without judgment.",
    },
    {
      day: 2,
      letter: "E",
      title: "ESTABLISH",
      subtitle: "Safety & Connection",
      videoUrl: `${BASE_CDN_URL}/Day_2_ESTABLISH_-_Safety_&_Connection.mp4`,
      pdfUrl: `${BASE_CDN_URL}/Day_2_ESTABLISH_-_Safety_&_Connection.pdf`,
      duration: 7,
      description: "Establish safety and support. Addiction thrives in isolation; recovery happens in connection.",
    },
    {
      day: 3,
      letter: "W",
      title: "WITHDRAW",
      subtitle: "Triggers as Teachers",
      videoUrl: `${BASE_CDN_URL}/Day_3_WORK_-_Triggers_as_Teachers.mp4`,
      pdfUrl: `${BASE_CDN_URL}/Day_3_WORK_-_Triggers_as_Teachers.pdf`,
      duration: 9,
      description: "Work with your triggers instead of against them. Learn to see them as teachers, not enemies.",
    },
    {
      day: 4,
      letter: "I",
      title: "INTEGRATE",
      subtitle: "Building Sustainable Habits",
      videoUrl: `${BASE_CDN_URL}/Day_4_INTEGRATE_-_Building_Sustainable_Habits.mp4`,
      pdfUrl: `${BASE_CDN_URL}/Day_4_INTEGRATE_-_Building_Sustainable_Habits.pdf`,
      duration: 8,
      description: "Integrate new habits and routines that support your nervous system regulation.",
    },
    {
      day: 5,
      letter: "R",
      title: "REWIRE",
      subtitle: "Creating New Neural Pathways",
      videoUrl: `${BASE_CDN_URL}/Day_5_REWIRE_-_Creating_New_Neural_Pathways.mp4`,
      pdfUrl: `${BASE_CDN_URL}/Day_5_REWIRE_-_Creating_New_Neural_Pathways.pdf`,
      duration: 10,
      description: "Rewire your brain through neuroplasticity. Create new neural pathways for resilience and joy.",
    },
    {
      day: 6,
      letter: "E",
      title: "ENGAGE",
      subtitle: "Purpose & Meaning",
      videoUrl: `${BASE_CDN_URL}/Day_6_ENGAGE_-_Purpose_&_Meaning.mp4`,
      pdfUrl: `${BASE_CDN_URL}/Day_6_ENGAGE_-_Purpose_&_Meaning.pdf`,
      duration: 7,
      description: "Engage with purpose and meaning. Build a life you don't need to escape from.",
    },
    {
      day: 7,
      letter: "D",
      title: "DISCOVER",
      subtitle: "Your Path Forward",
      videoUrl: `${BASE_CDN_URL}/Day_7_DISCOVER_-_Your_Path_Forward.mp4`,
      pdfUrl: `${BASE_CDN_URL}/Day_7_DISCOVER_-_Your_Path_Forward.pdf`,
      duration: 9,
      description: "Discover your unique path forward. This is not the end; it's the beginning.",
    },
  ],
};

async function seed() {
  console.log("🌱 Seeding 7-Day Reset course...");
  const db = await getDb();

  // Check if module already exists
  const [existingModule] = await db.select().from(courseModules)
    .where(and(
      eq(courseModules.productId, courseData.moduleId),
      eq(courseModules.moduleNumber, 1)
    ))
    .limit(1);

  let moduleId: number;

  if (existingModule) {
    console.log("✅ Module already exists, using existing ID:", existingModule.id);
    moduleId = existingModule.id;
  } else {
    // Insert course module
    const [module] = await db
      .insert(courseModules)
      .values({
        title: courseData.moduleTitle,
        productId: courseData.moduleId,
        moduleNumber: 1,
        description: courseData.moduleDescription,
        unlockDay: 1,
        sortOrder: 1,
      } as InsertCourseModule)
      .returning();

    moduleId = module.id;
    console.log("✅ Created module:", module.title);
  }

  // Insert lessons
  for (const lesson of courseData.lessons) {
    const [existingLesson] = await db.select().from(courseLessons)
      .where(and(
        eq(courseLessons.moduleId, moduleId),
        eq(courseLessons.lessonNumber, lesson.day)
      ))
      .limit(1);

    if (existingLesson) {
      console.log(`⏭️  Lesson ${lesson.day} already exists, skipping...`);
      continue;
    }

    await db.insert(courseLessons).values({
      moduleId,
      lessonNumber: lesson.day,
      title: `Day ${lesson.day}: ${lesson.letter} - ${lesson.title}`,
      description: lesson.description,
      videoUrl: lesson.videoUrl,
      videoProvider: "other",
      videoDuration: lesson.duration * 60, // Convert minutes to seconds
      workbookPdfUrl: lesson.pdfUrl,
      sortOrder: lesson.day,
    } as InsertCourseLesson);

    console.log(`✅ Created lesson: Day ${lesson.day} - ${lesson.title}`);
  }

  console.log("\n🎉 7-Day Reset course seeded successfully!");
  console.log(`📊 Module ID: ${moduleId}`);
  console.log(`📚 Total lessons: ${courseData.lessons.length}`);
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .then(() => {
    console.log("✅ Seed complete");
    process.exit(0);
  });
