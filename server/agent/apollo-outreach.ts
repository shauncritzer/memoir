/**
 * APOLLO OUTREACH — Lead generation for Critzer's Cabinets
 *
 * Uses Apollo.io API to find local prospects (homeowners, designers, builders,
 * contractors) in the Charlottesville/Central Virginia area and runs a simple
 * 3-step email sequence to book free estimates.
 *
 * Sequence:
 *   Email 1 (Day 0): Introduction — who we are, 40 years of craftsmanship
 *   Email 2 (Day 4): Social proof — past projects, happy clients
 *   Email 3 (Day 9): Offer — free in-home estimate, limited slots
 *
 * Runs weekly via orchestrator. Target: 2-3 new cabinet jobs per month.
 *
 * Apollo API docs: https://apolloio.github.io/apollo-api-docs/
 */

import { ENV } from "../_core/env";
import { getDb } from "../db";

// ─── Configuration ───────────────────────────────────────────────────────────

const APOLLO_API = "https://api.apollo.io/api/v1";

/** How many new leads to find per weekly run */
const LEADS_PER_BATCH = 15;

/** Days between emails in the sequence */
const SEQUENCE_DELAYS = {
  email2AfterDays: 4,
  email3AfterDays: 9,
};

/** Target area — Charlottesville and surrounding Central Virginia */
const TARGET_LOCATIONS = [
  "Charlottesville, Virginia",
  "Albemarle County, Virginia",
  "Waynesboro, Virginia",
  "Staunton, Virginia",
  "Harrisonburg, Virginia",
  "Lynchburg, Virginia",
  "Orange, Virginia",
  "Fluvanna County, Virginia",
  "Greene County, Virginia",
  "Nelson County, Virginia",
];

/** Apollo search personas — the types of people who buy custom cabinets */
const LEAD_PERSONAS: { titles: string[]; leadType: string }[] = [
  {
    titles: ["Interior Designer", "Kitchen Designer", "Design Consultant", "Interior Decorator"],
    leadType: "interior_designer",
  },
  {
    titles: ["General Contractor", "Home Builder", "Construction Manager", "Renovation Contractor"],
    leadType: "builder",
  },
  {
    titles: ["Real Estate Agent", "Realtor", "Real Estate Broker"],
    leadType: "realtor",
  },
];

// ─── Email Templates ────────────────────────────────────────────────────────

function getEmailTemplates(firstName: string): { subject: string; body: string }[] {
  const name = firstName || "there";
  return [
    // Email 1: Introduction
    {
      subject: "Custom cabinets in Charlottesville — 40 years of craftsmanship",
      body: `Hi ${name},

I'm Shaun from Critzer's Cabinets here in Charlottesville. We've been building custom cabinets and woodwork for families in Central Virginia for over 40 years.

Whether it's a kitchen remodel, bathroom vanity, built-in bookshelves, or a full home build — we do it all in-house, right here in the Valley.

If you or any of your clients are planning a project that needs quality cabinetry, I'd love to connect. We offer free in-home estimates and work with homeowners, designers, and builders.

Would you be open to a quick call this week?

Best,
Shaun Critzer
Critzer's Cabinets
Charlottesville, VA
critzerscabinets.com`,
    },
    // Email 2: Social proof
    {
      subject: "A few of our recent projects in the area",
      body: `Hi ${name},

Wanted to follow up with a few examples of recent work we've done in the Charlottesville area:

• Full kitchen remodel in Crozet — custom shaker cabinets, soft-close everything
• Built-in entertainment center in Ivy — floor to ceiling, walnut finish
• Bathroom vanities for a new build in Albemarle — builder loved the turnaround time

We work with everything from new construction to 100-year-old homes. Our clients often say the quality speaks for itself.

If you'd like to see more of our work or chat about an upcoming project, just reply to this email.

Shaun Critzer
Critzer's Cabinets`,
    },
    // Email 3: Offer
    {
      subject: "Free estimate — limited availability this month",
      body: `Hi ${name},

Last note from me — wanted to let you know we have a few openings for free in-home estimates this month.

We come to you, take measurements, talk through your vision, and provide a detailed quote — no pressure, no obligation. Most of our estimates turn into projects because people see the value once they understand what custom cabinetry actually costs vs. big box alternatives.

If you're interested or know someone who might be, just reply with a good time and I'll get something on the calendar.

Thanks for your time,
Shaun Critzer
Critzer's Cabinets
critzerscabinets.com`,
    },
  ];
}

