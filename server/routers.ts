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

I became a master at compartmentalization. I locked that part of my childhood in a mental box, threw away the key, and built my entire identity around performance and achievement. Mr. Teen USA. Successful entrepreneur. Perfect husband and father (at least on the surface).

But no matter how much I achieved, I couldn't outrun what happened. The shame showed up in my addiction. The fear showed up in my inability to be truly vulnerable with anyone. The rage showed up in explosive outbursts I couldn't control.

Unprocessed trauma doesn't fade with time. It compounds. And every year I stayed silent, the weight got heavier.

## Why I Stayed Silent

**Shame.** I thought it was my fault somehow. That I had done something to deserve it or invite it. That speaking about it would confirm what I secretly believed: that I was damaged goods.

**Fear.** I was afraid no one would believe me. That they'd minimize it or dismiss it. That speaking my truth would somehow make me less of a man.

**Protection.** I didn't want to hurt my family by bringing it up. What good would it do to dredge up the past? Better to just... move on. (Spoiler: I wasn't moving on. I was drowning.)

**Denial.** If I didn't talk about it, maybe it wasn't real. Maybe I could convince myself it wasn't that bad. Maybe I could pretend it never happened.

These are the lies trauma tells you. And I believed every single one.

The silence wasn't protecting anyone. It was poisoning me from the inside out.

## What Finally Broke the Silence

Rock bottom. Multiple psych ward stays. Losing access to my kids. Wanting to die.

When I finally got to The Ranch treatment center in 2012, I had nothing left to lose. In a psychodrama session, surrounded by other broken people who understood, I finally said it out loud:

"I experienced childhood trauma."

My voice shook. Tears streamed down my face. I felt like I might throw up.

And the world didn't end. In fact, it was the beginning of my healing.

The other men in the room didn't judge me. They didn't look at me with pity or disgust. Many of them shared their own stories. And for the first time in my life, I realized: **I wasn't alone.**

## What Happened When I Spoke

**Relief.** The weight I'd been carrying for 25 years started to lift. It wasn't gone overnight, but for the first time, I could breathe.

**Connection.** Other people shared their stories. I learned that childhood trauma isn't rare—it's heartbreakingly common. And that community of shared pain became the foundation of my healing.

**Healing.** Through EMDR therapy, I was able to process the trauma instead of just carrying it. EMDR helped my brain reprocess the memories so they no longer triggered the same dysregulated nervous system response.

**Freedom.** The shame lost its power when I brought it into the light. What I'd been hiding in darkness—convinced it would destroy me if anyone knew—became the very thing that connected me to others and set me free.

Speaking my truth didn't break me. Silence was what was breaking me.

## To Anyone Still Carrying This

If you experienced childhood trauma and you've never told anyone: **it wasn't your fault.**

Read that again. It. Wasn't. Your. Fault.

You don't have to carry this alone. Speaking your truth doesn't make you weak—it makes you brave.

You don't have to tell everyone. But tell someone. A therapist, a trusted friend, a support group. Break the silence with someone who can hold space for your story without judgment.

Healing is possible. But it starts with breaking the silence.

The shame you're carrying? It belongs to the person who hurt you, not to you. You were a child. You deserved safety, love, and protection. What happened wasn't your fault, and healing is your birthright.

I know it feels terrifying. I know you've carried this alone for so long that speaking it out loud feels impossible. But I promise you: the relief on the other side of honesty is worth the terror of speaking.

You're not broken. You're not damaged. You're wounded, and wounds can heal.

But they can't heal in the dark.

---

