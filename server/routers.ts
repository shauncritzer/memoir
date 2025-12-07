import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createEmailSubscriber,
  getEmailSubscriberByEmail,
  getActiveleadMagnets,
  getLeadMagnetBySlug,
  trackLeadMagnetDownload,
  getPublishedBlogPosts,
  getBlogPostBySlug,
  incrementBlogPostViews,
} from "./db";
import { subscribeForLeadMagnet, subscribeToForm, CONVERTKIT_FORMS, CONVERTKIT_TAGS } from "./convertkit";
import Stripe from "stripe";

// Initialize Stripe only if API key is available
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: "2025-11-17.clover",
}) : null;

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Email subscription
  email: router({
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        source: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Create subscriber in local database
        const subscriber = await createEmailSubscriber({
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          source: input.source || "website",
          status: "active",
        });
        
        // Subscribe to ConvertKit based on source
        const sourceFormMap: Record<string, string> = {
          "homepage": CONVERTKIT_FORMS.HOMEPAGE_NEWSLETTER,
          "blog-sidebar": CONVERTKIT_FORMS.BLOG_SIDEBAR,
        };
        
        const sourceTagMap: Record<string, number> = {
          "homepage": CONVERTKIT_TAGS.HOMEPAGE_NEWSLETTER,
          "blog-sidebar": CONVERTKIT_TAGS.BLOG_SIDEBAR,
        };
        
        const formUid = sourceFormMap[input.source || "homepage"] || CONVERTKIT_FORMS.HOMEPAGE_NEWSLETTER;
        const tagId = sourceTagMap[input.source || "homepage"] || CONVERTKIT_TAGS.HOMEPAGE_NEWSLETTER;
        
        try {
          await subscribeToForm({
            email: input.email,
            firstName: input.firstName,
            formUid,
            tags: [tagId, CONVERTKIT_TAGS.ACTIVE_SUBSCRIBER],
          });
        } catch (error) {
          console.error("ConvertKit subscription failed:", error);
          // Don't fail the subscription if ConvertKit fails
        }
        
        return {
          success: true,
          subscriber,
        };
      }),
    
    checkSubscription: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        const subscriber = await getEmailSubscriberByEmail(input.email);
        return {
          isSubscribed: !!subscriber && subscriber.status === "active",
          subscriber,
        };
      }),
  }),

  // Lead magnets
  leadMagnets: router({
    list: publicProcedure.query(async () => {
      return getActiveleadMagnets();
    }),
    
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getLeadMagnetBySlug(input.slug);
      }),
    
    download: publicProcedure
      .input(z.object({
        slug: z.string(),
        email: z.string().email(),
      }))
      .mutation(async ({ input, ctx }) => {
        const leadMagnet = await getLeadMagnetBySlug(input.slug);
        
        if (!leadMagnet) {
          throw new Error("Lead magnet not found");
        }
        
        // Get or create subscriber in local database
        let subscriber = await getEmailSubscriberByEmail(input.email);
        if (!subscriber) {
          subscriber = await createEmailSubscriber({
            email: input.email,
            source: `lead-magnet-${input.slug}`,
            status: "active",
          });
        }
        
        // Subscribe to ConvertKit (this triggers email sequence with download link)
        const leadMagnetTypeMap: Record<string, "first_3_chapters" | "recovery_toolkit" | "reading_guide"> = {
          "first-3-chapters": "first_3_chapters",
          "recovery-toolkit": "recovery_toolkit",
          "reading-guide": "reading_guide",
        };
        
        const leadMagnetType = leadMagnetTypeMap[input.slug];
        if (leadMagnetType) {
          try {
            await subscribeForLeadMagnet({
              email: input.email,
              leadMagnetType,
            });
          } catch (error) {
            console.error("ConvertKit subscription failed:", error);
            // Don't fail the download if ConvertKit fails
          }
        }
        
        // Track download
        await trackLeadMagnetDownload({
          leadMagnetId: leadMagnet.id,
          subscriberId: subscriber.id,
          email: input.email,
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"],
        });
        
        return {
          success: true,
          downloadUrl: leadMagnet.fileUrl,
          leadMagnet,
        };
      }),
  }),

  // Stripe integration
  stripe: router({
    createCheckoutSession: publicProcedure
      .input(z.object({
        priceId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!stripe) {
          throw new Error("Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.");
        }
        
        const session = await stripe.checkout.sessions.create({
          mode: input.priceId.includes("month") ? "subscription" : "payment",
          line_items: [
            {
              price: input.priceId,
              quantity: 1,
            },
          ],
          success_url: `${process.env.VITE_APP_URL || "https://shauncritzer.com"}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.VITE_APP_URL || "https://shauncritzer.com"}/products`,
          customer_email: ctx.user?.email || undefined,
        });
        
        return {
          url: session.url!,
          sessionId: session.id,
        };
      }),
  }),

  // ConvertKit integration
  convertkit: router({
    subscribeForLeadMagnet: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          firstName: z.string().optional(),
          leadMagnetType: z.enum(["first_3_chapters", "recovery_toolkit", "reading_guide"]),
        })
      )
      .mutation(async ({ input }) => {
        const result = await subscribeForLeadMagnet(input);
        if (!result.success) {
          throw new Error(result.error || "Failed to subscribe to ConvertKit");
        }
        return { success: true };
      }),
  }),

  // Blog
  blog: router({
    // Public procedures
    list: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        const limit = input?.limit || 10;
        const offset = input?.offset || 0;
        return getPublishedBlogPosts(limit, offset);
      }),
    
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const post = await getBlogPostBySlug(input.slug);
        
        if (post && post.status === "published") {
          // Increment view count asynchronously
          incrementBlogPostViews(post.id).catch(console.error);
        }
        
        return post;
      }),
    
    // Admin-only procedures for blog management
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: z.enum(["draft", "published", "archived"]).default("draft"),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if user is owner
        if (ctx.user.openId !== process.env.OWNER_OPEN_ID) {
          throw new Error("Unauthorized: Only the owner can create blog posts");
        }
        
        const { createBlogPost } = await import("./db");
        
        // Generate slug from title
        const slug = input.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        
        return createBlogPost({
          title: input.title,
          slug,
          content: input.content,
          excerpt: input.excerpt,
          coverImage: input.coverImage,
          category: input.category,
          tags: input.tags ? JSON.stringify(input.tags) : undefined,
          status: input.status,
          authorId: ctx.user.id,
          publishedAt: input.status === "published" ? new Date() : undefined,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if user is owner
        if (ctx.user.openId !== process.env.OWNER_OPEN_ID) {
          throw new Error("Unauthorized: Only the owner can update blog posts");
        }
        
        const { updateBlogPost } = await import("./db");
        
        const updates: any = {};
        if (input.title) {
          updates.title = input.title;
          // Regenerate slug if title changes
          updates.slug = input.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        }
        if (input.content !== undefined) updates.content = input.content;
        if (input.excerpt !== undefined) updates.excerpt = input.excerpt;
        if (input.coverImage !== undefined) updates.coverImage = input.coverImage;
        if (input.category !== undefined) updates.category = input.category;
        if (input.tags) updates.tags = JSON.stringify(input.tags);
        if (input.status) {
          updates.status = input.status;
          // Set publishedAt when changing to published
          if (input.status === "published") {
            updates.publishedAt = new Date();
          }
        }
        
        return updateBlogPost(input.id, updates);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Check if user is owner
        if (ctx.user.openId !== process.env.OWNER_OPEN_ID) {
          throw new Error("Unauthorized: Only the owner can delete blog posts");
        }
        
        const { deleteBlogPost } = await import("./db");
        return deleteBlogPost(input.id);
      }),
    
    // Get all posts including drafts (admin only)
    listAll: protectedProcedure
      .query(async ({ ctx }) => {
        // Check if user is owner
        if (ctx.user.openId !== process.env.OWNER_OPEN_ID) {
          throw new Error("Unauthorized: Only the owner can view all posts");
        }
        
        const { getAllBlogPosts } = await import("./db");
        return getAllBlogPosts();
      }),
  }),

  // Members portal
  members: router({    getPurchases: protectedProcedure.query(async ({ ctx }) => {
      const { getUserPurchases } = await import("./db");
      return getUserPurchases(ctx.user.id);
    }),

    getCourseAccess: protectedProcedure
      .input(z.object({ productId: z.string() }))
      .query(async ({ input, ctx }) => {
        const { checkCourseAccess } = await import("./db");
        return checkCourseAccess(ctx.user.id, input.productId);
      }),

    getCourseProgress: protectedProcedure
      .input(z.object({ productId: z.string() }))
      .query(async ({ input, ctx }) => {
        const { getCourseProgress } = await import("./db");
        return getCourseProgress(ctx.user.id, input.productId);
      }),

    markLessonComplete: protectedProcedure
      .input(z.object({
        lessonId: z.number(),
        productId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { markLessonComplete } = await import("./db");
        return markLessonComplete(ctx.user.id, input.productId, input.lessonId);
      }),
  }),
  
  // Course admin
  courseAdmin: router({
    getAllLessons: protectedProcedure
      .query(async ({ ctx }) => {
        // Check if user is admin
        if (ctx.user.role !== 'admin') {
          throw new Error("Unauthorized: Admin access required");
        }
        
        const { getAllCourseLessons } = await import("./db");
        return getAllCourseLessons();
      }),
    
    updateLessonVideo: protectedProcedure
      .input(z.object({
        lessonId: z.number(),
        videoUrl: z.string().nullable(),
        videoDuration: z.number().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if user is admin
        if (ctx.user.role !== 'admin') {
          throw new Error("Unauthorized: Admin access required");
        }
        
        const { updateLessonVideo } = await import("./db");
        return updateLessonVideo(input.lessonId, input.videoUrl, input.videoDuration);
      }),
  }),

  // Admin utilities
  admin: router({
    seedBlogPosts: publicProcedure
      .input(z.object({
        secret: z.string().optional(),
      }).optional())
      .mutation(async ({ input }) => {
        // Simple protection - optional secret key
        if (input?.secret && input.secret !== process.env.ADMIN_SECRET && input.secret !== "seed-blog-posts-2025") {
          throw new Error("Unauthorized: Invalid secret key");
        }

        try {
          const { drizzle } = await import("drizzle-orm/mysql2");
          const { blogPosts, users } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");

          const db = drizzle(process.env.DATABASE_URL!);

          // Get the admin user (owner)
          const adminUsers = await db.select().from(users).where(eq(users.role, "admin")).limit(1);

          if (adminUsers.length === 0) {
            throw new Error("No admin user found. Please ensure an admin user exists.");
          }

          const authorId = adminUsers[0]!.id;

          // Delete existing posts to avoid duplicates
          await db.delete(blogPosts);

          const posts = [
            {
              title: "The Difference Between Sobriety and Recovery",
              slug: "sobriety-vs-recovery",
              excerpt: "I was sober for months at a time, white-knuckling through each day, but I wasn't in recovery. Here's why that distinction almost killed me.",
              category: "Recovery",
              tags: JSON.stringify(["recovery", "sobriety", "mental health"]),
              content: `# The Difference Between Sobriety and Recovery

For years, I thought sobriety and recovery were the same thing. I was wrong, and that misunderstanding almost cost me everything.

## What Sobriety Looked Like for Me

Between 2002 and 2012, I had multiple periods of sobriety. Weeks, sometimes months, without a drink or a drug. On paper, I was "clean." But inside? I was dying.

I was white-knuckling through every day, counting hours until I could justify using again. I was still lying, still manipulating, still running from my trauma. The only difference was I wasn't actively drinking.

That's sobriety without recovery.

I'd go to work, put on the mask, perform the role of "guy who has it together." Then I'd come home to an empty apartment, microwave a frozen dinner, and sit alone with my thoughts. No alcohol to numb them. No drugs to quiet them. Just me and the deafening roar of everything I was running from.

I thought that's what sobriety was supposed to feel like. I thought I was supposed to be miserable. That this was my punishment for all the damage I'd done.

## The Critical Difference

**Sobriety** is abstinence from substances. It's necessary, but it's not sufficient.

**Recovery** is healing the underlying wounds that drove you to use in the first place. It's processing trauma, building authentic relationships, and creating a life worth staying sober for.

You can be sober and miserable. You can be sober and still emotionally unavailable to your kids. You can be sober and still carrying the same shame, rage, and fear that fueled your addiction.

That's not recovery. That's just... not drinking.

And here's the brutal truth: if you're sober but not in recovery, you're one bad day away from relapse. Because eventually, the pain catches up. Eventually, the dysregulated nervous system demands relief. And when it does, willpower won't save you.

## What Changed for Me

Real recovery started when I finally addressed my childhood trauma through EMDR therapy. When I stopped performing and started being honest about who I was and what I'd done. When I built a support system that knew the real me, not the version I'd been performing for decades.

Recovery meant:
- **Therapy** (EMDR, CBT, group work) to process the trauma I'd been running from
- **Rigorous honesty** with myself and others, even when it was terrifying
- **Processing trauma** instead of burying it under achievement and performance
- **Building authentic relationships** where people knew my story and loved me anyway
- **Making amends** through changed behavior, not just empty apologies
- **Finding purpose** beyond myself—service, connection, meaning

It meant sitting with uncomfortable emotions instead of numbing them. It meant learning to regulate my nervous system through breathwork, somatic exercises, and co-regulation with safe people. It meant grieving the childhood I didn't get and the decades I lost to addiction.

That work? It's harder than sobriety. But it's also what makes sobriety sustainable.

## The Question That Matters

If you're sober but still miserable, ask yourself: **Am I just not drinking, or am I actually healing?**

Because sobriety without recovery is a ticking time bomb. Eventually, the pain you're not addressing will find a way out—through relapse, through other addictive behaviors, or through the slow death of living a half-life.

I've watched people with 5, 10, even 15 years of sobriety relapse because they never did the deeper work. They stayed sober, but they never healed. And the unhealed parts eventually demanded attention.

Recovery is possible. But it requires more than just putting down the bottle.

It requires picking up the work.

It requires admitting you need help. Finding a therapist who understands trauma. Showing up to meetings even when you don't want to. Being honest about the ugly parts. Building relationships where you can be seen and loved anyway. Processing the shame. Forgiving yourself. Creating a life worth staying sober for.

That's recovery. And it's worth every ounce of effort.

---

*If you're struggling with addiction or trauma, please reach out for help. Resources are available at [/resources](/resources).*`,
              publishedAt: new Date("2025-01-15"),
              authorId,
              status: "published" as const,
              viewCount: 0,
            },
          ];

          // Insert posts
          for (const post of posts) {
            await db.insert(blogPosts).values(post);
          }

          return {
            success: true,
            message: `Successfully seeded ${posts.length} blog posts`,
            postsCreated: posts.length,
          };
        } catch (error: any) {
          console.error("Blog seed error:", error);
          throw new Error(`Failed to seed blog posts: ${error.message}`);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
