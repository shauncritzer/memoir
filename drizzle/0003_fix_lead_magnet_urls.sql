-- Fix lead magnet file URLs to match actual filenames (hyphens not underscores)
UPDATE `lead_magnets` SET `file_url` = '/first-3-chapters.pdf' WHERE `slug` = 'first-3-chapters';
--> statement-breakpoint
UPDATE `lead_magnets` SET `file_url` = '/recovery-toolkit.pdf' WHERE `slug` = 'recovery-toolkit';
--> statement-breakpoint
UPDATE `lead_magnets` SET `file_url` = '/reading-guide.pdf' WHERE `slug` = 'reading-guide';