*If you've experienced childhood trauma, help is available:*
- *RAINN National Sexual Assault Hotline: 1-800-656-HOPE (4673)*
- *Crisis Text Line: Text HOME to 741741*
- *SAMHSA National Helpline: 1-800-662-4357*`,
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

Understanding this changes everything.

## The Nervous System Explanation

Your nervous system has one job: keep you alive.

When you experience trauma—especially childhood trauma—your nervous system gets stuck in survival mode. It's constantly scanning for threats, flooding your body with stress hormones (cortisol and adrenaline), and activating the fight-flight-freeze response.

This is called nervous system dysregulation.

And when you're stuck in that state? Your brain desperately seeks relief. It craves anything that will calm the storm inside.

That's where compulsive behaviors come in.

Here's what most people don't understand: **your compulsive behaviors aren't the problem. They're your nervous system's attempt at a solution.**

Your nervous system is trying to regulate itself the only way it knows how—through behaviors that provide temporary relief from the chronic dysregulation caused by unprocessed trauma.

## My Story: From Achievement to Addiction

I experienced childhood trauma between ages 6-8. My nervous system got stuck in hypervigilance—constantly scanning for danger, never feeling safe, always preparing for the next threat.

As a teenager, I discovered bodybuilding. The intense workouts, the strict diet, the control over my body—it all gave me temporary relief from the internal chaos. It was a compulsive behavior, but it was socially acceptable. I became Mr. Teen USA.

But the relief was temporary. The dysregulation remained.

So I added alcohol. Then prescription drugs. Then affairs. Then work addiction. Each behavior provided a brief escape from the nervous system chaos—until it didn't. Then I needed more.

This wasn't a moral failure. This was a dysregulated nervous system desperately seeking regulation through external behaviors.

## Why Compulsions Work (Temporarily)

Compulsive behaviors provide temporary relief from nervous system dysregulation. They:

- **Release dopamine** (the brain's feel-good chemical) which temporarily overrides the stress response
- **Create a sense of control** in the midst of internal chaos
- **Numb overwhelming emotions** that your nervous system can't process
- **Provide predictable escape** from unpredictable pain
- **Activate the parasympathetic nervous system** (the "rest and digest" state) temporarily

But here's the trap: the relief is temporary. The underlying dysregulation remains. And over time, you need more of the behavior to get the same relief.

That's the addiction cycle. Not moral failure. Nervous system dysregulation seeking temporary regulation.

## The Science Behind It

When your nervous system is dysregulated, your body is flooded with stress hormones. Your heart rate increases. Your breathing becomes shallow. Your muscles tense. You're stuck in sympathetic nervous system activation (the "fight or flight" state).

Compulsive behaviors temporarily shift you into parasympathetic activation (the "rest and digest" state). Your heart rate slows. Tension releases. You get a brief window of relief.

But because you haven't addressed the underlying trauma causing the dysregulation, your nervous system soon returns to the activated state. And the cycle repeats.

## The Solution: Regulate, Don't Resist

Recovery isn't about willpower. It's about regulation.

When you learn to regulate your nervous system through trauma-informed practices:

- **Breathwork** (box breathing, diaphragmatic breathing) activates the vagus nerve and shifts you into parasympathetic mode
- **Somatic exercises** (body scans, progressive muscle relaxation) release stored trauma from your body
- **EMDR therapy** reprocesses traumatic memories so they no longer trigger dysregulation
- **Mindfulness practices** help you notice dysregulation early and respond with regulation tools
- **Safe relationships** provide co-regulation—your nervous systems literally calm each other down

You don't need the compulsive behaviors anymore. The internal chaos calms down. The desperate need for escape fades.

This is why the REWIRED approach works. We don't shame you for the behavior. We help you regulate the nervous system that's driving it.

## What This Means for Your Recovery

If you're stuck in compulsive behaviors, ask yourself: **What is my nervous system trying to tell me?**

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

Here's what nobody tells you about early recovery: **willpower is a finite resource.**

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

**You're not failing. The approach is failing you.**

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

Here's the key insight: **If your nervous system is stuck in sympathetic or dorsal states due to unprocessed trauma, willpower can't override biology.**

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

In other words: **shaming yourself for compulsive behaviors makes the compulsive behaviors worse.**

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

**You're not broken. You're not weak. You're not morally deficient.**

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
  }),
});

export type AppRouter = typeof appRouter;
