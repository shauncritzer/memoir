# Bent Not Broken Circle - Community Space Implementation Plan

## Overview

The **Bent Not Broken Circle** is your $29/month subscription community for ongoing support, accountability, and connection in recovery. This document outlines three implementation approaches with pros, cons, and recommendations.

---

## Option 1: Built-In Forum (Recommended for Full Control)

### Description
Build a custom forum/discussion board directly into your website using the existing database and tech stack.

### Features to Include
- **Discussion Categories:**
  - Daily Check-ins
  - Wins & Celebrations
  - Struggles & Support
  - Resources & Tools
  - Q&A with Shaun
  - Member Introductions

- **Core Functionality:**
  - Create posts/threads
  - Reply to posts
  - Like/upvote posts
  - Subscribe to threads (email notifications)
  - Search posts
  - User profiles (avatar, bio, sobriety date)
  - Moderation tools (flag, hide, ban)

- **Member-Only Access:**
  - Requires active $29/month subscription
  - Automatic access revoked if subscription cancelled
  - Integration with Stripe subscription status

### Technical Implementation

**Database Tables Needed:**
```sql
-- Forum categories
forum_categories (id, name, description, sort_order)

-- Forum posts/threads
forum_posts (id, category_id, user_id, title, content, created_at, updated_at, views, likes)

-- Forum replies
forum_replies (id, post_id, user_id, content, created_at, updated_at, likes)

-- Post likes
forum_likes (id, post_id, reply_id, user_id, created_at)

-- Post subscriptions (for notifications)
forum_subscriptions (id, post_id, user_id, created_at)
```

**UI Components:**
- Forum home (list of categories)
- Category view (list of posts)
- Post detail view (original post + replies)
- Create post form
- Reply form
- User profile page

**Moderation:**
- Admin dashboard to review flagged posts
- Ability to hide/delete posts
- Ability to ban users

### Pros
✅ Full control over features and design  
✅ Seamless integration with existing site  
✅ No additional login required  
✅ All data stays in your database  
✅ Can customize for recovery-specific needs  
✅ No monthly fees to third-party platforms  

### Cons
❌ Requires development time (est. 20-30 hours)  
❌ You're responsible for moderation  
❌ Need to build notification system  
❌ Less feature-rich than established platforms initially  

### Estimated Timeline
- Week 1: Database schema + backend API
- Week 2: Forum UI components
- Week 3: Notifications + moderation tools
- Week 4: Testing + polish

### Cost
- Development time only (no ongoing platform fees)
- Email notifications (already have infrastructure)

---

## Option 2: Circle.so Integration (Recommended for Speed)

