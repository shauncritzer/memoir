# 7-Day Reset Course Implementation
## January 16, 2026

## Current State
✅ Project synced with live Railway deployment (GitHub main branch)
✅ REWIRED Method page exists and working
✅ Navigation component with mobile hamburger menu exists
✅ All video scripts written (in products/rewired_7_day_reset_video_scripts.md)

## Assets Available
- 7 video files (Day 1-7) - uploaded to /home/ubuntu/upload/
- 7 PDF slide decks - uploaded to /home/ubuntu/upload/
- Living Sober PDF (to become "Thriving Sober" page) - uploaded
- Video scripts with suggested actions per day

## Tasks to Complete

### Phase 1: Upload Assets to S3
- [x] Upload all 7 Day videos to S3 (completed 12 hours ago)
- [x] Upload all 7 Day PDF slide decks to S3 (completed 12 hours ago)
- [x] Upload Living Sober PDF to S3 (completed 12 hours ago)

### Phase 2: Create Thriving Sober Page
- [x] Convert Living Sober PDF content to attractive HTML page
- [x] Title: "Thriving Sober: 50 Suggestions"
- [x] Add to navigation and Products page

### Phase 3: Build Course Delivery System
- [x] Create course database schema (modules, lessons, progress tracking)
- [x] Seed database with 7-Day Reset course data
- [x] Build course member area page with:
  - Video player (S3/CloudFront streaming)
  - Lesson navigation sidebar
  - Progress tracking (mark lessons complete)
  - Downloadable PDF slide decks per lesson
  - Access control (requires purchase)

### Phase 4: Create Workbooks
- [x] Day 1 workbook (based on RECOGNIZE script + slides)
- [x] Day 2 workbook (based on EVALUATE script + slides)
- [x] Day 3 workbook (based on WITHDRAW script + slides)
- [x] Day 4 workbook (based on IDENTIFY script + slides)
- [x] Day 5 workbook (based on REWIRE script + slides)
- [x] Day 6 workbook (based on ENGAGE script + slides)
- [x] Day 7 workbook (based on DISCOVER script + slides)
- [x] Make workbooks downloadable from course page

### Phase 5: Testing & Deployment
- [ ] Test video playback
- [ ] Test progress tracking
- [ ] Test PDF downloads
- [ ] Test purchase flow → course access
- [ ] Push to GitHub memoir repo
- [ ] Verify Railway auto-deployment

## Notes
- Course is PAID product ($27) - requires completed purchase to access
- Videos are 6-10 minutes each
- Each day includes: video + PDF slides + workbook + suggested actions
- Thriving Sober (50 suggestions) is bonus content included with course
