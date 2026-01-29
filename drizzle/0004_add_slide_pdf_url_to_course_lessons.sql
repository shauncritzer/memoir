-- Add slide_pdf_url column to course_lessons table
-- Created: 2026-01-27
-- Purpose: Store slideshow PDF URLs separately from workbook PDFs for 7-Day REWIRED Reset course

ALTER TABLE `course_lessons` 
ADD COLUMN `slide_pdf_url` VARCHAR(512) AFTER `workbook_pdf_url`;
