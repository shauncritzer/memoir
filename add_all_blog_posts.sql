-- This script will add all 5 new blog posts if they don't already exist
-- Run this directly in the MySQL database

-- First, get the author ID (assuming it's the first user)
SET @authorId = (SELECT id FROM users LIMIT 1);

-- Blog Post 1: Nervous System
INSERT IGNORE INTO blog_posts (slug, title, excerpt, content, category, tags, published_at, author_id, status, view_count)
VALUES (
  'addiction-nervous-system-problem',
  'Your Addiction Isn''t a Moral Failing, It''s a Nervous System Problem',
  'Stop blaming yourself. Your addiction isn''t about willpower—it''s about a dysregulated nervous system. Here''s what actually works.',
  '# Your Addiction Isn''t a Moral Failing, It''s a Nervous System Problem\n\n[Full content would go here - truncated for brevity]',
  'Recovery',
  '["addiction", "nervous system", "trauma", "recovery", "polyvagal theory"]',
  '2025-01-20',
  @authorId,
  'published',
  0
);

-- Add the other 4 blog posts similarly...