### Description
Use [Circle.so](https://circle.so) - a community platform designed for creators and membership sites.

### Features (Out of the Box)
- Discussion forums
- Events calendar
- Direct messaging
- Member directory
- Live chat
- Mobile app
- Email notifications
- Moderation tools
- Analytics

### Integration Approach
1. **Single Sign-On (SSO):**
   - When user subscribes to Bent Not Broken Circle on your site → auto-create Circle account
   - Use Circle's API to sync user data
   - Embed Circle community iframe on your site OR link to separate Circle space

2. **Subscription Management:**
   - Stripe webhook → Circle API (add/remove member)
   - If subscription cancelled → revoke Circle access

3. **Branding:**
   - Custom domain (community.shauncritzer.com)
   - Custom colors, logo, fonts
   - Matches your site branding

### Pros
✅ Launch in days, not weeks  
✅ Professional, polished platform  
✅ Mobile app included  
✅ Built-in moderation tools  
✅ Analytics dashboard  
✅ Members can DM each other  
✅ Events/calendar built-in  

### Cons
❌ Monthly platform fee ($39-$99/month depending on plan)  
❌ Another login (even with SSO, it's a separate platform)  
❌ Less control over features  
❌ Data lives on Circle, not your database  
❌ Limited customization  

### Cost
- Circle.so: $39/month (Basic) or $99/month (Professional)
- Custom domain: Free (you already own shauncritzer.com)

### Timeline
- Week 1: Set up Circle space, configure branding
- Week 2: Build Stripe → Circle API integration
- Week 3: Test SSO and subscription sync
- Week 4: Launch

---

## Option 3: Discord Integration (Recommended for Real-Time Chat)

### Description
Use Discord as your community platform - great for real-time chat, voice calls, and casual connection.

### Features
- Text channels (organized by topic)
- Voice channels (for group calls)
- Direct messaging
- Roles (assign "Member" role to paying subscribers)
- Bots for automation
- Mobile app
- Free

### Integration Approach
1. **Create Discord Server:**
   - Set up channels: #daily-check-ins, #wins, #struggles, #resources, #general
   - Create "Member" role with access to private channels

2. **Subscription Management:**
   - When user subscribes → send them Discord invite link
   - Use Discord bot to verify subscription status
   - Stripe webhook → Discord bot (add/remove Member role)

3. **Automation:**
   - Bot to welcome new members
   - Bot to post daily prompts (#daily-check-ins)
   - Bot to remove access if subscription cancelled

### Pros
✅ Free platform  
✅ Real-time chat (more engaging than forums)  
✅ Voice channels for group calls  
✅ Mobile app  
✅ Members are already familiar with Discord  
✅ Easy to moderate  

### Cons
❌ Feels less professional (gaming platform)  
❌ Separate login required  
❌ Can be overwhelming for non-tech-savvy users  
❌ Less structured than a forum  
❌ Data lives on Discord  

### Cost
- Free (Discord is free)
- Optional: Discord bot hosting ($5-10/month)

### Timeline
- Week 1: Set up Discord server, create channels
- Week 2: Build Discord bot for subscription verification
- Week 3: Test Stripe → Discord integration
- Week 4: Launch

---

## Comparison Table

| Feature | Built-In Forum | Circle.so | Discord |
|---------|---------------|-----------|---------|
| **Cost** | $0/month | $39-99/month | $0/month |
| **Development Time** | 3-4 weeks | 1-2 weeks | 1-2 weeks |
| **Professionalism** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Ease of Use** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Real-Time Chat** | ❌ | ✅ | ✅✅✅ |
| **Mobile App** | ❌ | ✅ | ✅ |
| **Voice Calls** | ❌ | ✅ | ✅ |
| **Full Control** | ✅✅✅ | ⭐⭐ | ⭐ |
| **Data Ownership** | ✅ | ❌ | ❌ |
| **Customization** | ✅✅✅ | ⭐⭐⭐ | ⭐⭐ |

---

## Recommendation

### For **Maximum Control & Integration**: Option 1 (Built-In Forum)
If you want the community to feel like a seamless part of your site, with full control over features and data, build it in-house. This is the best long-term solution but requires more upfront development.

### For **Speed & Polish**: Option 2 (Circle.so)
If you want to launch quickly with a professional, feature-rich platform, Circle.so is the best choice. The monthly fee is worth it for the time saved and the quality of the platform.

### For **Real-Time Connection**: Option 3 (Discord)
If your community values real-time chat and voice calls over structured forums, Discord is the way to go. It's free and highly engaging, but less professional.

---

## Hybrid Approach (Best of Both Worlds)

**Start with Circle.so or Discord (fast launch), then build in-house forum later.**

1. **Month 1-3:** Launch community on Circle.so or Discord
   - Get members engaged immediately
   - Learn what features they actually use
   - Validate demand for the community

2. **Month 4-6:** Build custom forum on your site
   - Use learnings from Circle/Discord to inform features
   - Migrate members to in-house platform
   - Cancel Circle subscription or keep Discord as "chat" supplement

This approach lets you launch fast while working toward full control.

---

## Next Steps

1. **Decide on approach** (Built-in, Circle, Discord, or Hybrid)
2. **Set up Stripe subscription product** for $29/month
3. **Build integration** (Stripe → Community platform)
4. **Create welcome flow** for new members
5. **Seed initial content** (welcome post, guidelines, first prompts)
6. **Launch** with founding members

---

**Recommendation:** Start with **Circle.so** for speed and polish, then migrate to **built-in forum** in 6 months once you've validated demand and learned what features matter most.

This gives you the best of both worlds: fast launch + long-term control.
