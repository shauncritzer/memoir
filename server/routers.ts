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

## The Critical Difference

**Sobriety** is abstinence from substances. It's necessary, but it's not sufficient.

**Recovery** is healing the underlying wounds that drove you to use in the first place. It's processing trauma, building authentic relationships, and creating a life worth staying sober for.

You can be sober and miserable. You can be sober and still emotionally unavailable to your kids. You can be sober and still carrying the same shame, rage, and fear that fueled your addiction.

That's not recovery. That's just... not drinking.

## What Changed for Me

Real recovery started when I finally addressed my childhood trauma through EMDR therapy. When I stopped performing and started being honest about who I was and what I'd done. When I built a support system that knew the real me, not the version I'd been performing for decades.

Recovery meant:
- Therapy (EMDR, CBT, group work)
- Rigorous honesty with myself and others
- Processing trauma instead of burying it
- Building authentic relationships
- Making amends through changed behavior
- Finding purpose beyond myself

## The Question That Matters

If you're sober but still miserable, ask yourself: **Am I just not drinking, or am I actually healing?**

Because sobriety without recovery is a ticking time bomb. Eventually, the pain you're not addressing will find a way out—through relapse, through other addictive behaviors, or through the slow death of living a half-life.

Recovery is possible. But it requires more than just putting down the bottle.

It requires picking up the work.

---

