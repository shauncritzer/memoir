import { Request, Response } from "express";
import mysql2 from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { users, blogPosts, leadMagnets, products } from "../drizzle/schema.js";
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
      products: 0,
      messages: [] as string[],
    };

    // STEP 0: Run missing migrations directly via SQL
    try {
      // Check if blog_posts has file_url column
      const [columns] = await connection.query(
        "SHOW COLUMNS FROM blog_posts LIKE 'file_url'"
      ) as any;

      if (!columns || columns.length === 0) {
        // Run migration 0002 - add blog download columns
        await connection.query(
          "ALTER TABLE `blog_posts` ADD COLUMN `file_url` varchar(512)"
        );
        await connection.query(
          "ALTER TABLE `blog_posts` ADD COLUMN `file_key` varchar(512)"
        );
        await connection.query(
          "ALTER TABLE `blog_posts` ADD COLUMN `download_count` int NOT NULL DEFAULT 0"
        );
        results.messages.push("✅ Added blog download columns");

        // Create blog_post_downloads table if it doesn't exist
        await connection.query(`
          CREATE TABLE IF NOT EXISTS \`blog_post_downloads\` (
            \`id\` int AUTO_INCREMENT NOT NULL,
            \`blog_post_id\` int NOT NULL,
            \`subscriber_id\` int,
            \`email\` varchar(320) NOT NULL,
            \`downloaded_at\` timestamp NOT NULL DEFAULT (now()),
            \`ip_address\` varchar(45),
            \`user_agent\` text,
            CONSTRAINT \`blog_post_downloads_id\` PRIMARY KEY(\`id\`)
          )
        `);
        results.messages.push("✅ Created blog_post_downloads table");
      } else {
        results.messages.push("ℹ️ Blog download columns already exist");
      }
    } catch (error: any) {
      results.messages.push(`⚠️ Migration check: ${error.message}`);
    }

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
            content: `# Why I Finally Talked About My Childhood Sexual Abuse\n\nI was sexually abused as a child. I didn't talk about it for 25 years.\n\nWhen I finally did, it changed everything.\n\n## The Weight of Silence\n\nFrom age 6 to 8, I was abused by someone I trusted. I never told anyone. Not my parents, not my friends, not my wife. I buried it so deep I almost convinced myself it didn't happen.\n\nBut trauma doesn't disappear just because you don't talk about it. It festers. It leaks out in other ways—rage, addiction, self-destruction, an inability to be truly intimate with anyone.\n\nFor decades, I carried that weight alone. And it was killing me.\n\n## Why I Stayed Silent\n\nShame. That's the simple answer. I was ashamed that it happened, ashamed that I didn't stop it, ashamed that I enjoyed parts of it (because that's what abuse does—it confuses you), ashamed that I wasn't "strong enough" to just get over it.\n\nI also didn't have the language. When you're a kid, you don't understand what's happening. You just know something feels wrong, but you can't articulate it. By the time I was old enough to understand, I'd already built a fortress of silence around it.\n\nAnd frankly, I didn't think anyone would believe me. Or worse, I thought they'd blame me.\n\n## What Changed\n\nBy 2014, my life was falling apart. I was two years sober but still profoundly broken. My marriage was ending, I'd lost custody of my kids, and I was barely holding it together.\n\nMy therapist asked me a question I'll never forget: **"What are you still hiding?"**\n\nI broke. And for the first time in 25 years, I said the words out loud: "I was sexually abused as a child."\n\n## What Happened When I Spoke Up\n\nSpeaking the truth didn't make the pain disappear. But it did make it manageable.\n\nI started EMDR therapy to process the trauma. I joined a support group for survivors. I told my family, my close friends, and eventually, my story publicly.\n\nSome people didn't know what to say. Some people minimized it. But the people who mattered? They showed up. They believed me. They held space for my pain without trying to fix it.\n\nAnd slowly, I started to heal.\n\n## Why I'm Telling You This\n\nIf you're carrying a secret like this, I want you to know:\n\n**It wasn't your fault.**\n\n**You don't have to carry it alone.**\n\n**Healing is possible.**\n\nSpeaking up doesn't mean you have to go public. It just means you stop lying to yourself about what happened. It means you find one safe person—a therapist, a trusted friend, a support group—and you say the words out loud.\n\nBecause silence protects the abuser. Truth protects you.\n\n---\n\n*If you've experienced childhood sexual abuse, resources are available at [RAINN.org](https://www.rainn.org) and [1in6.org](https://1in6.org). You are not alone.*`,
            publishedAt: new Date("2025-01-10"),
          },
          {
            title: "The Armor We Build Becomes Our Prison",
            slug: "armor-becomes-prison",
            excerpt:
              "I built layers of armor to protect myself from pain. Eventually, that same armor trapped me inside, unable to connect with anyone—including myself.",
            category: "Personal Growth",
            tags: JSON.stringify(["vulnerability", "authenticity", "healing"]),
            content: `# The Armor We Build Becomes Our Prison\n\nI started building armor when I was six years old.\n\nBodybuilding. Achievement. Performance. Success. Each layer was designed to protect me from ever feeling powerless again.\n\nBy the time I was 30, the armor was so thick that no one could hurt me.\n\nIt was also so thick that no one could reach me. Including myself.\n\n## The First Layer: Physical Strength\n\nAfter I was abused, I became obsessed with being strong. Not just metaphorically—literally. I started lifting weights in middle school. By high school, I was jacked. By college, I was a bodybuilder.\n\nI thought if I was physically strong enough, no one could ever hurt me again.\n\nBut trauma doesn't care how much you can bench press.\n\n## The Second Layer: Achievement\n\nI became a master achiever. Straight A's. Leadership positions. Awards. Success in business. I built a resume that looked impressive from the outside.\n\nI thought if I achieved enough, I'd finally feel valuable. Worthy. Good enough.\n\nBut achievement is a bottomless pit. No matter how much I accomplished, it was never enough.\n\n## The Third Layer: Performance\n\nI learned to perform. The successful businessman. The devoted husband. The caring father. The recovered addict. Each role carefully crafted, perfectly executed.\n\nI thought if I performed well enough, no one would see the broken, scared kid underneath.\n\nBut performance is exhausting. And eventually, I forgot who I actually was beneath all the masks.\n\n## The Fourth Layer: Control\n\nI controlled everything I could. My diet. My schedule. My emotions. My relationships. I needed to feel like I was in charge of my life, because as a kid, I had no control at all.\n\nBut control is an illusion. Life happens anyway. And when it did, I fell apart.\n\n## When the Armor Becomes the Problem\n\nHere's what I didn't understand: The armor that protected me as a kid became the thing that isolated me as an adult.\n\nMy physical strength intimidated people.\n\nMy achievements created distance.\n\nMy performance prevented real intimacy.\n\nMy need for control pushed people away.\n\nI was safe. But I was also completely alone.\n\n## The Painful Work of Removing It\n\nRecovery required me to take off the armor. Not all at once—that would've been too terrifying. But piece by piece.\n\nI had to learn:\n- Vulnerability isn't weakness\n- Imperfection doesn't mean worthlessness\n- Authenticity is more valuable than performance\n- Connection requires risk\n\nIt was the hardest work I've ever done. Because without the armor, I felt naked. Exposed. Powerless.\n\nBut here's what I found underneath:\n\n**I was still there.**\n\nThe real me. Not the performed version. Not the achieved version. Not the strong version.\n\nJust... me.\n\nAnd people actually liked that version better.\n\n## The Question\n\nWhat armor are you wearing?\n\nWhat did you build to protect yourself that's now keeping you trapped?\n\nAnd are you ready to take it off?\n\nBecause freedom isn't found in safety. It's found in showing up as who you actually are, without all the layers you've been hiding behind.\n\n---\n\n*Recovery requires vulnerability. If you're ready to start removing the armor, support is available at [/resources](/resources).*`,
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
            content: `# What EMDR Therapy Did for My Trauma (And Why Talk Therapy Wasn't Enough)\n\nFor years, I talked about my trauma in therapy. I could tell you exactly what happened, analyze why it affected me, and intellectually understand the impact.\n\nBut I still carried it. Every day. Like a weight I couldn't put down.\n\n## The Limits of Talk Therapy\n\nDon't get me wrong—talk therapy saved my life. Cognitive Behavioral Therapy (CBT) gave me tools to manage my anxiety and depression. Group therapy helped me feel less alone. Individual therapy helped me understand my patterns.\n\nBut when it came to my childhood sexual abuse, talking about it wasn't enough.\n\nI could describe what happened in vivid detail. I could analyze how it affected my relationships, my addiction, my sense of self-worth. I could intellectually understand that it wasn't my fault.\n\nBut emotionally? I was still that scared, ashamed six-year-old kid.\n\n## What EMDR Is (In Simple Terms)\n\nEMDR stands for Eye Movement Desensitization and Reprocessing. It sounds complicated, but the basic idea is this:\n\nTrauma gets "stuck" in your brain. When you experience something overwhelming, your brain doesn't process it normally. Instead of becoming a memory you can recall without distress, it stays raw and present. That's why flashbacks feel so real—because to your brain, the trauma *is* still happening.\n\nEMDR uses bilateral stimulation (moving your eyes back and forth, or alternating taps/sounds) to help your brain reprocess traumatic memories. It's like unsticking a record that's been skipping on the same painful moment for decades.\n\n## What EMDR Was Like for Me\n\nMy first EMDR session was in 2014. I was two years sober, freshly divorced, and desperate for relief.\n\nMy therapist had me recall the abuse while following her fingers with my eyes as she moved them back and forth. It felt weird. Uncomfortable. At first, nothing happened.\n\nThen everything happened.\n\nEmotions I'd been shoving down for 25 years came flooding up. Rage. Shame. Grief. Fear. My body shook. I sobbed. I felt like I was six years old again.\n\nBut something was different: **I was safe.** I was in a therapist's office, not in the back of a car with my abuser. My adult brain knew I was safe, even while my child brain was reliving the trauma.\n\nAnd slowly, session by session, the memory started to change.\n\n## What Changed\n\nAfter several EMDR sessions, something incredible happened: I could think about my abuse without being consumed by shame.\n\nIt wasn't that I "got over it" or that it stopped mattering. But the memory no longer had the same emotional charge. I could recall what happened without my body going into fight-or-flight mode. I could acknowledge that it shaped me without letting it define me.\n\nEMDR didn't erase my trauma. It just... put it in the past, where it belonged.\n\n## Who EMDR Is For\n\nEMDR is particularly effective for:\n- PTSD (from combat, abuse, assault, accidents)\n- Childhood trauma\n- Complex trauma (multiple traumatic events)\n- Anxiety disorders rooted in specific events\n- Phobias\n\nIt's not a magic cure. It's hard work. It requires a skilled therapist and a willingness to face painful memories. But for many people (including me), it's the difference between surviving and actually healing.\n\n## Finding an EMDR Therapist\n\nNot all therapists are trained in EMDR. Look for someone who is certified and has experience with your specific type of trauma. The EMDR International Association ([emdria.org](https://www.emdria.org)) has a therapist directory.\n\nAnd know this: If you've tried talk therapy and it hasn't been enough, you're not broken. You might just need a different tool.\n\n---\n\n*If you're struggling with trauma, EMDR might help. Find resources and therapist directories at [/resources](/resources).*`,
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
            content: `# How I Co-Parent Peacefully with My Ex-Wife After Everything We Put Each Other Through\n\nMy ex-wife Jennie and I have been through hell together.\n\nAddiction. Affairs. Protective orders. Custody battles. Years of mutual destruction.\n\nToday, we co-parent peacefully. We communicate respectfully. We support each other's relationships with our kids.\n\nPeople ask how that's possible. Here's the truth.\n\n## The Damage We Did\n\nLet's not sugarcoat it: Jennie and I destroyed each other.\n\nI was an active addict for most of our marriage. Lying. Manipulating. Choosing drugs over my family. I had an affair. I drained our finances. I put our kids through trauma they didn't deserve.\n\nJennie wasn't innocent either. She had her own affair. She used the legal system as a weapon. We fought dirty, said things we couldn't take back, and weaponized our kids in ways I'm still ashamed of.\n\nBy 2012, we had protective orders against each other. I'd lost custody of my kids. We communicated only through lawyers. The hate was thick enough to cut.\n\n## The Turning Point\n\nIn 2014, two years sober, I hit a breaking point.\n\nI was seeing my kids every other weekend, but the handoffs were tense and miserable. The kids could feel it. They were anxious. Withdrawn. Stuck in the middle of two parents who couldn't be in the same room.\n\nMy therapist asked me a hard question: **"Do you want to be right, or do you want to be a good father?"**\n\nI wanted to be right. I had a list of every way Jennie had wronged me. I wanted her to acknowledge the damage she'd done, to apologize, to admit I wasn't the only villain in our story.\n\nBut more than that, I wanted my kids to be okay.\n\nAnd they weren't going to be okay as long as their parents were at war.\n\n## What I Did\n\n**1. I stopped keeping score.**\n\nI had to let go of the mental tally of who hurt whom worse. It didn't matter. Our marriage was over. Rehashing the past wasn't healing anything—it was just keeping us stuck.\n\n**2. I focused on the kids, not my ego.**\n\nEvery decision became about what was best for the kids, not what felt fair to me. That meant:\n- Being flexible with the custody schedule\n- Supporting Jennie's parenting decisions, even when I disagreed\n- Never talking badly about her in front of the kids\n- Showing up for every game, recital, and parent-teacher conference\n\n**3. I made amends—without expecting anything in return.**\n\nI apologized. Sincerely. For my addiction, my affair, the pain I caused. I didn't defend myself. I didn't add "but you also..." I just owned my part.\n\nAnd I didn't expect her to forgive me. That was her choice, not my demand.\n\n**4. I gave it time.**\n\nChange didn't happen overnight. For years, Jennie didn't trust me. Why would she? I'd broken every promise I'd ever made.\n\nBut I stayed consistent. I showed up. I did what I said I'd do. And slowly, the trust started to rebuild.\n\n## What Changed\n\nIt took years. But eventually, things shifted.\n\nJennie and I started communicating directly instead of through lawyers. We coordinated schedules without conflict. We attended the kids' events together without tension.\n\nWhen I remarried my wife Shannon, Jennie was gracious. When Jennie started dating, I supported it. We realized we weren't enemies—we were just two imperfect people trying to raise good kids.\n\nToday, we're not friends. But we're friendly. We text about the kids. We coordinate holidays. We show up for each other when the kids need us.\n\nAnd most importantly, our kids are okay. They don't carry the weight of our broken marriage because we stopped making them carry it.\n\n## What I Learned\n\nPeaceful co-parenting after a traumatic divorce is possible, but it requires:\n\n- **Humility**: Owning your part without defensiveness\n- **Consistency**: Showing up, even when it's hard\n- **Time**: Healing doesn't happen on your timeline\n- **Focus**: Prioritizing your kids over your ego\n- **Grace**: Extending the same forgiveness you hope to receive\n\nYou don't have to like your ex. You don't have to be friends. You don't even have to forgive them completely.\n\nBut you do have to stop fighting. Because your kids are watching. And they deserve better than two parents stuck in a war that's already over.\n\n---\n\n*If you're struggling with co-parenting after addiction or divorce, support and resources are available at [/resources](/resources).*`,
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

        // Update existing blog posts with full content
        const contentUpdates = [
          {
            slug: "sobriety-vs-recovery",
            content: `# The Difference Between Sobriety and Recovery\n\nFor years, I thought sobriety and recovery were the same thing. I was wrong, and that misunderstanding almost cost me everything.\n\n## What Sobriety Looked Like for Me\n\nBetween 2002 and 2012, I had multiple periods of sobriety. Weeks, sometimes months, without a drink or a drug. On paper, I was "clean." But inside? I was dying.\n\nI was white-knuckling through every day, counting hours until I could justify using again. I was still lying, still manipulating, still running from my trauma. The only difference was I wasn't actively drinking.\n\nThat's sobriety without recovery.\n\n## The Critical Difference\n\n**Sobriety** is abstinence from substances. It's necessary, but it's not sufficient.\n\n**Recovery** is healing the underlying wounds that drove you to use in the first place. It's processing trauma, building authentic relationships, and creating a life worth staying sober for.\n\nYou can be sober and miserable. You can be sober and still emotionally unavailable to your kids. You can be sober and still carrying the same shame, rage, and fear that fueled your addiction.\n\nThat's not recovery. That's just... not drinking.\n\n## What Changed for Me\n\nReal recovery started when I finally addressed my childhood sexual abuse through EMDR therapy. When I stopped performing and started being honest about who I was and what I'd done. When I built a support system that knew the real me, not the version I'd been performing for decades.\n\nRecovery meant:\n- Therapy (EMDR, CBT, group work)\n- Rigorous honesty with myself and others\n- Processing trauma instead of burying it\n- Building authentic relationships\n- Making amends through changed behavior\n- Finding purpose beyond myself\n\n## The Question That Matters\n\nIf you're sober but still miserable, ask yourself: **Am I just not drinking, or am I actually healing?**\n\nBecause sobriety without recovery is a ticking time bomb. Eventually, the pain you're not addressing will find a way out—through relapse, through other addictive behaviors, or through the slow death of living a half-life.\n\nRecovery is possible. But it requires more than just putting down the bottle.\n\nIt requires picking up the work.\n\n---\n\n*If you're struggling with addiction or trauma, please reach out for help. Resources are available at [/resources](/resources).*`
          },
          {
            slug: "breaking-silence-childhood-abuse",
            content: `# Why I Finally Talked About My Childhood Sexual Abuse\n\nI was sexually abused as a child. I didn't talk about it for 25 years.\n\nWhen I finally did, it changed everything.\n\n## The Weight of Silence\n\nFrom age 6 to 8, I was abused by someone I trusted. I never told anyone. Not my parents, not my friends, not my wife. I buried it so deep I almost convinced myself it didn't happen.\n\nBut trauma doesn't disappear just because you don't talk about it. It festers. It leaks out in other ways—rage, addiction, self-destruction, an inability to be truly intimate with anyone.\n\nFor decades, I carried that weight alone. And it was killing me.\n\n## Why I Stayed Silent\n\nShame. That's the simple answer. I was ashamed that it happened, ashamed that I didn't stop it, ashamed that I enjoyed parts of it (because that's what abuse does—it confuses you), ashamed that I wasn't "strong enough" to just get over it.\n\nI also didn't have the language. When you're a kid, you don't understand what's happening. You just know something feels wrong, but you can't articulate it. By the time I was old enough to understand, I'd already built a fortress of silence around it.\n\nAnd frankly, I didn't think anyone would believe me. Or worse, I thought they'd blame me.\n\n## What Changed\n\nBy 2014, my life was falling apart. I was two years sober but still profoundly broken. My marriage was ending, I'd lost custody of my kids, and I was barely holding it together.\n\nMy therapist asked me a question I'll never forget: **"What are you still hiding?"**\n\nI broke. And for the first time in 25 years, I said the words out loud: "I was sexually abused as a child."\n\n## What Happened When I Spoke Up\n\nSpeaking the truth didn't make the pain disappear. But it did make it manageable.\n\nI started EMDR therapy to process the trauma. I joined a support group for survivors. I told my family, my close friends, and eventually, my story publicly.\n\nSome people didn't know what to say. Some people minimized it. But the people who mattered? They showed up. They believed me. They held space for my pain without trying to fix it.\n\nAnd slowly, I started to heal.\n\n## Why I'm Telling You This\n\nIf you're carrying a secret like this, I want you to know:\n\n**It wasn't your fault.**\n\n**You don't have to carry it alone.**\n\n**Healing is possible.**\n\nSpeaking up doesn't mean you have to go public. It just means you stop lying to yourself about what happened. It means you find one safe person—a therapist, a trusted friend, a support group—and you say the words out loud.\n\nBecause silence protects the abuser. Truth protects you.\n\n---\n\n*If you've experienced childhood sexual abuse, resources are available at [RAINN.org](https://www.rainn.org) and [1in6.org](https://1in6.org). You are not alone.*`
          },
          {
            slug: "armor-becomes-prison",
            content: `# The Armor We Build Becomes Our Prison\n\nI started building armor when I was six years old.\n\nBodybuilding. Achievement. Performance. Success. Each layer was designed to protect me from ever feeling powerless again.\n\nBy the time I was 30, the armor was so thick that no one could hurt me.\n\nIt was also so thick that no one could reach me. Including myself.\n\n## The First Layer: Physical Strength\n\nAfter I was abused, I became obsessed with being strong. Not just metaphorically—literally. I started lifting weights in middle school. By high school, I was jacked. By college, I was a bodybuilder.\n\nI thought if I was physically strong enough, no one could ever hurt me again.\n\nBut trauma doesn't care how much you can bench press.\n\n## The Second Layer: Achievement\n\nI became a master achiever. Straight A's. Leadership positions. Awards. Success in business. I built a resume that looked impressive from the outside.\n\nI thought if I achieved enough, I'd finally feel valuable. Worthy. Good enough.\n\nBut achievement is a bottomless pit. No matter how much I accomplished, it was never enough.\n\n## The Third Layer: Performance\n\nI learned to perform. The successful businessman. The devoted husband. The caring father. The recovered addict. Each role carefully crafted, perfectly executed.\n\nI thought if I performed well enough, no one would see the broken, scared kid underneath.\n\nBut performance is exhausting. And eventually, I forgot who I actually was beneath all the masks.\n\n## The Fourth Layer: Control\n\nI controlled everything I could. My diet. My schedule. My emotions. My relationships. I needed to feel like I was in charge of my life, because as a kid, I had no control at all.\n\nBut control is an illusion. Life happens anyway. And when it did, I fell apart.\n\n## When the Armor Becomes the Problem\n\nHere's what I didn't understand: The armor that protected me as a kid became the thing that isolated me as an adult.\n\nMy physical strength intimidated people.\n\nMy achievements created distance.\n\nMy performance prevented real intimacy.\n\nMy need for control pushed people away.\n\nI was safe. But I was also completely alone.\n\n## The Painful Work of Removing It\n\nRecovery required me to take off the armor. Not all at once—that would've been too terrifying. But piece by piece.\n\nI had to learn:\n- Vulnerability isn't weakness\n- Imperfection doesn't mean worthlessness\n- Authenticity is more valuable than performance\n- Connection requires risk\n\nIt was the hardest work I've ever done. Because without the armor, I felt naked. Exposed. Powerless.\n\nBut here's what I found underneath:\n\n**I was still there.**\n\nThe real me. Not the performed version. Not the achieved version. Not the strong version.\n\nJust... me.\n\nAnd people actually liked that version better.\n\n## The Question\n\nWhat armor are you wearing?\n\nWhat did you build to protect yourself that's now keeping you trapped?\n\nAnd are you ready to take it off?\n\nBecause freedom isn't found in safety. It's found in showing up as who you actually are, without all the layers you've been hiding behind.\n\n---\n\n*Recovery requires vulnerability. If you're ready to start removing the armor, support is available at [/resources](/resources).*`
          },
          {
            slug: "emdr-therapy-trauma-healing",
            content: `# What EMDR Therapy Did for My Trauma (And Why Talk Therapy Wasn't Enough)\n\nFor years, I talked about my trauma in therapy. I could tell you exactly what happened, analyze why it affected me, and intellectually understand the impact.\n\nBut I still carried it. Every day. Like a weight I couldn't put down.\n\n## The Limits of Talk Therapy\n\nDon't get me wrong—talk therapy saved my life. Cognitive Behavioral Therapy (CBT) gave me tools to manage my anxiety and depression. Group therapy helped me feel less alone. Individual therapy helped me understand my patterns.\n\nBut when it came to my childhood sexual abuse, talking about it wasn't enough.\n\nI could describe what happened in vivid detail. I could analyze how it affected my relationships, my addiction, my sense of self-worth. I could intellectually understand that it wasn't my fault.\n\nBut emotionally? I was still that scared, ashamed six-year-old kid.\n\n## What EMDR Is (In Simple Terms)\n\nEMDR stands for Eye Movement Desensitization and Reprocessing. It sounds complicated, but the basic idea is this:\n\nTrauma gets "stuck" in your brain. When you experience something overwhelming, your brain doesn't process it normally. Instead of becoming a memory you can recall without distress, it stays raw and present. That's why flashbacks feel so real—because to your brain, the trauma *is* still happening.\n\nEMDR uses bilateral stimulation (moving your eyes back and forth, or alternating taps/sounds) to help your brain reprocess traumatic memories. It's like unsticking a record that's been skipping on the same painful moment for decades.\n\n## What EMDR Was Like for Me\n\nMy first EMDR session was in 2014. I was two years sober, freshly divorced, and desperate for relief.\n\nMy therapist had me recall the abuse while following her fingers with my eyes as she moved them back and forth. It felt weird. Uncomfortable. At first, nothing happened.\n\nThen everything happened.\n\nEmotions I'd been shoving down for 25 years came flooding up. Rage. Shame. Grief. Fear. My body shook. I sobbed. I felt like I was six years old again.\n\nBut something was different: **I was safe.** I was in a therapist's office, not in the back of a car with my abuser. My adult brain knew I was safe, even while my child brain was reliving the trauma.\n\nAnd slowly, session by session, the memory started to change.\n\n## What Changed\n\nAfter several EMDR sessions, something incredible happened: I could think about my abuse without being consumed by shame.\n\nIt wasn't that I "got over it" or that it stopped mattering. But the memory no longer had the same emotional charge. I could recall what happened without my body going into fight-or-flight mode. I could acknowledge that it shaped me without letting it define me.\n\nEMDR didn't erase my trauma. It just... put it in the past, where it belonged.\n\n## Who EMDR Is For\n\nEMDR is particularly effective for:\n- PTSD (from combat, abuse, assault, accidents)\n- Childhood trauma\n- Complex trauma (multiple traumatic events)\n- Anxiety disorders rooted in specific events\n- Phobias\n\nIt's not a magic cure. It's hard work. It requires a skilled therapist and a willingness to face painful memories. But for many people (including me), it's the difference between surviving and actually healing.\n\n## Finding an EMDR Therapist\n\nNot all therapists are trained in EMDR. Look for someone who is certified and has experience with your specific type of trauma. The EMDR International Association ([emdria.org](https://www.emdria.org)) has a therapist directory.\n\nAnd know this: If you've tried talk therapy and it hasn't been enough, you're not broken. You might just need a different tool.\n\n---\n\n*If you're struggling with trauma, EMDR might help. Find resources and therapist directories at [/resources](/resources).*`
          },
          {
            slug: "peaceful-coparenting-after-addiction",
            content: `# How I Co-Parent Peacefully with My Ex-Wife After Everything We Put Each Other Through\n\nMy ex-wife Jennie and I have been through hell together.\n\nAddiction. Affairs. Protective orders. Custody battles. Years of mutual destruction.\n\nToday, we co-parent peacefully. We communicate respectfully. We support each other's relationships with our kids.\n\nPeople ask how that's possible. Here's the truth.\n\n## The Damage We Did\n\nLet's not sugarcoat it: Jennie and I destroyed each other.\n\nI was an active addict for most of our marriage. Lying. Manipulating. Choosing drugs over my family. I had an affair. I drained our finances. I put our kids through trauma they didn't deserve.\n\nJennie wasn't innocent either. She had her own affair. She used the legal system as a weapon. We fought dirty, said things we couldn't take back, and weaponized our kids in ways I'm still ashamed of.\n\nBy 2012, we had protective orders against each other. I'd lost custody of my kids. We communicated only through lawyers. The hate was thick enough to cut.\n\n## The Turning Point\n\nIn 2014, two years sober, I hit a breaking point.\n\nI was seeing my kids every other weekend, but the handoffs were tense and miserable. The kids could feel it. They were anxious. Withdrawn. Stuck in the middle of two parents who couldn't be in the same room.\n\nMy therapist asked me a hard question: **"Do you want to be right, or do you want to be a good father?"**\n\nI wanted to be right. I had a list of every way Jennie had wronged me. I wanted her to acknowledge the damage she'd done, to apologize, to admit I wasn't the only villain in our story.\n\nBut more than that, I wanted my kids to be okay.\n\nAnd they weren't going to be okay as long as their parents were at war.\n\n## What I Did\n\n**1. I stopped keeping score.**\n\nI had to let go of the mental tally of who hurt whom worse. It didn't matter. Our marriage was over. Rehashing the past wasn't healing anything—it was just keeping us stuck.\n\n**2. I focused on the kids, not my ego.**\n\nEvery decision became about what was best for the kids, not what felt fair to me. That meant:\n- Being flexible with the custody schedule\n- Supporting Jennie's parenting decisions, even when I disagreed\n- Never talking badly about her in front of the kids\n- Showing up for every game, recital, and parent-teacher conference\n\n**3. I made amends—without expecting anything in return.**\n\nI apologized. Sincerely. For my addiction, my affair, the pain I caused. I didn't defend myself. I didn't add "but you also..." I just owned my part.\n\nAnd I didn't expect her to forgive me. That was her choice, not my demand.\n\n**4. I gave it time.**\n\nChange didn't happen overnight. For years, Jennie didn't trust me. Why would she? I'd broken every promise I'd ever made.\n\nBut I stayed consistent. I showed up. I did what I said I'd do. And slowly, the trust started to rebuild.\n\n## What Changed\n\nIt took years. But eventually, things shifted.\n\nJennie and I started communicating directly instead of through lawyers. We coordinated schedules without conflict. We attended the kids' events together without tension.\n\nWhen I remarried my wife Shannon, Jennie was gracious. When Jennie started dating, I supported it. We realized we weren't enemies—we were just two imperfect people trying to raise good kids.\n\nToday, we're not friends. But we're friendly. We text about the kids. We coordinate holidays. We show up for each other when the kids need us.\n\nAnd most importantly, our kids are okay. They don't carry the weight of our broken marriage because we stopped making them carry it.\n\n## What I Learned\n\nPeaceful co-parenting after a traumatic divorce is possible, but it requires:\n\n- **Humility**: Owning your part without defensiveness\n- **Consistency**: Showing up, even when it's hard\n- **Time**: Healing doesn't happen on your timeline\n- **Focus**: Prioritizing your kids over your ego\n- **Grace**: Extending the same forgiveness you hope to receive\n\nYou don't have to like your ex. You don't have to be friends. You don't even have to forgive them completely.\n\nBut you do have to stop fighting. Because your kids are watching. And they deserve better than two parents stuck in a war that's already over.\n\n---\n\n*If you're struggling with co-parenting after addiction or divorce, support and resources are available at [/resources](/resources).*`
          }
        ];

        for (const update of contentUpdates) {
          await connection.query(
            "UPDATE `blog_posts` SET `content` = ? WHERE `slug` = ?",
            [update.content, update.slug]
          );
        }

        results.messages.push("✅ Updated all 5 blog posts with complete content");
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
            fileUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/96788853/yFWupfXwmsXYvqGT.pdf",
            fileKey: "lead-magnets/first-3-chapters.pdf",
            type: "pdf" as const,
          },
          {
            title: "Recovery Toolkit - Practical Worksheets",
            slug: "recovery-toolkit",
            description:
              "A collection of tools, exercises, and resources to support your recovery journey. Includes daily check-ins, trigger worksheets, gratitude templates, and more.",
            fileUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/96788853/juTOwCWrbhEtuNoc.pdf",
            fileKey: "lead-magnets/recovery-toolkit.pdf",
            type: "pdf" as const,
          },
          {
            title: "Crooked Lines Reading Guide",
            slug: "reading-guide",
            description:
              "Discussion questions and reflection prompts for individual use or group study. Go deeper with the themes of trauma, addiction, and redemption.",
            fileUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/96788853/KGjRutgzKuxQLhgj.pdf",
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

    // 4. Update existing lead magnet URLs to use S3 links
    try {
      const urlUpdates = [
        {
          title: "First 3 Chapters - Free Excerpt",
          fileUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/96788853/yFWupfXwmsXYvqGT.pdf"
        },
        {
          title: "Recovery Toolkit - Practical Worksheets",
          fileUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/96788853/juTOwCWrbhEtuNoc.pdf"
        },
        {
          title: "Crooked Lines Reading Guide",
          fileUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/96788853/KGjRutgzKuxQLhgj.pdf"
        }
      ];

      let updatedCount = 0;
      for (const update of urlUpdates) {
        await connection.query(
          "UPDATE `lead_magnets` SET `file_url` = ? WHERE `title` = ?",
          [update.fileUrl, update.title]
        );
        updatedCount++;
      }

      if (updatedCount > 0) {
        results.messages.push(`✅ Updated ${updatedCount} lead magnet PDF URLs to S3 links`);
      }
    } catch (error: any) {
      results.messages.push(`⚠️ PDF URL update: ${error.message}`);
    }

    // 5. Create products table if it doesn't exist and seed products
    try {
      // Check if products table exists
      const [tables] = await connection.query(
        "SHOW TABLES LIKE 'products'"
      ) as any;

      if (!tables || tables.length === 0) {
        // Create products table
        await connection.query(`
          CREATE TABLE \`products\` (
            \`id\` int AUTO_INCREMENT NOT NULL,
            \`name\` varchar(255) NOT NULL,
            \`slug\` varchar(255) NOT NULL UNIQUE,
            \`description\` text,
            \`price\` int NOT NULL,
            \`stripe_price_id\` varchar(255) NOT NULL,
            \`type\` enum('one_time', 'subscription') NOT NULL,
            \`features\` text,
            \`status\` enum('active', 'inactive') NOT NULL DEFAULT 'active',
            \`created_at\` timestamp NOT NULL DEFAULT (now()),
            \`updated_at\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT \`products_id\` PRIMARY KEY(\`id\`)
          )
        `);
        results.messages.push("✅ Created products table");
      }

      // DELETE ALL existing products to avoid slug/price ID conflicts
      await connection.query("DELETE FROM `products`");
      results.messages.push("🗑️ Deleted old products");

      // Always seed products fresh
      const productsList = [
        {
          name: "Crooked Lines 7-Day Reset",
          slug: "7-day-reset",
          description: "A focused, actionable challenge to break through plateaus and reignite your commitment to wholeness.",
          price: 2700,
          stripePriceId: "price_1SYt2tC2dOpPzSOOpg5PW7eU",
          type: "one_time" as const,
          features: JSON.stringify([
            "7 daily video lessons (10-15 minutes each)",
            "Downloadable workbook with exercises",
            "Daily reflection prompts",
            "Private community access during challenge",
            "Bonus: Trigger management worksheet"
          ]),
          status: "active" as const,
        },
        {
          name: "From Broken to Whole Course",
          slug: "from-broken-to-whole",
          description: "An 8-module course that takes you from surviving to thriving—with proven strategies for lasting change.",
          price: 9700,
          stripePriceId: "price_1SYt3KC2dOpPzSOOpAokf1UQ",
          type: "one_time" as const,
          features: JSON.stringify([
            "8 comprehensive modules covering every stage of recovery",
            "40+ video lessons (5-20 minutes each)",
            "8 downloadable workbooks with exercises",
            "Reflection prompts and homework for each module",
            "Bonus resources and reading recommendations",
            "Private course community",
            "Lifetime access - learn at your own pace"
          ]),
          status: "active" as const,
        },
        {
          name: "Bent Not Broken Circle",
          slug: "bent-not-broken-circle",
          description: "A monthly membership community for ongoing support, accountability, and growth in your recovery journey.",
          price: 2900,
          stripePriceId: "price_1SYt3jC2dOpPzSOOR7dDuGtY",
          type: "subscription" as const,
          features: JSON.stringify([
            "Monthly live group call with Q&A",
            "Private online forum (24/7 access)",
            "Exclusive monthly content (videos, worksheets, resources)",
            "Accountability partnerships",
            "Early access to new products and programs",
            "Cancel anytime - no long-term commitment"
          ]),
          status: "active" as const,
        },
      ];

      for (const product of productsList) {
        await db.insert(products).values(product);
      }

      results.products = productsList.length;
      results.messages.push(`✅ Seeded ${productsList.length} products with correct slugs`);
    } catch (error: any) {
      results.messages.push(`❌ Products error: ${error.message}`);
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
