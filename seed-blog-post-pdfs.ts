import { storagePut } from "./server/storage";
import { drizzle } from "drizzle-orm/mysql2";
import { blogPosts } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * This script adds downloadable PDF versions to existing blog posts
 *
 * For now, it creates placeholder PDF URLs for all blog posts
 * You can later replace these with actual PDF files
 */
async function addPDFsToBlogPosts() {
  console.log("Starting blog post PDF seeding...\n");

  // Get all published blog posts
  const posts = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"));

  console.log(`Found ${posts.length} published blog posts\n`);

  for (const post of posts) {
    console.log(`Processing: ${post.title}`);

    // For now, we'll create placeholder entries
    // In production, you would:
    // 1. Generate a PDF from the blog post content
    // 2. Upload it to S3 using storagePut()
    // 3. Store the URL and key in the database

    // Generate unique file key
    const randomSuffix = randomBytes(8).toString("hex");
    const fileKey = `blog-posts/${post.slug}-${randomSuffix}.pdf`;

    // Placeholder - in production, you'd upload an actual PDF here
    // const fileBuffer = await generatePDFFromMarkdown(post.content);
    // const { url } = await storagePut(fileKey, fileBuffer, "application/pdf");

    // For now, we'll set a placeholder URL
    const placeholderUrl = `https://placeholder-for-pdf/${post.slug}.pdf`;

    // Update the blog post with PDF info
    await db
      .update(blogPosts)
      .set({
        fileUrl: placeholderUrl,
        fileKey: fileKey,
      })
      .where(eq(blogPosts.id, post.id));

    console.log(`  ✓ Added placeholder PDF URL\n`);
  }

  console.log("All blog posts updated with placeholder PDFs!");
  console.log("\nNOTE: These are placeholder URLs. To add real PDFs:");
  console.log("1. Generate PDF versions of your blog posts");
  console.log("2. Upload them to S3 using the storagePut() function");
  console.log("3. Update the blog posts with the real URLs");

  process.exit(0);
}

addPDFsToBlogPosts().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