// ─── Apollo API Functions ───────────────────────────────────────────────────

export function isApolloConfigured(): boolean {
  return !!ENV.apolloApiKey;
}

/**
 * Search Apollo for people matching our target personas in the target area.
 */
async function searchApolloLeads(persona: { titles: string[]; leadType: string }): Promise<any[]> {
  const response = await fetch(`${APOLLO_API}/mixed_people/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": ENV.apolloApiKey,
    },
    body: JSON.stringify({
      person_titles: persona.titles,
      person_locations: TARGET_LOCATIONS,
      per_page: LEADS_PER_BATCH,
      page: 1,
      // Only people with email addresses
      contact_email_status: ["verified", "guessed"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Apollo search failed: ${response.status} — ${errorText}`);
  }

  const data = await response.json();
  return data.people || [];
}

/**
 * Send an email via Apollo's email sending API.
 */
async function sendApolloEmail(
  toEmail: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  // Apollo uses their emailer API — we send via their system so it's tracked
  const response = await fetch(`${APOLLO_API}/emailer/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": ENV.apolloApiKey,
    },
    body: JSON.stringify({
      contact_email: toEmail,
      subject,
      body_html: body.replace(/\n/g, "<br>"),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, error: `Apollo email failed: ${response.status} — ${errorText}` };
  }

  return { success: true };
}

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Find new leads via Apollo and store them in the database.
 * Returns the number of new leads added.
 */
export async function prospectNewLeads(): Promise<number> {
  if (!isApolloConfigured()) {
    console.log("[Apollo] Not configured — skipping prospecting");
    return 0;
  }

  const db = await getDb();
  if (!db) return 0;

  const { sql } = await import("drizzle-orm");

  // Ensure the apollo_leads table exists
  await db.execute(sql`CREATE TABLE IF NOT EXISTS apollo_leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT,
    apollo_id VARCHAR(255) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(320),
    phone VARCHAR(50),
    company VARCHAR(255),
    title VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    lead_type VARCHAR(50),
    status ENUM('new','email_1_sent','email_2_sent','email_3_sent','replied','booked','won','unsubscribed','bounced') NOT NULL DEFAULT 'new',
    email_1_sent_at TIMESTAMP NULL,
    email_2_sent_at TIMESTAMP NULL,
    email_3_sent_at TIMESTAMP NULL,
    replied_at TIMESTAMP NULL,
    reply_content TEXT,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  // Get Critzer's Cabinets business ID
  const [bizRows] = await db.execute(
    sql`SELECT id FROM businesses WHERE slug = 'critzer-cabinets' LIMIT 1`
  ) as any;
  const businessId = (bizRows as any[])?.[0]?.id || null;

  let totalAdded = 0;

  // Rotate through personas each week (pick one based on week number)
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const persona = LEAD_PERSONAS[weekNum % LEAD_PERSONAS.length];

  console.log(`[Apollo] Searching for ${persona.leadType} leads in Central Virginia...`);

  try {
    const people = await searchApolloLeads(persona);

    for (const person of people) {
      if (!person.email) continue;

      // Skip if already in DB
      const [existing] = await db.execute(
        sql`SELECT id FROM apollo_leads WHERE email = ${person.email} LIMIT 1`
      ) as any;
      if ((existing as any[])?.length > 0) continue;

      await db.execute(sql`INSERT INTO apollo_leads
        (business_id, apollo_id, first_name, last_name, email, phone, company, title, city, state, lead_type, status, metadata)
        VALUES (
          ${businessId},
          ${person.id || null},
          ${person.first_name || null},
          ${person.last_name || null},
          ${person.email},
          ${person.phone_numbers?.[0]?.sanitized_number || null},
          ${person.organization?.name || null},
          ${person.title || null},
          ${person.city || null},
          ${person.state || null},
          ${persona.leadType},
          'new',
          ${JSON.stringify({ apolloSource: true, searchedAt: new Date().toISOString() })}
        )`);

      totalAdded++;
    }

    console.log(`[Apollo] Added ${totalAdded} new ${persona.leadType} leads`);
  } catch (err: any) {
    console.error(`[Apollo] Search failed for ${persona.leadType}:`, err.message);
  }

  return totalAdded;
}

/**
 * Process the email sequence — send the next email to leads who are due.
 * Returns the number of emails sent.
 */
export async function processEmailSequence(): Promise<number> {
  if (!isApolloConfigured()) return 0;

  const db = await getDb();
  if (!db) return 0;

  const { sql } = await import("drizzle-orm");
  let sent = 0;

  // --- Email 1: Send to new leads ---
  const [newLeads] = await db.execute(
    sql`SELECT id, first_name, email FROM apollo_leads
        WHERE status = 'new'
        AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ORDER BY created_at ASC
        LIMIT 5`
  ) as any;

  for (const lead of (newLeads as any[]) || []) {
    const templates = getEmailTemplates(lead.first_name);
    const result = await sendApolloEmail(lead.email, templates[0].subject, templates[0].body);

    if (result.success) {
      await db.execute(
        sql`UPDATE apollo_leads SET status = 'email_1_sent', email_1_sent_at = NOW() WHERE id = ${lead.id}`
      );
      sent++;
    } else if (result.error?.includes("bounce") || result.error?.includes("invalid")) {
      await db.execute(
        sql`UPDATE apollo_leads SET status = 'bounced' WHERE id = ${lead.id}`
      );
    }
    console.log(`[Apollo] Email 1 to ${lead.email}: ${result.success ? "sent" : result.error}`);
  }

  // --- Email 2: Follow up after 4 days ---
  const [email2Due] = await db.execute(
    sql`SELECT id, first_name, email FROM apollo_leads
        WHERE status = 'email_1_sent'
        AND email_1_sent_at < DATE_SUB(NOW(), INTERVAL ${SEQUENCE_DELAYS.email2AfterDays} DAY)
        ORDER BY email_1_sent_at ASC
        LIMIT 5`
  ) as any;

  for (const lead of (email2Due as any[]) || []) {
    const templates = getEmailTemplates(lead.first_name);
    const result = await sendApolloEmail(lead.email, templates[1].subject, templates[1].body);

    if (result.success) {
      await db.execute(
        sql`UPDATE apollo_leads SET status = 'email_2_sent', email_2_sent_at = NOW() WHERE id = ${lead.id}`
      );
      sent++;
    }
    console.log(`[Apollo] Email 2 to ${lead.email}: ${result.success ? "sent" : result.error}`);
  }

  // --- Email 3: Final follow up after 9 days ---
  const [email3Due] = await db.execute(
    sql`SELECT id, first_name, email FROM apollo_leads
        WHERE status = 'email_2_sent'
        AND email_2_sent_at < DATE_SUB(NOW(), INTERVAL ${SEQUENCE_DELAYS.email3AfterDays - SEQUENCE_DELAYS.email2AfterDays} DAY)
        ORDER BY email_2_sent_at ASC
        LIMIT 5`
  ) as any;

  for (const lead of (email3Due as any[]) || []) {
    const templates = getEmailTemplates(lead.first_name);
    const result = await sendApolloEmail(lead.email, templates[2].subject, templates[2].body);

    if (result.success) {
      await db.execute(
        sql`UPDATE apollo_leads SET status = 'email_3_sent', email_3_sent_at = NOW() WHERE id = ${lead.id}`
      );
      sent++;
    }
    console.log(`[Apollo] Email 3 to ${lead.email}: ${result.success ? "sent" : result.error}`);
  }

  if (sent > 0) {
    console.log(`[Apollo] Sent ${sent} emails this cycle`);
  }

  return sent;
}

/**
 * Run a full Apollo outreach cycle: prospect + send emails.
 * Called by orchestrator weekly.
 */
export async function runApolloOutreach(): Promise<string | null> {
  if (!isApolloConfigured()) return null;

  try {
    const newLeads = await prospectNewLeads();
    const emailsSent = await processEmailSequence();

    if (newLeads === 0 && emailsSent === 0) return null;

    const parts: string[] = [];
    if (newLeads > 0) parts.push(`${newLeads} new leads found`);
    if (emailsSent > 0) parts.push(`${emailsSent} emails sent`);

    // Log as agent action
    const db = await getDb();
    if (db) {
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`INSERT INTO agent_actions
        (category, title, description, risk_tier, status, result, executed_at)
        VALUES (
          'outreach',
          'Apollo outreach cycle — Critzer''s Cabinets',
          ${`Prospected for leads and processed email sequence. ${parts.join(", ")}.`},
          2,
          'executed',
          ${JSON.stringify({ newLeads, emailsSent })},
          NOW()
        )`);
    }

    return `Cabinets outreach: ${parts.join(", ")}`;
  } catch (err: any) {
    console.error("[Apollo] Outreach cycle failed:", err.message);
    return null;
  }
}