*If you're struggling with addiction or trauma, please reach out for help. Resources are available at [/resources](/resources).*`,
              publishedAt: new Date("2025-01-15"),
              authorId,
              status: "published" as const,
              viewCount: 0,
            },
            {
              title: "Why I Finally Talked About My Childhood Trauma",
              slug: "breaking-silence-childhood-trauma",
              excerpt: "I experienced childhood trauma that I didn't talk about for 25 years. When I finally did, it changed everything.",
              category: "Trauma",
              tags: JSON.stringify(["trauma", "healing", "childhood trauma"]),
              content: `# Why I Finally Talked About My Childhood Trauma

I experienced childhood trauma between ages 6-8. I didn't talk about it for 25 years.

When I finally did, it changed everything.

## The Weight of Silence

From age 6 to 8, I experienced boundary violations by someone I trusted. I never told anyone. Not my parents, not my friends, not my wife. I buried it so deep I almost convinced myself it didn't happen.

But trauma doesn't disappear just because you don't talk about it. It festers. It leaks out in other ways—rage, addiction, self-destruction, an inability to be truly intimate with anyone.

For decades, I carried that weight alone. And it was killing me.

## Why I Stayed Silent

**Shame.** I thought it was my fault somehow.

**Fear.** I was afraid no one would believe me.

**Protection.** I didn't want to hurt my family by bringing it up.

**Denial.** If I didn't talk about it, maybe it wasn't real.

These are the lies trauma tells you. And I believed every single one.

## What Finally Broke the Silence

Rock bottom. Multiple psych ward stays. Losing access to my kids. Wanting to die.

When I finally got to The Ranch treatment center in 2012, I had nothing left to lose. In a psychodrama session, surrounded by other broken people who understood, I finally said it out loud:

"I experienced childhood trauma."

And the world didn't end. In fact, it was the beginning of my healing.

## What Happened When I Spoke

**Relief.** The weight I'd been carrying for 25 years started to lift.

**Connection.** Other people shared their stories. I wasn't alone.

**Healing.** Through EMDR therapy, I was able to process the trauma instead of just carrying it.

**Freedom.** The shame lost its power when I brought it into the light.

## To Anyone Still Carrying This

If you experienced childhood trauma and you've never told anyone: **it wasn't your fault.**

You don't have to carry this alone. Speaking your truth doesn't make you weak—it makes you brave.

Healing is possible. But it starts with breaking the silence.

---

*If you've experienced childhood trauma, help is available:*
- *RAINN National Sexual Assault Hotline: 1-800-656-HOPE (4673)*
- *Crisis Text Line: Text HOME to 741741*`,
              publishedAt: new Date("2025-01-10"),
              authorId,
              status: "published" as const,
              viewCount: 0,
            },
            {
              title: "How Nervous System Dysregulation Drives Compulsive Behaviors",
              slug: "nervous-system-dysregulation-compulsive-behaviors",
              excerpt: "Compulsive behaviors aren't moral failures—they're nervous system responses to trauma. Here's how understanding this changes everything.",
              category: "Recovery",
              tags: JSON.stringify(["nervous system", "trauma", "compulsive behaviors", "regulation"]),
              content: `# How Nervous System Dysregulation Drives Compulsive Behaviors

For years, I thought my compulsive behaviors were a moral failure. A lack of willpower. A character defect that made me broken beyond repair.

I was wrong.

Compulsive behaviors—whether it's excessive drinking, overworking, scrolling social media for hours, or engaging in risky sexual behavior—aren't moral failures. They're nervous system responses to unresolved trauma.

## The Nervous System Explanation

Your nervous system has one job: keep you alive.

When you experience trauma—especially childhood trauma—your nervous system gets stuck in survival mode. It's constantly scanning for threats, flooding your body with stress hormones, and activating the fight-flight-freeze response.

This is called nervous system dysregulation.

And when you're stuck in that state? Your brain desperately seeks relief. It craves anything that will calm the storm inside.

That's where compulsive behaviors come in.

## Why Compulsions Work (Temporarily)

Compulsive behaviors provide temporary relief from nervous system dysregulation. They:

- Release dopamine (the brain's feel-good chemical)
- Create a sense of control in chaos
- Numb overwhelming emotions
- Provide predictable escape from unpredictable pain

But here's the trap: the relief is temporary. The dysregulation returns. And you need more of the behavior to get the same relief.

That's the addiction cycle.

## The Solution: Regulate, Don't Resist

Recovery isn't about willpower. It's about regulation.

When you learn to regulate your nervous system through:

- Breathwork
- Somatic exercises
- EMDR therapy
- Mindfulness practices
- Safe relationships

You don't need the compulsive behaviors anymore. The internal chaos calms down. The desperate need for escape fades.

This is why the REWIRED approach works. We don't shame you for the behavior. We help you regulate the nervous system that's driving it.

Because you're not broken. You're dysregulated. And that's something we can fix.`,
              publishedAt: new Date("2025-01-05"),
              authorId,
              status: "published" as const,
              viewCount: 0,
            },
            {
              title: "Why Willpower Alone Won't Keep You Sober",
              slug: "why-willpower-alone-wont-keep-you-sober",
              excerpt: "I white-knuckled sobriety for 18 months and almost relapsed. Here's what I learned about why willpower fails—and what actually works.",
              category: "Recovery",
              tags: JSON.stringify(["sobriety", "willpower", "nervous system", "relapse prevention"]),
              content: `# Why Willpower Alone Won't Keep You Sober

I was 18 months sober when I found myself standing in a liquor store, crying over bourbon bottles.

I had done everything "right":

- Attended meetings daily
- Worked the 12 steps
- Got a sponsor
- Stayed away from triggers

But I was miserable. Irritable. Restless. And dangerously close to throwing it all away.

Why? Because I was relying on willpower alone.

## The Willpower Myth

Here's what nobody tells you about early recovery: willpower is a finite resource.

Studies show that willpower depletes throughout the day. Every decision you make—from what to eat for breakfast to how to respond to a frustrating email—drains your willpower tank.

And when you're using ALL your willpower just to stay sober? You have nothing left for:

- Processing emotions
- Healing trauma
- Building healthy relationships
- Creating a life worth living

That's why so many people relapse. Not because they're weak. But because they're exhausted.

## What Actually Works

Recovery that lasts isn't built on willpower. It's built on:

**1. Nervous System Regulation**
Learning to calm your internal chaos without substances. Breathwork, somatic exercises, and trauma therapy aren't "nice to have"—they're essential.

**2. Community Support**
You can't do this alone. Safe relationships with people who understand what you're going through provide co-regulation—your nervous systems literally calm each other down.

**3. Meaningful Purpose**
Recovery gives you your life back. But you have to build a life worth staying sober for. What do you care about? What brings you joy? Start there.

**4. Self-Compassion**
You're going to make mistakes. You're going to have bad days. The question isn't "Will I struggle?" It's "How will I respond when I do?"

## The Turning Point

That day in the liquor store, I called someone. I admitted I was struggling. I asked for help.

And instead of white-knuckling through another day, I started doing the deeper work:

- EMDR therapy to process childhood trauma
- Breathwork to regulate my nervous system
- Building genuine connections with people in recovery
- Creating a life I didn't need to escape from

That was 11+ years ago. I haven't wanted a drink since.

Not because I have superhuman willpower. But because I learned to do the work that makes sobriety sustainable.

You can too.`,
              publishedAt: new Date("2025-01-02"),
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
