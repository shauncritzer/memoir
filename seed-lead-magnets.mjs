import { storagePut } from "./server/storage.js";
import { drizzle } from "drizzle-orm/mysql2";
import { leadMagnets } from "./drizzle/schema.ts";
import { readFileSync } from "fs";
import { randomBytes } from "crypto";

const db = drizzle(process.env.DATABASE_URL);

async function uploadAndSeedLeadMagnets() {
  console.log("Starting lead magnet upload and seeding...\n");

  const magnets = [
    {
      title: "First 3 Chapters - Free Excerpt",
      slug: "first-3-chapters",
      description: "Read the prologue and first two chapters of Crooked Lines: Bent, Not Broken. Experience the raw, unflinching honesty that makes this memoir a life-changing read.",
      filePath: "/home/ubuntu/shauncritzer/lead_magnets/first_3_chapters.pdf",
      type: "pdf",
    },
    {
      title: "Recovery Toolkit - Practical Worksheets",
      slug: "recovery-toolkit",
      description: "A collection of tools, exercises, and resources to support your recovery journey. Includes daily check-ins, trigger worksheets, gratitude templates, and more.",
      filePath: "/home/ubuntu/shauncritzer/lead_magnets/recovery_toolkit.pdf",
      type: "pdf",
    },
    {
      title: "Crooked Lines Reading Guide",
      slug: "reading-guide",
      description: "Discussion questions and reflection prompts for individual use or group study. Go deeper with the themes of trauma, addiction, and redemption.",
      filePath: "/home/ubuntu/shauncritzer/lead_magnets/reading_guide.pdf",
      type: "pdf",
    },
  ];

  for (const magnet of magnets) {
    console.log(`Processing: ${magnet.title}`);

    // Read PDF file
    const fileBuffer = readFileSync(magnet.filePath);
    console.log(`  - File size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

    // Generate unique file key with random suffix
    const randomSuffix = randomBytes(8).toString("hex");
    const fileKey = `lead-magnets/${magnet.slug}-${randomSuffix}.pdf`;

    // Upload to S3
    console.log(`  - Uploading to S3...`);
    const { url } = await storagePut(fileKey, fileBuffer, "application/pdf");
    console.log(`  - Uploaded: ${url}`);

    // Insert into database
    console.log(`  - Inserting into database...`);
    await db.insert(leadMagnets).values({
      title: magnet.title,
      slug: magnet.slug,
      description: magnet.description,
      fileUrl: url,
      fileKey: fileKey,
      type: magnet.type,
      isPaid: 0,
      price: 0,
      downloadCount: 0,
      status: "active",
    });
    console.log(`  ✓ Complete\n`);
  }

  console.log("All lead magnets uploaded and seeded successfully!");
  process.exit(0);
}

uploadAndSeedLeadMagnets().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
