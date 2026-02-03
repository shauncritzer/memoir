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
  getOrCreateAiCoachUser,
  getAiCoachUserByEmail,
  incrementAiCoachMessageCount,
  grantAiCoachUnlimitedAccess,
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
        
        // Add cache-busting parameter to PDF downloads
        let downloadUrl = leadMagnet.fileUrl;
        if (downloadUrl && downloadUrl.endsWith('.pdf')) {
          downloadUrl = `${downloadUrl}?v=${Date.now()}`;
        }

        return {
          success: true,
          downloadUrl,
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
        
        // Determine mode based on price ID (Monthly Membership is subscription)
        const isSubscription = input.priceId === "price_1SYt3jC2dOpPzSOOR7dDuGtY"; // Monthly Membership

        const session = await stripe.checkout.sessions.create({
          mode: isSubscription ? "subscription" : "payment",
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
  members: router({
    getPurchases: protectedProcedure.query(async ({ ctx }) => {
      const { getUserPurchases } = await import("./db");
      return getUserPurchases(ctx.user.id);
    }),

    getCourseContent: protectedProcedure
      .input(z.object({ moduleId: z.number() }))
      .query(async ({ input }) => {
        const { getLessonsByProductId } = await import("./db");
        const lessons = await getLessonsByProductId(input.moduleId.toString());
        return { lessons };
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
            {
              title: "Why I Finally Talked About My Childhood Trauma",
              slug: "breaking-silence-childhood-trauma",
              excerpt: "I experienced childhood trauma that I didn't talk about for 25 years. When I finally did, it changed everything.",
              category: "Trauma",
              tags: JSON.stringify(["trauma", "healing", "childhood trauma"]),
              content: `# Why I Finally Talked About My Childhood Trauma

I experienced childhood trauma between ages 6-8. I didn't talk about it for 25 years. When I finally did, it changed everything.

## The Weight of Silence

From age 6 to 8, I experienced boundary violations by someone I trusted. I never told anyone. Not my parents, not my friends, not my wife. I buried it so deep I almost convinced myself it didn't happen.

But trauma doesn't disappear just because you don't talk about it. It festers. It leaks out in other ways—rage, addiction, self-destruction, an inability to be truly intimate with anyone.

For decades, I carried that weight alone. And it was killing me.

I became a master at compartmentalization. I locked that part of my childhood in a mental box, threw away the key, and built my entire identity around performance and achievement. Mr. Teen USA. Successful entrepreneur. Perfect husband and father (at least on the surface).

But no matter how much I achieved, I couldn't outrun what happened. The shame showed up in my addiction. The fear showed up in my inability to be truly vulnerable with anyone. The rage showed up in explosive outbursts I couldn't control.

Unprocessed trauma doesn't fade with time. It compounds. And every year I stayed silent, the weight got heavier.

## Why I Stayed Silent

**Shame.** I thought it was my fault somehow. That I had done something to deserve it or invite it. That speaking about it would confirm what I secretly believed: that I was damaged goods.

**Fear.** I was afraid no one would believe me. That they'd minimize it or dismiss it. That speaking my truth would somehow make me less of a man.

**Protection.** I didn't want to hurt my family by bringing it up. What good would it do to dredge up the past? Better to just... move on. (Spoiler: I wasn't moving on. I was drowning.)

**Denial.** If I didn't talk about it, maybe it wasn't real. Maybe I could convince myself it wasn't that bad. Maybe I could pretend it never happened.

These are the lies trauma tells you. And I believed every single one. The silence wasn't protecting anyone. It was poisoning me from the inside out.

## What Finally Broke the Silence

Rock bottom. Multiple psych ward stays. Losing access to my kids. Wanting to die.

When I finally got to The Ranch treatment center in 2012, I had nothing left to lose. In a psychodrama session, surrounded by other broken people who understood, I finally said it out loud: "I experienced childhood trauma."

My voice shook. Tears streamed down my face. I felt like I might throw up. And the world didn't end. In fact, it was the beginning of my healing.

The other men in the room didn't judge me. They didn't look at me with pity or disgust. Many of them shared their own stories. And for the first time in my life, I realized: I wasn't alone.

## What Happened When I Spoke

**Relief.** The weight I'd been carrying for 25 years started to lift. It wasn't gone overnight, but for the first time, I could breathe.

**Connection.** Other people shared their stories. I learned that childhood trauma isn't rare—it's heartbreakingly common. And that community of shared pain became the foundation of my healing.

**Healing.** Through EMDR therapy, I was able to process the trauma instead of just carrying it. EMDR helped my brain reprocess the memories so they no longer triggered the same dysregulated nervous system response.

**Freedom.** The shame lost its power when I brought it into the light. What I'd been hiding in darkness—convinced it would destroy me if anyone knew—became the very thing that connected me to others and set me free.

Speaking my truth didn't break me. Silence was what was breaking me.

## To Anyone Still Carrying This

If you experienced childhood trauma and you've never told anyone: **it wasn't your fault.** Read that again. It. Wasn't. Your. Fault.

You don't have to carry this alone. Speaking your truth doesn't make you weak—it makes you brave. You don't have to tell everyone. But tell someone. A therapist, a trusted friend, a support group. Break the silence with someone who can hold space for your story without judgment.

Healing is possible. But it starts with breaking the silence.

The shame you're carrying? It belongs to the person who hurt you, not to you. You were a child. You deserved safety, love, and protection. What happened wasn't your fault, and healing is your birthright.

I know it feels terrifying. I know you've carried this alone for so long that speaking it out loud feels impossible. But I promise you: the relief on the other side of honesty is worth the terror of speaking.

You're not broken. You're not damaged. You're wounded, and wounds can heal. But they can't heal in the dark.

---

*If you've experienced childhood trauma, help is available:*
- *RAINN: 1-800-656-HOPE (4673)*
- *Crisis Text Line: Text HOME to 741741*
- *SAMHSA: 1-800-662-4357*`,
              publishedAt: new Date("2025-01-10"),
              authorId,
              status: "published" as const,
              viewCount: 0,
            },
            {
              title: "How Nervous System Dysregulation Drives Compulsive Behaviors",
              slug: "nervous-system-dysregulation-compulsive-behaviors",
              excerpt: "Compulsive behaviors aren't moral failures—they're nervous system responses to trauma.",
              category: "Recovery",
              tags: JSON.stringify(["nervous system", "trauma", "compulsive behaviors"]),
              content: `# How Nervous System Dysregulation Drives Compulsive Behaviors

For years, I thought my compulsive behaviors were a moral failure. A lack of willpower. A character defect that made me broken beyond repair.

I was wrong.

Compulsive behaviors—whether excessive drinking, overworking, scrolling social media for hours, or engaging in risky sexual behavior—aren't moral failures. They're nervous system responses to unresolved trauma.

## The Nervous System Explanation

Your nervous system has one job: keep you alive.

When you experience trauma—especially childhood trauma—your nervous system gets stuck in survival mode. It's constantly scanning for threats, flooding your body with stress hormones (cortisol and adrenaline), and activating the fight-flight-freeze response.

This is called nervous system dysregulation.

And when you're stuck in that state? Your brain desperately seeks relief. It craves anything that will calm the storm inside.

That's where compulsive behaviors come in.

Here's what most people don't understand: your compulsive behaviors aren't the problem. They're your nervous system's attempt at a solution.

Your nervous system is trying to regulate itself the only way it knows how—through behaviors that provide temporary relief from the chronic dysregulation caused by unprocessed trauma.

## My Story: From Achievement to Addiction

I experienced childhood trauma between ages 6-8. My nervous system got stuck in hypervigilance—constantly scanning for danger, never feeling safe, always preparing for the next threat.

As a teenager, I discovered bodybuilding. The intense workouts, the strict diet, the control over my body—it all gave me temporary relief from the internal chaos. It was a compulsive behavior, but it was socially acceptable. I became Mr. Teen USA.

But the relief was temporary. The dysregulation remained.

So I added alcohol. Then prescription drugs. Then affairs. Then work addiction. Each behavior provided a brief escape from the nervous system chaos—until it didn't. Then I needed more.

This wasn't a moral failure. This was a dysregulated nervous system desperately seeking regulation through external behaviors.

## Why Compulsions Work (Temporarily)

Compulsive behaviors provide temporary relief from nervous system dysregulation. They:

- Release dopamine (the brain's feel-good chemical) which temporarily overrides the stress response
- Create a sense of control in the midst of internal chaos
- Numb overwhelming emotions that your nervous system can't process
- Provide predictable escape from unpredictable pain
- Activate the parasympathetic nervous system (the "rest and digest" state) temporarily

But here's the trap: the relief is temporary. The underlying dysregulation remains. And over time, you need more of the behavior to get the same relief.

That's the addiction cycle. Not moral failure. Nervous system dysregulation seeking temporary regulation.

## The Solution: Regulate, Don't Resist

Recovery isn't about willpower. It's about regulation.

When you learn to regulate your nervous system through trauma-informed practices:

- Breathwork (box breathing, diaphragmatic breathing) activates the vagus nerve and shifts you into parasympathetic mode
- Somatic exercises (body scans, progressive muscle relaxation) release stored trauma from your body
- EMDR therapy reprocesses traumatic memories so they no longer trigger dysregulation
- Mindfulness practices help you notice dysregulation early and respond with regulation tools
- Safe relationships provide co-regulation—your nervous systems literally calm each other down

You don't need the compulsive behaviors anymore. The internal chaos calms down. The desperate need for escape fades.

This is why the REWIRED approach works. We don't shame you for the behavior. We help you regulate the nervous system that's driving it.

## What This Means for Your Recovery

If you're stuck in compulsive behaviors, ask yourself: What is my nervous system trying to tell me?

The behavior isn't the enemy. The unresolved trauma and resulting nervous system dysregulation is what needs healing.

Stop trying to white-knuckle your way out of compulsive behaviors. Start learning to regulate your nervous system. Address the trauma. Build safety in your body. Learn somatic tools. Find co-regulating relationships.

Because you're not broken. You're not weak. You're not morally deficient.

You're dysregulated. And that's something we can heal.

---

*If you're struggling with compulsive behaviors and want to learn nervous system regulation tools, visit [/resources](/resources) for free downloads and support.*`,
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

I was 18 months sober when I found myself standing in a liquor store at 11 PM, crying over bourbon bottles.

I had done everything "right":

- Attended meetings daily
- Worked the 12 steps
- Got a sponsor
- Stayed away from triggers
- White-knuckled through every craving

But I was miserable. Irritable. Restless. And dangerously close to throwing it all away.

Why? Because I was relying on willpower alone.

## The Willpower Myth

Here's what nobody tells you about early recovery: willpower is a finite resource.

Studies show that willpower depletes throughout the day. Every decision you make—from what to eat for breakfast to how to respond to a frustrating email to whether or not you'll snap at your kids—drains your willpower tank.

It's called decision fatigue. And it's real.

And when you're using ALL your willpower just to stay sober? You have nothing left for:

- Processing emotions
- Healing trauma
- Building healthy relationships
- Being present with your kids
- Creating a life worth living

That's why so many people relapse. Not because they're weak. But because they're exhausted from trying to muscle their way through recovery.

## My White-Knuckle Sobriety

Let me paint you a picture of what 18 months of sobriety looked like for me:

I woke up every morning already tense, already bracing for the day. I went to a meeting before work, forced myself to share, forced myself to smile and say I was "grateful to be sober."

But inside? I was screaming.

I went to work and performed. Perfect employee. Perfect entrepreneur. Perfect performance of "guy who has his life together."

I came home, avoided my family because I didn't trust myself not to explode, microwaved dinner, and sat alone counting the hours until I could justify going to bed.

Then I'd lie awake, white-knuckling cravings, telling myself, "Just don't drink today. Just don't drink today."

I was sober. But I wasn't recovering. I was just... not drinking.

And eventually, that wasn't enough.

## What Actually Works

Recovery that lasts isn't built on willpower. It's built on:

**1. Nervous System Regulation**

Learning to calm your internal chaos without substances. Breathwork, somatic exercises, and trauma therapy aren't "nice to have"—they're essential.

Your addiction wasn't a moral failure. It was your nervous system's attempt to regulate itself. If you don't learn healthier regulation tools, your nervous system will eventually demand the old ones back.

I started doing breathwork every morning. Box breathing. 4-7-8 breathing. Simple practices that activated my vagus nerve and shifted me out of fight-or-flight mode.

It sounds too simple to work. But it does.

**2. Community Support**

You can't do this alone. Safe relationships with people who understand what you're going through provide co-regulation—your nervous systems literally calm each other down.

I stopped performing in meetings and started being honest. "I'm struggling. I'm 18 months sober and I want to drink. I don't know how to do this."

And instead of judgment, I found connection. Other people shared their struggles. We co-regulated each other. The isolation broke.

**3. Meaningful Purpose**

Recovery gives you your life back. But you have to build a life worth staying sober for. What do you care about? What brings you joy? Start there.

I started asking myself: What do I actually want? Not what I think I should want. What do I actually care about?

For me, it was being present with my kids. Running companies that help people. Writing. Connection. Service.

I started building a life around those things. And suddenly, sobriety wasn't something I had to white-knuckle through. It was the foundation that made the life I wanted possible.

**4. Self-Compassion**

You're going to make mistakes. You're going to have bad days. The question isn't "Will I struggle?" It's "How will I respond when I do?"

I spent years beating myself up for every slip, every craving, every moment of weakness. That shame kept me stuck.

When I started responding to struggles with compassion instead of condemnation, everything changed. "Of course you're struggling. You experienced childhood trauma. Your nervous system is dysregulated. This is hard. What do you need right now?"

That shift—from shame to compassion—made recovery sustainable.

## The Turning Point

That night in the liquor store, I called someone. I admitted I was struggling. I asked for help.

And instead of white-knuckling through another day, I started doing the deeper work:

- EMDR therapy to process childhood trauma
- Breathwork and somatic exercises to regulate my nervous system
- Building genuine connections with people in recovery
- Creating a life I didn't need to escape from
- Practicing self-compassion instead of self-condemnation

That was 11+ years ago. I haven't wanted a drink since.

Not because I have superhuman willpower. But because I learned to do the work that makes sobriety sustainable.

## The Work That Actually Works

If you're white-knuckling sobriety, exhausted from relying on willpower alone, here's what I want you to know:

You're not failing. The approach is failing you.

Sobriety built on willpower alone is exhausting and unsustainable. Sobriety built on nervous system regulation, community support, meaningful purpose, and self-compassion? That lasts.

Stop trying to muscle your way through recovery. Start doing the deeper work.

You can do this. Not because you're strong enough to white-knuckle forever. But because you're brave enough to do the work that makes white-knuckling unnecessary.

---

*If you need support in your recovery journey, visit [/resources](/resources) for free tools and crisis resources.*`,
              publishedAt: new Date("2025-01-02"),
              authorId,
              status: "published" as const,
              viewCount: 0,
            },
            {
              title: "The Science Behind Compulsive Behaviors: It's Not About Willpower",
              slug: "science-behind-compulsive-behaviors",
              excerpt: "Neuroscience research shows that compulsive behaviors are driven by brain chemistry and nervous system dysregulation—not moral weakness.",
              category: "Science",
              tags: JSON.stringify(["neuroscience", "compulsive behaviors", "addiction science", "brain chemistry"]),
              content: `# The Science Behind Compulsive Behaviors: It's Not About Willpower

For decades, we treated addiction and compulsive behaviors as moral failures. Lack of willpower. Character defects. If you just tried harder, you'd stop.

The science tells a different story.

## What Neuroscience Teaches Us About Addiction

Modern neuroscience has revolutionized our understanding of compulsive behaviors. Here's what we now know:

**1. Addiction Changes Brain Structure**

Repeated engagement in compulsive behaviors (substances, affairs, work, etc.) physically changes your brain. Specifically:

- The prefrontal cortex (responsible for decision-making and impulse control) becomes less active
- The amygdala (responsible for emotion and stress response) becomes hyperactive
- The reward pathway (dopamine system) becomes desensitized

This isn't weakness. This is neurobiology.

**2. Trauma Primes the Brain for Addiction**

Childhood trauma fundamentally alters brain development. Studies using fMRI scans show that people who experienced childhood trauma have:

- Smaller hippocampus volume (memory and emotional regulation)
- Hyperactive amygdala (threat detection and stress response)
- Reduced connectivity between prefrontal cortex and limbic system

Translation: Your brain was wired for survival, not self-regulation. Compulsive behaviors become the brain's attempt to regulate what it can't regulate naturally.

**3. The Dopamine Trap**

Compulsive behaviors flood the brain with dopamine—up to 10 times the normal level. This feels amazing... temporarily.

But here's the problem: your brain adapts. It downregulates dopamine receptors to protect itself from overstimulation. Now you need more of the behavior to get the same effect.

This is called tolerance. And it's not a choice—it's brain chemistry.

## My Story: From Mr. Teen USA to Rock Bottom

At 17, I was crowned Mr. Teen USA. I had discipline. I had drive. I had what everyone thought was "willpower."

But what I actually had was a dysregulated nervous system desperately seeking regulation through compulsive achievement.

Bodybuilding gave me temporary relief from the internal chaos caused by childhood trauma. The intense workouts, strict diet, and control over my body flooded my brain with dopamine and endorphins.

But the relief was temporary. My brain adapted. I needed more.

So I added alcohol. Then prescription drugs. Then affairs. Then work addiction. Each behavior hijacked my brain's reward system, promising relief but delivering dependence.

This wasn't moral failure. This was neurobiology.

## The Polyvagal Theory: Why Your Nervous System Drives Behavior

Dr. Stephen Porges' Polyvagal Theory explains why compulsive behaviors feel impossible to stop:

Your autonomic nervous system has three states:

**1. Ventral Vagal (Safe and Social)**
When you feel safe, your prefrontal cortex is online. You can make rational decisions. You can self-regulate. This is where recovery happens.

**2. Sympathetic (Fight or Flight)**
When you feel threatened, your amygdala takes over. Logic goes offline. You're in survival mode. Compulsive behaviors promise quick relief from this state.

**3. Dorsal Vagal (Freeze/Shutdown)**
When overwhelm becomes too much, you shut down. Numb. Disconnected. Depression. Many compulsive behaviors are attempts to escape this state.

Here's the key insight: If your nervous system is stuck in sympathetic or dorsal states due to unprocessed trauma, willpower can't override biology.

You can't think your way out of a nervous system problem.

## The ACEs Study: Childhood Trauma and Adult Addiction

The Adverse Childhood Experiences (ACEs) Study followed 17,000 people and found:

- People with 4+ ACEs are 7x more likely to become alcoholics
- People with 4+ ACEs are 4600% more likely to inject drugs
- The higher your ACE score, the earlier your first use and the more severe your addiction

This isn't correlation. This is causation.

Childhood trauma dysregulates the developing nervous system. That dysregulated nervous system seeks external regulation through compulsive behaviors.

It's not moral failure. It's neurodevelopmental adaptation to trauma.

## The Shame Spiral: How Misunderstanding the Science Keeps Us Sick

When we believe compulsive behaviors are willpower failures, we respond with shame.

And here's what neuroscience shows about shame:

- Shame activates the amygdala (threat response)
- Shame deactivates the prefrontal cortex (rational thinking)
- Shame floods the body with cortisol (stress hormone)
- Cortisol triggers craving for dopamine-releasing behaviors

In other words: shaming yourself for compulsive behaviors makes the compulsive behaviors worse.

The shame spiral keeps you stuck. Not because you're weak. Because shame dysregulates your nervous system, which triggers more need for regulation through compulsive behaviors.

## The Science-Based Path Forward

If compulsive behaviors are driven by brain chemistry and nervous system dysregulation—not moral failure—then recovery must address those root causes:

**1. Nervous System Regulation**

- Breathwork activates the vagus nerve (shifts from sympathetic to ventral vagal)
- Somatic exercises release stored trauma from the body
- EMDR therapy reprocesses traumatic memories (reduces amygdala hyperactivity)

**2. Neuroplasticity: Rewiring the Brain**

Your brain can change. New experiences create new neural pathways. Recovery isn't about willpower—it's about creating new patterns through:

- Safe relationships (co-regulation rewires social engagement system)
- Mindfulness practices (strengthens prefrontal cortex)
- Therapy (processes trauma and builds new neural pathways)

**3. Addressing Root Causes**

Stop treating symptoms. Address the trauma causing nervous system dysregulation. Process the shame. Build safety in your body. Learn regulation tools.

## What This Means for You

If you're stuck in compulsive behaviors, please hear this:

You're not broken. You're not weak. You're not morally deficient.

Your brain and nervous system are doing exactly what they were wired to do in response to trauma and chronic stress.

The solution isn't more willpower. It's understanding the neuroscience and addressing the root causes.

Recovery is possible. But it requires working with your biology, not against it.

---

*For science-based recovery resources and trauma-informed tools, visit [/resources](/resources).*`,
              publishedAt: new Date("2024-12-28"),
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

    fixLeadMagnetPDFs: publicProcedure
      .input(z.object({
        secret: z.string().optional(),
      }).optional())
      .mutation(async ({ input }) => {
        // Simple protection - optional secret key
        if (input?.secret && input.secret !== process.env.ADMIN_SECRET && input.secret !== "fix-pdfs-2025") {
          throw new Error("Unauthorized: Invalid secret key");
        }

        try {
          const { drizzle } = await import("drizzle-orm/mysql2");
          const { leadMagnets } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");

          const db = drizzle(process.env.DATABASE_URL!);

          // Update Recovery Toolkit to point to public folder PDF
          await db.update(leadMagnets)
            .set({
              fileUrl: "/recovery-toolkit.pdf",
              updatedAt: new Date()
            })
            .where(eq(leadMagnets.slug, "recovery-toolkit"));

          // Update Reading Guide to point to public folder PDF
          await db.update(leadMagnets)
            .set({
              fileUrl: "/reading-guide.pdf",
              updatedAt: new Date()
            })
            .where(eq(leadMagnets.slug, "reading-guide"));

          return {
            success: true,
            message: "PDF URLs updated successfully! PDFs now point to /client/public/ versions with correct apostrophes.",
            updatedCount: 2
          };
        } catch (error: any) {
          console.error("PDF fix error:", error);
          throw new Error(`Failed to fix PDF URLs: ${error.message}`);
        }
      }),

    seedNewBlogPosts: publicProcedure
      .input(z.object({
        secret: z.string().optional(),
      }).optional())
      .mutation(async ({ input }) => {
        // Simple protection - optional secret key
        if (input?.secret && input.secret !== process.env.ADMIN_SECRET && input.secret !== "seed-new-blogs-2025") {
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

          const newPosts = [
            {
              title: "Your Addiction Isn't a Moral Failing, It's a Nervous System Problem",
              slug: "addiction-nervous-system-problem",
              excerpt: "For years, I thought my addiction was a character defect. I was wrong. Here's what neuroscience taught me about why we use—and how to actually heal.",
              category: "Neuroscience",
              tags: JSON.stringify(["nervous system", "addiction", "neuroscience", "trauma"]),
              content: `# Your Addiction Isn't a Moral Failing, It's a Nervous System Problem\n\nFor years, I believed the story society told me about addiction: it was a moral failing, a character defect, a lack of willpower.\n\nI was wrong. And that misunderstanding almost killed me.\n\n## The Real Story: Nervous System Dysregulation\n\nAddiction isn't about being weak or broken. It's about having a dysregulated nervous system desperately seeking regulation.\n\nYour nervous system has two primary states:\n\n**Sympathetic (Fight or Flight):** Activated when you perceive threat. Heart races, muscles tense, thoughts spiral. You're wired for survival, not connection.\n\n**Parasympathetic (Rest and Digest):** Activated when you feel safe. Heart rate slows, muscles relax, thoughts settle. You're wired for connection, healing, and growth.\n\nWhen you experience childhood trauma, chronic stress, or prolonged adversity, your nervous system gets stuck in fight-or-flight mode. You're constantly scanning for threat. Your body is flooded with cortisol and adrenaline. You can't relax, can't connect, can't feel safe.\n\nAnd substances? They temporarily shift you out of that state. Alcohol, drugs, sex, work, food—they all provide temporary nervous system regulation.\n\nThat's not moral weakness. That's your nervous system trying to survive.\n\n## My Story: From Achievement to Addiction\n\nAt 17, I was crowned Mr. Teen USA. I had discipline, drive, and what everyone thought was "willpower."\n\nBut what I actually had was a dysregulated nervous system desperately seeking regulation through compulsive achievement.\n\nBodybuilding gave me temporary relief from the internal chaos caused by childhood trauma. The intense workouts, strict diet, and control over my body flooded my brain with dopamine and endorphins.\n\nBut the relief was temporary. My brain adapted. I needed more.\n\nSo I added alcohol. Then drugs. Then affairs. Then work addiction. Each one provided temporary regulation. Each one eventually stopped working.\n\nBy 2012, I was in multiple psych wards, had lost access to my kids, and wanted to die.\n\nI thought I was broken. I thought I was weak. I thought I was a moral failure.\n\nI was none of those things. I was dysregulated.\n\n## The Science: What Trauma Does to Your Brain\n\nModern neuroscience has revolutionized our understanding of addiction. Here's what we now know:\n\n**1. Trauma Changes Brain Structure**\n\nChildhood trauma fundamentally alters brain development. Studies using fMRI scans show that people who experienced childhood trauma have:\n\n- Smaller hippocampus volume (memory and emotional regulation)\n- Hyperactive amygdala (threat detection and stress response)\n- Reduced connectivity between prefrontal cortex and limbic system\n\nTranslation: Your brain was wired for survival, not self-regulation. Compulsive behaviors become the brain's attempt to regulate what it can't regulate naturally.\n\n**2. The Polyvagal Theory**\n\nDr. Stephen Porges' Polyvagal Theory explains how our nervous system responds to safety and threat. The vagus nerve—the longest nerve in your body—is the primary pathway for nervous system regulation.\n\nWhen you feel safe, your vagus nerve activates the parasympathetic "rest and digest" state. When you feel threatened, it activates the sympathetic "fight or flight" state.\n\nPeople with trauma histories have a hyperactive threat detection system. Their vagus nerve is stuck in survival mode. Substances temporarily activate the parasympathetic state, providing relief.\n\nBut it's temporary. And it doesn't address the root cause: a dysregulated nervous system.\n\n## What Actually Heals: Nervous System Regulation\n\nRecovery isn't about willpower. It's about learning to regulate your nervous system without substances.\n\nHere's what worked for me:\n\n**1. Breathwork**\n\nSimple breathing exercises activate the vagus nerve and shift you out of fight-or-flight mode.\n\n- Box Breathing: Inhale 4, hold 4, exhale 4, hold 4\n- 4-7-8 Breathing: Inhale 4, hold 7, exhale 8\n\nIt sounds too simple to work. But it does.\n\n**2. Somatic Therapy**\n\nTrauma lives in the body, not just the mind. Somatic therapy helps you process trauma through body-based practices.\n\nEMDR (Eye Movement Desensitization and Reprocessing) was life-changing for me. It helped my brain reprocess traumatic memories so they no longer triggered the same dysregulated nervous system response.\n\n**3. Co-Regulation**\n\nYour nervous system regulates in relationship with safe others. This is called co-regulation.\n\nSafe relationships with people who understand what you're going through provide nervous system regulation that you can't generate alone.\n\nI stopped performing in recovery meetings and started being honest. "I'm struggling. I'm dysregulated. I need help."\n\nAnd instead of judgment, I found connection. Other people shared their struggles. We co-regulated each other. The isolation broke.\n\n**4. Self-Compassion**\n\nShame activates the threat detection system. Compassion activates the safety system.\n\nWhen I started responding to struggles with compassion instead of condemnation, everything changed. "Of course you're struggling. You experienced childhood trauma. Your nervous system is dysregulated. This is hard. What do you need right now?"\n\nThat shift—from shame to compassion—made recovery sustainable.\n\n## The Bottom Line\n\nYou're not broken. You're not weak. You're not a moral failure.\n\nYou're dysregulated. And that's something we can heal.\n\nRecovery isn't about white-knuckling sobriety through sheer willpower. It's about learning to regulate your nervous system through breathwork, somatic therapy, co-regulation, and self-compassion.\n\nIt's about addressing the root cause—not just managing symptoms.\n\nThat's the work. And it's worth every ounce of effort.\n\n---\n\n*If you're struggling with addiction or trauma, please reach out for help. Resources are available at [/resources](/resources).*`,
              publishedAt: new Date("2025-01-20"),
              authorId,
              status: "published" as const,
              viewCount: 0,
            },
            {
              title: "The Most Underrated Tool in Recovery: Self-Compassion",
              slug: "most-underrated-tool-recovery-self-compassion",
              excerpt: "Stop beating yourself up. Discover the science-backed power of self-compassion in addiction recovery and learn a simple practice to break the cycle of shame and relapse.",
              category: "Recovery",
              tags: JSON.stringify(["self-compassion", "recovery", "shame", "trauma"]),
              content: `# The Most Underrated Tool in Recovery: Self-Compassion\n\nIn the world of addiction recovery, we talk a lot about tough love, hitting rock bottom, and radical honesty. We're told to take a fearless moral inventory and to admit our wrongs. These are powerful and necessary tools.\n\nBut there's another tool, one that is often overlooked, dismissed, or misunderstood, that may be the single most important factor in long-term, sustainable recovery: **self-compassion.**\n\nFor many of us, the idea of being kind to ourselves feels foreign, self-indulgent, or just plain wrong. We're used to a different approach: self-criticism. We have a drill sergeant in our heads that tells us we're stupid, weak, and worthless. We believe that if we are hard enough on ourselves, we'll finally change.\n\nBut what if that approach is actually fueling your addiction?\n\n## The Vicious Cycle of Shame and Addiction\n\nThink about it. You have a craving. The inner critic starts screaming at you: "You're so weak! You can't even handle this." You feel ashamed. That shame is so painful that you desperately want to escape it. So, you use. And then what happens? The inner critic comes back with a vengeance: "See? I told you you were a failure. You're hopeless." This triggers even more shame, which leads to more using. It's a vicious, self-perpetuating cycle.\n\nShame doesn't motivate change. It paralyzes us. It drives us into isolation. It is the food that addiction feeds on.\n\nSelf-compassion is the antidote to shame.\n\n## What Self-Compassion Is (and Isn't)\n\nDr. Kristin Neff, the world's leading researcher on self-compassion, defines it as having three main components:\n\n1. **Self-Kindness vs. Self-Judgment:** This means treating yourself with the same warmth, care, and understanding that you would offer to a good friend who was struggling.\n\n2. **Common Humanity vs. Isolation:** This involves recognizing that suffering and personal failure are part of the shared human experience. You are not the only one who has ever felt this way. It connects you to others instead of isolating you in your shame.\n\n3. **Mindfulness vs. Over-Identification:** This is about holding your painful thoughts and feelings in balanced awareness, neither suppressing them nor getting lost in them.\n\nSelf-compassion is not self-pity, self-indulgence, or letting yourself off the hook. It's about acknowledging your pain, treating yourself with kindness, and recognizing that you're not alone.\n\n## The Science: Self-Compassion Reduces Relapse\n\nResearch shows that people with higher levels of self-compassion are more likely to maintain long-term recovery. Why? Because self-compassion breaks the shame-relapse cycle. When you respond to a slip or a craving with kindness instead of criticism, you're less likely to spiral into a full relapse.\n\nSelf-compassion also increases motivation. When you feel safe and supported (even by yourself), you're more likely to take healthy risks and make positive changes.\n\n## A Simple Self-Compassion Practice\n\nThe next time you're struggling, try this:\n\n1. **Acknowledge your pain:** "This is really hard right now. I'm suffering."\n2. **Remind yourself of common humanity:** "I'm not the only one who feels this way. This is part of being human."\n3. **Offer yourself kindness:** "May I be kind to myself. May I give myself the compassion I need."\n\nYou can place your hand on your heart as you say these words. This simple gesture activates your body's caregiving system and helps to calm your nervous system.\n\nRecovery is hard enough. You don't need to make it harder by beating yourself up. Try a different approach. Try being your own best friend.\n\n---\n\n*If you're struggling with shame and self-criticism, reach out for support. Resources are available at [/resources](/resources).*`,
              publishedAt: new Date("2025-01-22"),
              authorId,
              status: "published" as const,
              viewCount: 0,
            },
            {
              title: "Why Your Inner Child Might Be Driving Your Addiction",
              slug: "inner-child-driving-addiction",
              excerpt: "Explore the powerful connection between childhood wounds and adult addiction. Learn how healing your 'inner child' is a critical, and often missing, piece of sustainable recovery.",
              category: "Trauma",
              tags: JSON.stringify(["inner child", "trauma", "addiction", "recovery"]),
              content: `# Why Your Inner Child Might Be Driving Your Addiction\n\nDoes this sound familiar? You're an adult. You're responsible. You have a job, a family, a life. But sometimes, you react to situations in ways that feel… childish. A small criticism sends you into a spiral of shame. A minor setback feels like the end of the world. You have an intense, overwhelming need for validation, or you run from intimacy, or you find yourself throwing a tantrum when you don't get your way.\n\nAnd often, these are the moments right before you pick up a drink or a drug.\n\nWhat if I told you that in those moments, it's not actually the adult you who's in the driver's seat? It's a younger version of you—your **inner child**—who never got what they needed and is still desperately trying to get it.\n\n## What Is the Inner Child?\n\nThe concept of the "inner child" comes from psychology and refers to the part of your psyche that holds the memories, emotions, and unmet needs from your childhood. When you experience trauma, neglect, or emotional misattunement as a child, certain developmental needs don't get met. You don't outgrow those needs; they just go underground.\n\nYour inner child is still in there, still hurting, still trying to get those needs met in whatever way possible—often through destructive adult behaviors like addiction.\n\n## How Childhood Wounds Fuel Adult Addiction\n\nHere's how it works:\n\n- **Unmet Need for Safety:** If you grew up in chaos or with unpredictable caregivers, your inner child never learned to feel safe. As an adult, you might use substances to create a false sense of safety or control.\n\n- **Unmet Need for Love and Belonging:** If you were neglected, criticized, or made to feel like you weren't enough, your inner child is still desperately seeking validation. You might use substances to numb the pain of feeling unlovable.\n\n- **Unmet Need for Autonomy:** If you were controlled, smothered, or not allowed to express yourself, your inner child is still fighting for freedom. Addiction can become a form of rebellion or escape.\n\nWhen your inner child gets triggered, you don't respond from your wise, adult self. You respond from that wounded place. And that's when you're most vulnerable to relapse.\n\n## Healing Your Inner Child\n\nThe good news is that you can re-parent yourself. You can give your inner child what they didn't get back then. This is called **inner child work**, and it's a powerful tool in trauma-informed recovery.\n\nHere's how to start:\n\n1. **Acknowledge your inner child:** Recognize that there's a younger version of you inside who is still hurting.\n\n2. **Listen to their needs:** When you're feeling triggered or dysregulated, pause and ask: "What does my inner child need right now?" Maybe they need reassurance, comfort, or permission to feel their feelings.\n\n3. **Offer compassion:** Speak to your inner child the way you would speak to a scared or hurt child. "I see you. I hear you. You're safe now. I've got you."\n\n4. **Meet their needs:** Do something nurturing for yourself. Take a bath, go for a walk, call a friend, or simply sit with your feelings without judgment.\n\nHealing your inner child doesn't happen overnight. But with practice, you can learn to respond to your triggers with compassion instead of compulsion.\n\nYour addiction isn't just about the substance. It's about the pain underneath. And that pain often has roots in childhood. By healing your inner child, you heal the root cause of your addiction.\n\n---\n\n*If you're ready to explore inner child work, consider working with a trauma-informed therapist or joining one of our courses at [/products](/products).*`,
              publishedAt: new Date("2025-01-24"),
              authorId,
              status: "published" as const,
              viewCount: 0,
            },
            {
              title: "Why You Can't Think Your Way Out of Trauma (And What to Do Instead)",
              slug: "cant-think-way-out-trauma",
              excerpt: "If talk therapy hasn't been enough to heal your trauma and addiction, there's a reason. Learn why trauma lives in the body and how somatic (body-based) practices are essential for release and recovery.",
              category: "Trauma",
              tags: JSON.stringify(["somatic therapy", "trauma", "body", "recovery"]),
              content: `# Why You Can't Think Your Way Out of Trauma (And What to Do Instead)\n\nFor years, the primary approach to mental health and addiction has been "top-down." We engage in talk therapy to understand our past, challenge our negative beliefs, and change our thought patterns. This work is incredibly valuable. But for many who have experienced trauma, it's not enough.\n\nYou can understand your trauma perfectly. You can know, intellectually, that the past is over and you are safe now. But you still feel it in your body. The chronic anxiety. The muscle tension. The digestive issues. The insomnia. The overwhelming urge to use.\n\nWhy? Because **trauma lives in the body, not just the mind.**\n\n## The Body Keeps the Score\n\nDr. Bessel van der Kolk, one of the world's leading trauma researchers, wrote a groundbreaking book called *The Body Keeps the Score*. His research shows that trauma is not just a psychological event; it's a physiological one. When you experience trauma, your body's stress response system gets activated. If that activation doesn't get fully discharged, it gets stored in your body.\n\nYour body literally holds the memory of the trauma. And no amount of talking about it will release it. You have to work with the body directly.\n\n## What Are Somatic (Body-Based) Practices?\n\nSomatic practices are therapeutic approaches that work directly with the body to release stored trauma and regulate the nervous system. They include:\n\n- **Somatic Experiencing (SE):** A gentle, body-oriented approach developed by Dr. Peter Levine that helps you complete the body's natural stress response cycle.\n\n- **EMDR (Eye Movement Desensitization and Reprocessing):** A therapy that uses bilateral stimulation (like eye movements) to help the brain reprocess traumatic memories.\n\n- **Yoga and Movement:** Trauma-informed yoga and mindful movement help you reconnect with your body and release stored tension.\n\n- **Breathwork:** Specific breathing techniques can directly regulate your nervous system and release trapped emotions.\n\n- **Body Scanning and Mindfulness:** Learning to tune into your body's sensations without judgment helps you build awareness and tolerance for difficult feelings.\n\n## Why This Matters for Addiction Recovery\n\nIf you're trying to stay sober but you're still carrying unprocessed trauma in your body, you're going to struggle. Your body will keep sending you signals that something is wrong. You'll feel anxious, restless, or numb. And your brain will say, "I know how to fix this: use."\n\nSomatic practices help you discharge that stored trauma so your body can finally relax. When your body feels safe, you don't need substances to feel safe.\n\n## How to Start\n\nIf you've been doing talk therapy and it's not enough, consider adding a somatic component to your recovery. Find a therapist trained in Somatic Experiencing, EMDR, or trauma-informed yoga. Start a daily breathwork or body scan practice.\n\nYou don't have to do this alone. And you don't have to stay stuck in your head.\n\nYour body has been holding onto this pain for a long time. It's time to let it go.\n\n---\n\n*Looking for somatic practices to support your recovery? Check out our [REWIRED Method courses](/products) or explore free resources at [/resources](/resources).*`,
              publishedAt: new Date("2025-01-26"),
              authorId,
              status: "published" as const,
              viewCount: 0,
            },
            {
              title: "Beyond Sobriety: Introducing the REWIRED Method for Lasting Recovery",
              slug: "beyond-sobriety-rewired-method",
              excerpt: "Sobriety is just the beginning. Discover the REWIRED method, a comprehensive, trauma-informed framework for healing the root causes of addiction and building a life you don't need to escape from.",
              category: "REWIRED Method",
              tags: JSON.stringify(["REWIRED", "recovery", "sobriety", "trauma-informed"]),
              content: `# Beyond Sobriety: Introducing the REWIRED Method for Lasting Recovery\n\nWhat if getting sober isn't the goal?\n\nThat might sound like a strange thing to say on a website about addiction recovery. But stay with me.\n\nFor most people, the focus is entirely on abstinence. On not drinking. On not using. On counting days. And while sobriety is a necessary and life-saving first step, it is not the destination. It is the ticket to the dance. It is not the dance itself.\n\nWhat is the dance? It's recovery. It's healing. It's building a life that is so connected, so meaningful, and so aligned with your values that you don't need to escape from it.\n\nThat's what the **REWIRED Method** is all about.\n\n## What Is the REWIRED Method?\n\nThe REWIRED Method is a comprehensive, trauma-informed framework for lasting recovery. It's not just about stopping a behavior; it's about healing the root causes of addiction and building a new way of being in the world.\n\nREWIRED stands for:\n\n- **R**ecognize: Recognize nervous system dysregulation before you act.\n- **E**stablish: Establish safety and grounding in your body.\n- **W**ork: Work with the body through breathwork and somatic practices.\n- **I**ntegrate: Integrate the past by processing trauma with compassion.\n- **R**ebuild: Rebuild connection with yourself, others, and something greater.\n- **E**mbrace: Embrace imperfection and practice self-compassion.\n- **D**evelop: Develop a new narrative based on resilience, not shame.\n\n## Why REWIRED Works\n\nMost recovery programs focus on behavior change. They tell you what not to do. But they don't teach you how to heal the underlying nervous system dysregulation that's driving the behavior.\n\nThe REWIRED Method is different. It's a bottom-up approach that works directly with your nervous system, your body, and your trauma. It's based on the latest neuroscience and trauma research. And it's designed to help you not just survive, but thrive.\n\n## Who Is REWIRED For?\n\nThe REWIRED Method is for anyone who:\n\n- Has tried traditional recovery programs and found them lacking\n- Knows there's more to recovery than just "not using"\n- Wants to heal the root causes of their addiction, not just manage symptoms\n- Is ready to do the deep work of trauma healing and nervous system regulation\n- Wants to build a life worth staying sober for\n\n## How to Get Started\n\nYou can start your REWIRED journey today. Explore our [free resources](/resources), dive into the [REWIRED Method page](/rewired-method), or enroll in one of our [comprehensive courses](/products).\n\nRecovery is possible. Healing is possible. A life you don't need to escape from is possible.\n\nWelcome to REWIRED.\n\n---\n\n*Ready to go deeper? Check out our [7-Day REWIRED Reset](/products) or [book a discovery call](/contact) to learn how we can support your journey.*`,
              publishedAt: new Date("2025-01-28"),
              authorId,
              status: "published" as const,
              viewCount: 0,
            },
          ];

          let postsCreated = 0;
          for (const post of newPosts) {
            // Check if post already exists
            const existing = await db.select().from(blogPosts).where(eq(blogPosts.slug, post.slug)).limit(1);
            if (existing.length === 0) {
              await db.insert(blogPosts).values(post);
              postsCreated++;
            }
          }

          return {
            success: true,
            message: `Successfully seeded ${postsCreated} new blog posts!`,
            postsCreated,
          };
        } catch (error: any) {
          console.error("Blog seeding error:", error);
          throw new Error(`Failed to seed blog posts: ${error.message}`);
        }
      }),

    updateProductPDFs: publicProcedure
      .input(z.object({
        secret: z.string().optional(),
      }).optional())
      .mutation(async ({ input }) => {
        // Simple protection - optional secret key
        if (input?.secret && input.secret !== process.env.ADMIN_SECRET && input.secret !== "update-pdfs-2025") {
          throw new Error("Unauthorized: Invalid secret key");
        }

        try {
          const { drizzle } = await import("drizzle-orm/mysql2");
          const { leadMagnets } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");

          const db = drizzle(process.env.DATABASE_URL!);

          // Update Recovery Toolkit (UTF-8 encoded 10-page version)
          await db.update(leadMagnets)
            .set({
              fileUrl: "/recovery-toolkit.pdf",
              updatedAt: new Date()
            })
            .where(eq(leadMagnets.slug, "recovery-toolkit"));

          // Update REWIRED 7-Day Reset (new version)
          await db.update(leadMagnets)
            .set({
              fileUrl: "/rewired-7-day-reset.pdf",
              updatedAt: new Date()
            })
            .where(eq(leadMagnets.slug, "7-day-reset"));

          // Update From Broken to Whole (Parts 1 & 2)
          await db.update(leadMagnets)
            .set({
              fileUrl: "/from-broken-to-whole.pdf",
              updatedAt: new Date()
            })
            .where(eq(leadMagnets.slug, "from-broken-to-whole"));

          // Update Thriving Sober (renamed from Living Sober)
          await db.update(leadMagnets)
            .set({
              title: "Thriving Sober: 50+ Practical Tips",
              fileUrl: "/thriving-sober.pdf",
              updatedAt: new Date()
            })
            .where(eq(leadMagnets.slug, "living-sober"));

          // Add REWIRED Relief Toolkit (freebie for refund policy)
          const existingRelief = await db.select().from(leadMagnets).where(eq(leadMagnets.slug, "rewired-relief-toolkit")).limit(1);
          if (existingRelief.length === 0) {
            await db.insert(leadMagnets).values({
              title: "REWIRED Relief Toolkit",
              slug: "rewired-relief-toolkit",
              description: "A crisis-focused guide to regulating your nervous system when you need it most.",
              fileUrl: "/rewired-relief-toolkit.pdf",
              isActive: 1,
            });
          }

          return {
            success: true,
            message: "All product PDFs updated successfully!",
            updatedCount: 5
          };
        } catch (error: any) {
          console.error("PDF update error:", error);
          throw new Error(`Failed to update PDFs: ${error.message}`);
        }
      }),

    migrateAiCoachTable: publicProcedure
      .input(z.object({
        secret: z.string().optional(),
      }).optional())
      .mutation(async ({ input }) => {
        // Simple protection - optional secret key
        if (input?.secret && input.secret !== process.env.ADMIN_SECRET && input.secret !== "migrate-ai-coach-2025") {
          throw new Error("Unauthorized: Invalid secret key");
        }

        try {
          const { drizzle } = await import("drizzle-orm/mysql2");
          const { sql } = await import("drizzle-orm");

          const db = drizzle(process.env.DATABASE_URL!);

          // Create ai_coach_users table
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS ai_coach_users (
              id INT AUTO_INCREMENT PRIMARY KEY,
              email VARCHAR(320) NOT NULL UNIQUE,
              message_count INT NOT NULL DEFAULT 0,
              has_unlimited_access INT NOT NULL DEFAULT 0 COMMENT '0 = false, 1 = true',
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
          `);

          return {
            success: true,
            message: "AI Coach users table created successfully! You can now use the AI Coach with email tracking.",
          };
        } catch (error: any) {
          console.error("AI Coach migration error:", error);
          return {
            success: false,
            message: `Migration error: ${error.message}. Table might already exist.`,
          };
        }
      }),

    fixResourcesOrder: publicProcedure
      .input(z.object({
        secret: z.string().optional(),
      }).optional())
      .mutation(async ({ input }) => {
        // Simple protection - optional secret key
        if (input?.secret && input.secret !== process.env.ADMIN_SECRET && input.secret !== "fix-resources-2025") {
          throw new Error("Unauthorized: Invalid secret key");
        }

        try {
          const { drizzle } = await import("drizzle-orm/mysql2");
          const { leadMagnets } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");

          const db = drizzle(process.env.DATABASE_URL!);

          // Deactivate REWIRED Relief Toolkit
          await db.update(leadMagnets)
            .set({
              status: "inactive",
              updatedAt: new Date()
            })
            .where(eq(leadMagnets.slug, "rewired-relief-toolkit"));

          // Activate reading guide
          await db.update(leadMagnets)
            .set({
              status: "active",
              updatedAt: new Date()
            })
            .where(eq(leadMagnets.slug, "reading-guide"));

          // Activate first 3 chapters
          await db.update(leadMagnets)
            .set({
              status: "active",
              updatedAt: new Date()
            })
            .where(eq(leadMagnets.slug, "first-3-chapters"));

          // Activate recovery toolkit
          await db.update(leadMagnets)
            .set({
              status: "active",
              updatedAt: new Date()
            })
            .where(eq(leadMagnets.slug, "recovery-toolkit"));

          return {
            success: true,
            message: "Resources fixed! Order: First 3 Chapters, Recovery Toolkit, Reading Guide",
          };
        } catch (error: any) {
          console.error("Fix resources order error:", error);
          throw new Error(`Failed to fix resources: ${error.message}`);
        }
      }),
  }),

  // AI Coach counter system
  aiCoach: router({
    // Register email after 3 anonymous messages
    registerEmail: publicProcedure
      .input(z.object({
        email: z.string().email(),
        initialMessageCount: z.number().default(3),
      }))
      .mutation(async ({ input }) => {
        const user = await getOrCreateAiCoachUser(input.email, input.initialMessageCount);

        if (!user) {
          throw new Error("Failed to create AI Coach user");
        }

        // Subscribe to ConvertKit for email list building
        try {
          await subscribeToForm({
            email: input.email,
            formUid: CONVERTKIT_FORMS.HOMEPAGE_NEWSLETTER,
            tags: [CONVERTKIT_TAGS.AI_COACH_USER, CONVERTKIT_TAGS.ACTIVE_SUBSCRIBER],
          });
        } catch (error) {
          console.error("ConvertKit subscription failed:", error);
          // Don't fail the registration if ConvertKit fails
        }

        return {
          success: true,
          user: {
            email: user.email,
            messageCount: user.messageCount,
            hasUnlimitedAccess: user.hasUnlimitedAccess === 1,
          },
        };
      }),

    // Get message count and access level for a user
    getMessageCount: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        const user = await getAiCoachUserByEmail(input.email);

        if (!user) {
          return {
            messageCount: 0,
            hasUnlimitedAccess: false,
          };
        }

        return {
          messageCount: user.messageCount,
          hasUnlimitedAccess: user.hasUnlimitedAccess === 1,
        };
      }),

    // Increment message count (called before sending each message)
    incrementMessageCount: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const user = await incrementAiCoachMessageCount(input.email);

        if (!user) {
          throw new Error("User not found or failed to increment count");
        }

        return {
          success: true,
          messageCount: user.messageCount,
          hasUnlimitedAccess: user.hasUnlimitedAccess === 1,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
