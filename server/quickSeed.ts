import { Request, Response } from "express";
import mysql2 from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { users, blogPosts, leadMagnets } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env.js";

const SETUP_PASSWORD = "setup2025";

/**
 * Quick seed endpoint - bypasses UI, just runs SQL directly
 * Visit: /api/quick-seed?password=setup2025
 */
export async function quickSeedHandler(req: Request, res: Response) {
  try {
    const { password } = req.query;

    if (password !== SETUP_PASSWORD) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const connection = await mysql2.createConnection(ENV.databaseUrl);
    const db = drizzle(connection);

    const results = {
      users: 0,
      blogPosts: 0,
      leadMagnets: 0,
      messages: [] as string[],
    };

    // 1. Create admin user
    try {
      const existingAdmin = await db
        .select()
        .from(users)
        .where(eq(users.role, "admin"))
        .limit(1);

      if (existingAdmin.length === 0) {
        await db.insert(users).values({
          openId: "shaun-admin",
          name: "Shaun Critzer",
          email: "shaun@shauncritzer.com",
          loginMethod: "manual",
          role: "admin",
        });
        results.users = 1;
        results.messages.push("✅ Admin user created");
      } else {
        results.messages.push("ℹ️ Admin user already exists");
      }
    } catch (error: any) {
      results.messages.push(`❌ Admin user error: ${error.message}`);
    }

    // Get admin ID for blog posts
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    if (adminUsers.length === 0) {
      await connection.end();
      return res.status(500).json({
        error: "No admin user found. Cannot seed blog posts.",
        results,
      });
    }

    const authorId = adminUsers[0]!.id;

    // 2. Seed blog posts
    try {
      const existingPosts = await db.select().from(blogPosts).limit(1);

      if (existingPosts.length === 0) {
        const posts = [
          {
            title: "The Difference Between Sobriety and Recovery",
            slug: "sobriety-vs-recovery",
            excerpt:
              "I was sober for months at a time, white-knuckling through each day, but I wasn't in recovery. Here's why that distinction almost killed me.",
            category: "Recovery",
            tags: JSON.stringify(["recovery", "sobriety", "mental health"]),
            content: `# The Difference Between Sobriety and Recovery\n\nFor years, I thought sobriety and recovery were the same thing. I was wrong, and that misunderstanding almost cost me everything.\n\n## What Sobriety Looked Like for Me\n\nBetween 2002 and 2012, I had multiple periods of sobriety. Weeks, sometimes months, without a drink or a drug. On paper, I was "clean." But inside? I was dying.\n\nI was white-knuckling through every day, counting hours until I could justify using again. I was still lying, still manipulating, still running from my trauma. The only difference was I wasn't actively drinking.\n\nThat's sobriety without recovery.\n\n## The Critical Difference\n\n**Sobriety** is abstinence from substances. It's necessary, but it's not sufficient.\n\n**Recovery** is healing the underlying wounds that drove you to use in the first place. It's processing trauma, building authentic relationships, and creating a life worth staying sober for.\n\nYou can be sober and miserable. You can be sober and still emotionally unavailable to your kids. You can be sober and still carrying the same shame, rage, and fear that fueled your addiction.\n\nThat's not recovery. That's just... not drinking.\n\n## What Changed for Me\n\nReal recovery started when I finally addressed my childhood sexual abuse through EMDR therapy. When I stopped performing and started being honest about who I was and what I'd done. When I built a support system that knew the real me, not the version I'd been performing for decades.\n\nRecovery meant:\n- Therapy (EMDR, CBT, group work)\n- Rigorous honesty with myself and others\n- Processing trauma instead of burying it\n- Building authentic relationships\n- Making amends through changed behavior\n- Finding purpose beyond myself\n\n## The Question That Matters\n\nIf you're sober but still miserable, ask yourself: **Am I just not drinking, or am I actually healing?**\n\nBecause sobriety without recovery is a ticking time bomb. Eventually, the pain you're not addressing will find a way out—through relapse, through other addictive behaviors, or through the slow death of living a half-life.\n\nRecovery is possible. But it requires more than just putting down the bottle.\n\nIt requires picking up the work.\n\n---\n\n*If you're struggling with addiction or trauma, please reach out for help. Resources are available at [/resources](/resources).*`,
            publishedAt: new Date("2025-01-15"),
          },
          {
            title: "Why I Finally Talked About My Childhood Sexual Abuse",
            slug: "breaking-silence-childhood-abuse",
            excerpt:
              "I buried my abuse for 25 years. Here's why I finally spoke up, and what happened when I did.",
            category: "Trauma",
            tags: JSON.stringify(["trauma", "healing", "childhood abuse"]),
            content: `# Why I Finally Talked About My Childhood Sexual Abuse\n\nI was sexually abused as a child. I didn't talk about it for 25 years.\n\nWhen I finally did, it changed everything.\n\n## The Weight of Silence\n\nFrom age 6 to 8, I was abused by someone I trusted. I never told anyone. Not my parents, not my friends, not my wife. I buried it so deep I almost convinced myself it didn't happen.\n\nBut trauma doesn't disappear just because you don't talk about it. It festers. It leaks out in other ways—rage, addiction, self-destruction, an inability to be truly intimate with anyone.\n\nFor decades, I carried that weight alone. And it was killing me.`,
            publishedAt: new Date("2025-01-10"),
          },
          {
            title: "The Armor We Build Becomes Our Prison",
            slug: "armor-becomes-prison",
            excerpt:
              "I built layers of armor to protect myself from pain. Eventually, that same armor trapped me inside, unable to connect with anyone—including myself.",
            category: "Personal Growth",
            tags: JSON.stringify(["vulnerability", "authenticity", "healing"]),
            content: `# The Armor We Build Becomes Our Prison\n\nI started building armor when I was six years old.\n\nBodybuilding. Achievement. Performance. Success. Each layer was designed to protect me from ever feeling powerless again.\n\nBy the time I was 30, the armor was so thick that no one could hurt me.\n\nIt was also so thick that no one could reach me. Including myself.`,
            publishedAt: new Date("2025-01-05"),
          },
          {
            title:
              "What EMDR Therapy Did for My Trauma (And Why Talk Therapy Wasn't Enough)",
            slug: "emdr-therapy-trauma-healing",
            excerpt:
              "I spent years in talk therapy, talking about my trauma. EMDR helped me actually process it. Here's the difference.",
            category: "Mental Health",
            tags: JSON.stringify(["therapy", "EMDR", "trauma", "healing"]),
            content: `# What EMDR Therapy Did for My Trauma (And Why Talk Therapy Wasn't Enough)\n\nFor years, I talked about my trauma in therapy. I could tell you exactly what happened, analyze why it affected me, and intellectually understand the impact.\n\nBut I still carried it. Every day. Like a weight I couldn't put down.`,
            publishedAt: new Date("2025-01-01"),
          },
          {
            title:
              "How I Co-Parent Peacefully with My Ex-Wife After Everything We Put Each Other Through",
            slug: "peaceful-coparenting-after-addiction",
            excerpt:
              "Protective orders. Custody battles. Years of pain. Today, my ex-wife and I co-parent peacefully. Here's how we got here.",
            category: "Relationships",
            tags: JSON.stringify([
              "coparenting",
              "forgiveness",
              "recovery",
              "relationships",
            ]),
            content: `# How I Co-Parent Peacefully with My Ex-Wife After Everything We Put Each Other Through\n\nMy ex-wife Jennie and I have been through hell together.\n\nAddiction. Affairs. Protective orders. Custody battles. Years of mutual destruction.\n\nToday, we co-parent peacefully. We communicate respectfully. We support each other's relationships with our kids.\n\nPeople ask how that's possible. Here's the truth.`,
            publishedAt: new Date("2024-12-28"),
          },
        ];

        for (const post of posts) {
          await db.insert(blogPosts).values({
            ...post,
            authorId,
            status: "published",
            viewCount: 0,
            downloadCount: 0,
          });
        }

        results.blogPosts = posts.length;
        results.messages.push(`✅ Seeded ${posts.length} blog posts`);
      } else {
        results.messages.push("ℹ️ Blog posts already exist");
      }
    } catch (error: any) {
      results.messages.push(`❌ Blog posts error: ${error.message}`);
    }

    // 3. Seed lead magnets
    try {
      const existingMagnets = await db.select().from(leadMagnets).limit(1);

      if (existingMagnets.length === 0) {
        const magnets = [
          {
            title: "First 3 Chapters - Free Excerpt",
            slug: "first-3-chapters",
            description:
              "Read the prologue and first two chapters of Crooked Lines: Bent, Not Broken. Experience the raw, unflinching honesty that makes this memoir a life-changing read.",
            fileUrl: "/first-3-chapters.pdf",
            fileKey: "lead-magnets/first-3-chapters.pdf",
            type: "pdf" as const,
          },
          {
            title: "Recovery Toolkit - Practical Worksheets",
            slug: "recovery-toolkit",
            description:
              "A collection of tools, exercises, and resources to support your recovery journey. Includes daily check-ins, trigger worksheets, gratitude templates, and more.",
            fileUrl: "/recovery-toolkit.pdf",
            fileKey: "lead-magnets/recovery-toolkit.pdf",
            type: "pdf" as const,
          },
          {
            title: "Crooked Lines Reading Guide",
            slug: "reading-guide",
            description:
              "Discussion questions and reflection prompts for individual use or group study. Go deeper with the themes of trauma, addiction, and redemption.",
            fileUrl: "/reading-guide.pdf",
            fileKey: "lead-magnets/reading-guide.pdf",
            type: "pdf" as const,
          },
        ];

        for (const magnet of magnets) {
          await db.insert(leadMagnets).values({
            title: magnet.title,
            slug: magnet.slug,
            description: magnet.description,
            fileUrl: magnet.fileUrl,
            fileKey: magnet.fileKey,
            type: magnet.type,
            isPaid: 0,
            price: 0,
            downloadCount: 0,
            status: "active",
          });
        }

        results.leadMagnets = magnets.length;
        results.messages.push(`✅ Seeded ${magnets.length} lead magnets`);
      } else {
        results.messages.push("ℹ️ Lead magnets already exist");
      }
    } catch (error: any) {
      results.messages.push(`❌ Lead magnets error: ${error.message}`);
    }

    await connection.end();

    return res.json({
      success: true,
      ...results,
      message: "Database seeding completed!",
    });
  } catch (error: any) {
    console.error("Quick seed error:", error);
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
