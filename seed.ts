import { drizzle } from "drizzle-orm/mysql2";
import { blogPosts, users, leadMagnets } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import mysql2 from "mysql2/promise";

/**
 * Comprehensive Database Seeding Script
 *
 * Seeds:
 * 1. Blog posts (5 posts)
 * 2. Lead magnets (3 free PDFs)
 *
 * Note: Paid products are managed through Stripe directly.
 * Product information is stored in Stripe and fetched via the Stripe API.
 *
 * Usage:
 *   pnpm seed
 */

async function seed() {
  console.log("🌱 Starting database seeding...\n");

  // Create database connection
  const connection = await mysql2.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  try {
    // ============================================
    // 1. Verify Admin User Exists
    // ============================================
    console.log("📋 Checking for admin user...");
    const adminUsers = await db.select().from(users).where(eq(users.role, "admin")).limit(1);

    if (adminUsers.length === 0) {
      console.error("❌ No admin user found!");
      console.log("\nℹ️  Please log in to the website first to create your admin account.");
      console.log("   Then run this seed script again.");
      process.exit(1);
    }

    const authorId = adminUsers[0]!.id;
    console.log(`✓ Admin user found: ${adminUsers[0]!.email || adminUsers[0]!.name}\n`);

    // ============================================
    // 2. Seed Blog Posts
    // ============================================
    console.log("📝 Seeding blog posts...");

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

Real recovery started when I finally addressed my childhood sexual abuse through EMDR therapy. When I stopped performing and started being honest about who I was and what I'd done. When I built a support system that knew the real me, not the version I'd been performing for decades.

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
      },
      {
        title: "Why I Finally Talked About My Childhood Sexual Abuse",
        slug: "breaking-silence-childhood-abuse",
        excerpt: "I buried my abuse for 25 years. Here's why I finally spoke up, and what happened when I did.",
        category: "Trauma",
        tags: JSON.stringify(["trauma", "healing", "childhood abuse"]),
        content: `# Why I Finally Talked About My Childhood Sexual Abuse

I was sexually abused as a child. I didn't talk about it for 25 years.

When I finally did, it changed everything.

## The Weight of Silence

From age 6 to 8, I was abused by someone I trusted. I never told anyone. Not my parents, not my friends, not my wife. I buried it so deep I almost convinced myself it didn't happen.

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

"I was sexually abused as a child."

And the world didn't end. In fact, it was the beginning of my healing.

## What Happened When I Spoke

**Relief.** The weight I'd been carrying for 25 years started to lift.

**Connection.** Other people shared their stories. I wasn't alone.

**Healing.** Through EMDR therapy, I was able to process the trauma instead of just carrying it.

**Freedom.** The shame lost its power when I brought it into the light.

## To Anyone Still Carrying This

If you were abused as a child and you've never told anyone: **it wasn't your fault.**

You don't have to carry this alone. Speaking your truth doesn't make you weak—it makes you brave.

Healing is possible. But it starts with breaking the silence.

---

*If you've experienced childhood sexual abuse, help is available:*
- *RAINN National Sexual Assault Hotline: 1-800-656-HOPE (4673)*
- *Crisis Text Line: Text HOME to 741741*`,
        publishedAt: new Date("2025-01-10"),
      },
      {
        title: "The Armor We Build Becomes Our Prison",
        slug: "armor-becomes-prison",
        excerpt: "I built layers of armor to protect myself from pain. Eventually, that same armor trapped me inside, unable to connect with anyone—including myself.",
        category: "Personal Growth",
        tags: JSON.stringify(["vulnerability", "authenticity", "healing"]),
        content: `# The Armor We Build Becomes Our Prison

I started building armor when I was six years old.

Bodybuilding. Achievement. Performance. Success. Each layer was designed to protect me from ever feeling powerless again.

By the time I was 30, the armor was so thick that no one could hurt me.

It was also so thick that no one could reach me. Including myself.

## Why We Build Armor

Trauma teaches us that the world isn't safe. So we build protection:

- **Physical armor:** Muscles, weight, physical intimidation
- **Achievement armor:** Success, accolades, external validation
- **Performance armor:** Being whoever people need us to be
- **Emotional armor:** Shutting down, numbing out, staying surface-level

The armor works. For a while. It keeps people at a distance. It prevents vulnerability. It protects us from getting hurt again.

But it also prevents us from truly living.

## The Cost of Armor

You can't selectively numb emotions. When you shut down pain, you also shut down joy. When you protect yourself from hurt, you also protect yourself from love.

My armor kept me "safe," but it also kept me:
- Unable to be truly intimate with my wife
- Emotionally unavailable to my children
- Disconnected from my own feelings
- Performing instead of being authentic
- Lonely even when surrounded by people

The very thing that was supposed to protect me became my prison.

## Taking Off the Armor

Recovery meant learning to be vulnerable. To let people see the real me—the scared, broken, imperfect me.

It meant:
- Admitting I didn't have it all together
- Asking for help instead of pretending I was fine
- Sharing my story instead of hiding it
- Letting people love me without performing for them
- Feeling my feelings instead of numbing them

It was terrifying. But it was also the only way to truly heal.

## The Paradox of Vulnerability

The armor I built to protect myself from pain was actually causing more pain. The vulnerability I feared was actually the path to freedom.

When I finally took off the armor, I discovered something surprising: **real strength isn't about being invulnerable. It's about being brave enough to be seen.**

## What's Your Armor?

We all build protection. The question is: **Is your armor still serving you, or has it become your prison?**

What would it look like to take it off? Who might you become if you stopped performing and started being real?

The armor kept you safe when you needed it. But you don't need it anymore.

It's time to let people in. Starting with yourself.

---

*Recovery requires vulnerability. If you're ready to start that journey, check out our [free resources](/resources).*`,
        publishedAt: new Date("2025-01-05"),
      },
      {
        title: "What EMDR Therapy Did for My Trauma (And Why Talk Therapy Wasn't Enough)",
        slug: "emdr-therapy-trauma-healing",
        excerpt: "I spent years in talk therapy, talking about my trauma. EMDR helped me actually process it. Here's the difference.",
        category: "Mental Health",
        tags: JSON.stringify(["therapy", "EMDR", "trauma", "healing"]),
        content: `# What EMDR Therapy Did for My Trauma (And Why Talk Therapy Wasn't Enough)

For years, I talked about my trauma in therapy. I could tell you exactly what happened, analyze why it affected me, and intellectually understand the impact.

But I still carried it. Every day. Like a weight I couldn't put down.

Then I tried EMDR (Eye Movement Desensitization and Reprocessing). And for the first time in my life, I didn't just talk about my trauma—I actually processed it.

## The Limitation of Talk Therapy

Don't get me wrong—talk therapy helped. It gave me language for my experiences. It helped me understand patterns. It provided support.

But understanding trauma intellectually isn't the same as healing from it.

I could explain my childhood sexual abuse, my protective mechanisms, my addiction patterns. But when triggered, my body still reacted like that scared six-year-old kid. The trauma was stored in my nervous system, not just my mind.

Talk therapy accessed my prefrontal cortex—the thinking brain. But trauma lives in the amygdala—the emotional, survival brain.

## How EMDR Is Different

EMDR uses bilateral stimulation (eye movements, tapping, or sounds) while you recall traumatic memories. It sounds weird. It feels weird. But it works.

The bilateral stimulation appears to help your brain reprocess traumatic memories, moving them from your emotional brain to your rational brain. The memories don't disappear, but they lose their emotional charge.

## What My EMDR Sessions Looked Like

My therapist had me recall the abuse while following her finger with my eyes, moving back and forth. We'd pause periodically for me to notice what was coming up—images, emotions, body sensations.

It was intense. I cried. I shook. I felt physical sensations I'd buried for decades.

But after several sessions, something shifted. I could think about the abuse without my body going into fight-or-flight mode. The memory was still there, but it no longer controlled me.

## The Results

After EMDR:
- Triggers that used to send me spiraling barely registered
- I could talk about my abuse without dissociating
- The shame that had defined me for decades started to lift
- I could be present with my kids instead of emotionally checked out
- My addiction cravings decreased significantly

EMDR didn't erase my trauma. But it helped me integrate it. The memories became part of my story instead of the whole story.

## Is EMDR Right for You?

EMDR isn't for everyone, and it's not a magic bullet. You need:
- A trained EMDR therapist (not all therapists are certified)
- Enough stability to handle intense emotional processing
- Willingness to feel uncomfortable during sessions
- Patience—it takes time

But if you've done talk therapy and still feel stuck, if your body reacts to triggers even when your mind knows you're safe, EMDR might be worth exploring.

## The Bottom Line

Talk therapy helped me understand my trauma. EMDR helped me heal from it.

Both were necessary. But EMDR gave me something talk therapy couldn't: freedom from the emotional grip of my past.

If you're carrying trauma that won't let go, consider finding an EMDR-trained therapist. Your body might be holding what your mind can't process alone.

---

*To find an EMDR therapist near you, visit the EMDR International Association at emdria.org.*`,
        publishedAt: new Date("2025-01-01"),
      },
      {
        title: "How I Co-Parent Peacefully with My Ex-Wife After Everything We Put Each Other Through",
        slug: "peaceful-coparenting-after-addiction",
        excerpt: "Protective orders. Custody battles. Years of pain. Today, my ex-wife and I co-parent peacefully. Here's how we got here.",
        category: "Relationships",
        tags: JSON.stringify(["coparenting", "forgiveness", "recovery", "relationships"]),
        content: `# How I Co-Parent Peacefully with My Ex-Wife After Everything We Put Each Other Through

My ex-wife Jennie and I have been through hell together.

Addiction. Affairs. Protective orders. Custody battles. Years of mutual destruction.

Today, we co-parent peacefully. We communicate respectfully. We support each other's relationships with our kids.

People ask how that's possible. Here's the truth.

## The Damage We Did

Let me be clear: I was the primary problem in our marriage. My addiction, my lies, my affair, my emotional unavailability—I destroyed our family.

But we also hurt each other in the process. The fights, the manipulation, the using our kids as weapons. We both contributed to the toxicity.

By the time we divorced, we couldn't be in the same room without it escalating. The protective orders weren't just legal documents—they were necessary for everyone's safety.

## What Had to Change

**I had to get sober.** Not just dry, but actually in recovery. Addressing my trauma, taking responsibility, becoming emotionally available.

**I had to make amends.** Not with words, but with changed behavior over years. Showing up. Being consistent. Proving I was different.

**We both had to let go.** Of resentment, of the need to be right, of using the past as ammunition. We had to choose our kids' wellbeing over our own hurt.

**We had to communicate differently.** No more fighting through lawyers. Direct, respectful communication focused solely on the kids.

## The Turning Point

There wasn't one dramatic moment. It was gradual. Small steps over years:

- Me showing up consistently for visitation
- Jennie giving me chances when she had every reason not to
- Both of us putting the kids first, even when it hurt
- Therapy (individual and eventually co-parenting counseling)
- Time—enough time for my actions to prove my words

Eventually, the tension eased. The defensiveness dropped. We started actually listening to each other.

## What Peaceful Co-Parenting Looks Like Now

- We text regularly about the kids without it turning into a fight
- We attend school events together
- We support each other's parenting decisions
- We've met each other's new partners and built respectful relationships
- Our kids see us working together, not against each other

It's not perfect. There are still moments of tension. But we've built enough trust that we can navigate them.

## The Key Principles

**1. Put the kids first.** Always. Even when you don't want to. Even when it's hard.

**2. Let go of being right.** You can be right or you can have peace. Choose peace.

**3. Communicate about the kids only.** Your ex doesn't need to hear about your life. Keep it focused.

**4. Give grace.** You both screwed up. Forgiveness is a choice you make every day.

**5. Take responsibility.** Own your part. Don't wait for them to own theirs.

**6. Be consistent.** Show up. Keep your word. Prove you've changed through actions, not words.

## Is It Possible for You?

I don't know your situation. Some relationships are too toxic, too dangerous. Not every ex deserves your grace.

But if there's any possibility of peaceful co-parenting, it's worth pursuing. Not for your ex. For your kids.

They deserve to see their parents working together. They deserve to not be caught in the middle. They deserve better than we gave them during the worst years.

Peaceful co-parenting after addiction and trauma is possible. But it requires both people to choose healing over hurt, peace over being right, and the kids over everything else.

It's hard. But it's worth it.

---

*For co-parenting resources and support, visit [/resources](/resources).*`,
        publishedAt: new Date("2024-12-28"),
      },
    ];

    // Check if posts already exist
    const existingPosts = await db.select().from(blogPosts).limit(1);
    if (existingPosts.length > 0) {
      console.log("⚠️  Blog posts already exist. Skipping...\n");
    } else {
      for (const post of posts) {
        await db.insert(blogPosts).values({
          ...post,
          authorId,
          status: "published",
          viewCount: 0,
        });
        console.log(`  ✓ ${post.title}`);
      }
      console.log(`✓ Seeded ${posts.length} blog posts\n`);
    }

    // ============================================
    // 3. Seed Lead Magnets
    // ============================================
    console.log("📚 Seeding lead magnets...");

    const magnets = [
      {
        title: "First 3 Chapters - Free Excerpt",
        slug: "first-3-chapters",
        description: "Read the prologue and first two chapters of Crooked Lines: Bent, Not Broken. Experience the raw, unflinching honesty that makes this memoir a life-changing read.",
        fileUrl: "/first_3_chapters.pdf",
        fileKey: "lead-magnets/first-3-chapters.pdf",
        type: "pdf" as const,
      },
      {
        title: "Recovery Toolkit - Practical Worksheets",
        slug: "recovery-toolkit",
        description: "A collection of tools, exercises, and resources to support your recovery journey. Includes daily check-ins, trigger worksheets, gratitude templates, and more.",
        fileUrl: "/recovery_toolkit.pdf",
        fileKey: "lead-magnets/recovery-toolkit.pdf",
        type: "pdf" as const,
      },
      {
        title: "Crooked Lines Reading Guide",
        slug: "reading-guide",
        description: "Discussion questions and reflection prompts for individual use or group study. Go deeper with the themes of trauma, addiction, and redemption.",
        fileUrl: "/reading_guide.pdf",
        fileKey: "lead-magnets/reading-guide.pdf",
        type: "pdf" as const,
      },
    ];

    // Check if lead magnets already exist
    const existingMagnets = await db.select().from(leadMagnets).limit(1);
    if (existingMagnets.length > 0) {
      console.log("⚠️  Lead magnets already exist. Skipping...\n");
    } else {
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
        console.log(`  ✓ ${magnet.title}`);
      }
      console.log(`✓ Seeded ${magnets.length} lead magnets\n`);
    }

    // ============================================
    // Summary
    // ============================================
    console.log("\n✅ Database seeding complete!\n");
    console.log("📊 Summary:");
    console.log(`   • ${posts.length} blog posts`);
    console.log(`   • ${magnets.length} lead magnets`);
    console.log("\n💡 Note: Paid products are managed through Stripe.");
    console.log("   Product data is fetched from Stripe API using Price IDs.\n");

  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
