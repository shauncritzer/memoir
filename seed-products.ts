import "dotenv/config";
import { createProduct } from "./server/db";

/**
 * Seed the products table with the 3 main products
 *
 * Run with: tsx seed-products.ts
 */

const products = [
  {
    name: "7-Day Reset Challenge",
    slug: "7-day-reset",
    description: "A transformative 7-day program to help you break free from destructive patterns and start fresh. Daily guided exercises, accountability check-ins, and proven strategies for lasting change.",
    price: 2700, // $27.00 in cents
    currency: "usd",
    type: "one_time" as const,
    features: JSON.stringify([
      "7 days of guided daily exercises",
      "Morning and evening reflection prompts",
      "Accountability worksheets",
      "Access to private community group",
      "Bonus: Recovery toolkit PDF",
      "Lifetime access to all materials"
    ]),
    convertKitTagId: "12900750", // TODO: Update with actual ConvertKit tag ID
    status: "active" as const,
  },
  {
    name: "Recovery Roadmap Course",
    slug: "recovery-roadmap",
    description: "The complete step-by-step course for sustainable recovery. Learn the exact strategies, mindset shifts, and practical tools that create lasting transformation. Based on proven principles and real-world experience.",
    price: 9700, // $97.00 in cents
    currency: "usd",
    type: "one_time" as const,
    features: JSON.stringify([
      "12 comprehensive video modules",
      "Workbook with 50+ exercises",
      "Weekly live Q&A sessions (4 weeks)",
      "Printable daily trackers and templates",
      "Access to exclusive recovery resource library",
      "Certificate of completion",
      "90-day money-back guarantee",
      "Lifetime access to course updates"
    ]),
    convertKitTagId: "12900751", // TODO: Update with actual ConvertKit tag ID
    status: "active" as const,
  },
  {
    name: "Monthly Membership",
    slug: "membership",
    description: "Join our community of people committed to lasting change. Get ongoing support, exclusive content, and accountability to stay on track with your recovery journey.",
    price: 2900, // $29.00/month in cents
    currency: "usd",
    type: "recurring" as const,
    billingInterval: "month" as const,
    features: JSON.stringify([
      "Weekly group coaching calls",
      "Private members-only community",
      "Monthly exclusive content and resources",
      "Priority email support",
      "Access to complete course library",
      "Monthly accountability challenges",
      "Member directory for finding accountability partners",
      "Cancel anytime"
    ]),
    convertKitTagId: "12900752", // TODO: Update with actual ConvertKit tag ID
    status: "active" as const,
  },
];

async function seed() {
  console.log("🌱 Seeding products...\n");

  for (const productData of products) {
    try {
      console.log(`Creating product: ${productData.name}`);
      const product = await createProduct(productData);
      console.log(`✅ Created: ${product.name} (ID: ${product.id})\n`);
    } catch (error) {
      console.error(`❌ Failed to create ${productData.name}:`, error);
    }
  }

  console.log("✨ Product seeding complete!\n");
  console.log("⚠️  Next steps:");
  console.log("1. Create corresponding products in your Stripe dashboard");
  console.log("2. Update the products table with Stripe product IDs and price IDs");
  console.log("3. Create ConvertKit tags for each product and update convertKitTagId fields");
  console.log("\nExample SQL to update Stripe IDs:");
  console.log(`
  UPDATE products
  SET stripe_product_id = 'prod_xxxxx', stripe_price_id = 'price_xxxxx'
  WHERE slug = '7-day-reset';
  `);

  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
