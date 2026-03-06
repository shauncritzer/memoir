# Bent Not Broken Circle — Membership Plan
## $29/month recurring (Stripe Price ID: price_1T83FTC2dOpPzSOOQCWvWdJd)

**FOR SHAUN'S APPROVAL** — Review this plan and let me know what to adjust before we build it out.

---

## What It Is

A monthly membership community for people in recovery who've completed the 7-Day Reset or From Broken to Whole course (or anyone serious about long-term recovery). Think of it as the ongoing support layer that keeps people connected, accountable, and growing after the courses end.

---

## Monthly Content Schedule

### Week 1: Live Group Coaching Call (60 min)
- Shaun leads a live Zoom/YouTube Live call
- Topic of the month (rotating themes — see below)
- Q&A and hot-seat coaching (members submit questions)
- Recorded and posted for those who miss it
- **Shaun's time commitment: 1 hour/month live**

### Week 2: Expert Guest Session (30-45 min, pre-recorded or live)
- Invite guest experts: therapists, nutritionists, fitness coaches, neuroscientists, other recovery coaches
- Pre-record via HeyGen or Zoom so Shaun doesn't have to be present every time
- **Shaun's time commitment: Coordination only (can be AI-assisted)**

### Week 3: Accountability & Check-in Thread
- AI-facilitated weekly check-in (automated through the platform)
- Members answer: What's working? What's hard? What do you need this week?
- Shaun drops in with a voice note or short video (2-3 min via ElevenLabs or selfie video)
- **Shaun's time commitment: 5-10 min**

### Week 4: Exclusive Resource Drop
- New PDF workbook, guided meditation audio (ElevenLabs), or bonus video lesson
- Can be AI-generated and reviewed by Shaun before publishing
- Topics rotate through REWIRED methodology pillars
- **Shaun's time commitment: Review only (15 min)**

---

## Monthly Themes (Year 1 Rotation)

| Month | Theme | Focus |
|-------|-------|-------|
| 1 | Foundations of Recovery | Building daily practices |
| 2 | Nervous System Mastery | Advanced breathwork & somatic tools |
| 3 | Relationships in Recovery | Boundaries, trust, communication |
| 4 | Shame & Self-Forgiveness | Deep dive workshop |
| 5 | Inner Child Healing | Advanced reparenting practices |
| 6 | Career & Purpose in Recovery | Building a meaningful life |
| 7 | Physical Health & Recovery | Nutrition, exercise, sleep |
| 8 | Spirituality & Connection | Finding meaning beyond substance |
| 9 | Financial Recovery | Rebuilding after addiction |
| 10 | Holiday Survival Guide | Triggers, family, boundaries |
| 11 | Giving Back & Service | From consumer to contributor |
| 12 | Year in Review & Vision | Celebration + goal-setting |

---

## Technical Implementation

### What Needs Building
1. **Member-only content area** at `/members/circle` — shows current month's content + archive
2. **Stripe subscription handling** — monthly billing, cancellation, reactivation
3. **Content delivery** — video player, PDF downloads, discussion threads
4. **Basic community features** — comment threads on each month's content (not a full forum)
5. **AI check-in system** — weekly automated prompts via the platform or email

### Database Changes Needed
- Add `subscription_status` field to purchases or create `subscriptions` table
- Add `circle_content` table for monthly drops (type, title, content, month, year)
- Add `circle_comments` table for discussion threads

### What We Already Have
- Stripe subscription price ID configured
- Video generation (HeyGen + ElevenLabs)
- PDF generation capability
- AI content generation
- Email system (ConvertKit)

---

## Revenue Projections

| Members | Monthly Revenue | Annual Revenue |
|---------|----------------|----------------|
| 10 | $290 | $3,480 |
| 25 | $725 | $8,700 |
| 50 | $1,450 | $17,400 |
| 100 | $2,900 | $34,800 |

**Break-even for Shaun's time:** At 10 members ($290/mo), Shaun spends ~2-3 hours/month creating content. At 50+ members, it's the highest ROI product in the lineup.

---

## Launch Strategy

### Phase 1: Soft Launch (Invite Only)
- Email existing 7-Day Reset and From Broken to Whole purchasers
- Offer founding member rate: $19/month (locked in forever) for first 20 members
- Build initial community momentum

### Phase 2: Public Launch
- Add to Products page (remove "Coming Soon" badge)
- Create dedicated sales page at `/bent-not-broken-circle`
- Add to email sequences as natural upsell after course completion

### Phase 3: Scale
- Increase content cadence based on demand
- Add member-generated content and peer coaching
- Consider annual plan option ($249/year = 2 months free)

---

## Shaun's Decision Points

Please review and decide:

1. **Content format:** Live Zoom calls vs. pre-recorded videos? (Live builds more connection, pre-recorded is more scalable)
2. **Community platform:** Built into the site (simpler) vs. Discord/Circle.so (more features)?
3. **Launch timing:** Ready to soft-launch to existing customers?
4. **Founding member discount:** $19/mo locked-in for first 20, or different pricing?
5. **Guest experts:** Do you have contacts to invite, or should the AI research agent find them?

---

*This plan was generated for your review. Once approved, we'll build the membership pages and payment flow.*
