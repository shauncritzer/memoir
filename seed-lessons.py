#!/usr/bin/env python3
import mysql.connector
import os
from urllib.parse import urlparse

# Parse DATABASE_URL from environment
database_url = os.environ.get('DATABASE_URL')
if not database_url:
    print("❌ DATABASE_URL environment variable not set")
    exit(1)

# Parse the MySQL URL
# Format: mysql://user:password@host:port/database
parsed = urlparse(database_url)

# Connect to database
try:
    conn = mysql.connector.connect(
        host=parsed.hostname,
        port=parsed.port or 3306,
        user=parsed.username,
        password=parsed.password,
        database=parsed.path.lstrip('/')
    )
    cursor = conn.cursor()
    print("✅ Connected to database")
except Exception as e:
    print(f"❌ Failed to connect to database: {e}")
    exit(1)

# Cloudflare R2 base URL
R2_BASE = "https://pub-c6dbcc3c636f459ca30a6067b6dbc758.r2.dev"

# Lesson data
lessons = [
    {
        "productId": "7-day-reset",
        "dayNumber": 1,
        "title": "RECOGNIZE - Understanding Your Patterns",
        "description": "Learn to identify your behavioral patterns and understand the root causes of your addiction.",
        "videoUrl": f"{R2_BASE}/videos/REWIRED%20DAY%201.mp4",
        "slideshowUrl": f"{R2_BASE}/slideshows/Day_1_RECOGNIZE_-_Understanding_Your_Patterns.pdf",
        "workbookUrl": f"{R2_BASE}/workbooks/1_RECOGNIZE_Workbook.pdf",
        "durationMinutes": 45
    },
    {
        "productId": "7-day-reset",
        "dayNumber": 2,
        "title": "ESTABLISH - Safety & Connection",
        "description": "Build a foundation of safety and connection to support your recovery journey.",
        "videoUrl": f"{R2_BASE}/videos/REWIRED_DAY_2.mp4",
        "slideshowUrl": f"{R2_BASE}/slideshows/Day_2_ESTABLISH_-_Safety_%26_Connection.pdf",
        "workbookUrl": f"{R2_BASE}/workbooks/2_ESTABLISH_Workbook.pdf",
        "durationMinutes": 50
    },
    {
        "productId": "7-day-reset",
        "dayNumber": 3,
        "title": "WORK - Triggers as Teachers",
        "description": "Transform your triggers from obstacles into opportunities for growth and healing.",
        "videoUrl": f"{R2_BASE}/videos/Rewired_Day_3.mp4",
        "slideshowUrl": f"{R2_BASE}/slideshows/Day_3_WORK_-_Triggers_as_Teachers.pdf",
        "workbookUrl": f"{R2_BASE}/workbooks/3_WORK_Workbook.pdf",
        "durationMinutes": 55
    },
    {
        "productId": "7-day-reset",
        "dayNumber": 4,
        "title": "INTEGRATE - Building Sustainable Routines",
        "description": "Create daily routines and habits that support long-term recovery and well-being.",
        "videoUrl": f"{R2_BASE}/videos/Rewired_Day_4.mp4",
        "slideshowUrl": f"{R2_BASE}/slideshows/Day_4_INTEGRATE_-_Building_Sustainable_Routines.pdf",
        "workbookUrl": f"{R2_BASE}/workbooks/4_INTEGRATE_Workbook.pdf",
        "durationMinutes": 48
    },
    {
        "productId": "7-day-reset",
        "dayNumber": 5,
        "title": "RELEASE - Letting Go of Shame",
        "description": "Break free from shame and self-judgment to embrace self-compassion and healing.",
        "videoUrl": f"{R2_BASE}/videos/Welcome_everyone._This_is_Day_5_of_The_REWIRED_7-D.mp4",
        "slideshowUrl": f"{R2_BASE}/slideshows/Day_5_RELEASE_-_Letting_Go_of_Shame%20(1).pdf",
        "workbookUrl": f"{R2_BASE}/workbooks/5_RELEASE_Workbook.pdf",
        "durationMinutes": 52
    },
    {
        "productId": "7-day-reset",
        "dayNumber": 6,
        "title": "EMBRACE - Your New Identity",
        "description": "Step into your new identity as someone who is healing, growing, and thriving.",
        "videoUrl": f"{R2_BASE}/videos/Welcome_everyone._This_is_Day_6_of_The_REWIRED_7-D.mp4",
        "slideshowUrl": f"{R2_BASE}/slideshows/Day_6_EMBRACE_-_Your_New_Identity.pdf",
        "workbookUrl": f"{R2_BASE}/workbooks/6_EMBRACE_Workbook.pdf",
        "durationMinutes": 47
    },
    {
        "productId": "7-day-reset",
        "dayNumber": 7,
        "title": "DISCOVER - Your Purpose & Path Forward",
        "description": "Find your purpose and create a clear path forward for sustained recovery and growth.",
        "videoUrl": f"{R2_BASE}/videos/Welcome_everyone._This_is_Day_7_of_The_REWIRED_7-D.mp4",
        "slideshowUrl": f"{R2_BASE}/slideshows/Day_7_DISCOVER_-_Your_Purpose_%26_Path_Forward.pdf",
        "workbookUrl": f"{R2_BASE}/workbooks/7_DISCOVER_Workbook.pdf",
        "durationMinutes": 60
    }
]

print("🌱 Starting to seed 7-Day REWIRED Reset lessons...")

# Check for existing lessons
cursor.execute("SELECT COUNT(*) FROM lessons WHERE product_id = '7-day-reset'")
count = cursor.fetchone()[0]

if count > 0:
    print(f"⚠️  Found {count} existing lessons for 7-day-reset")
    print("   Deleting existing lessons to avoid duplicates...")
    cursor.execute("DELETE FROM lessons WHERE product_id = '7-day-reset'")
    conn.commit()
    print("✅ Deleted existing lessons")

# Insert lessons
print(f"📝 Inserting {len(lessons)} lessons...")

insert_query = """
INSERT INTO lessons (product_id, day_number, title, description, video_url, slideshow_url, workbook_url, duration_minutes)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
"""

for lesson in lessons:
    cursor.execute(insert_query, (
        lesson["productId"],
        lesson["dayNumber"],
        lesson["title"],
        lesson["description"],
        lesson["videoUrl"],
        lesson["slideshowUrl"],
        lesson["workbookUrl"],
        lesson["durationMinutes"]
    ))
    print(f"   ✓ Day {lesson['dayNumber']}: {lesson['title']}")

conn.commit()

print("\n✅ Successfully seeded all 7 lessons!")
print("\n📊 Summary:")
print(f"   Product ID: 7-day-reset")
print(f"   Total Lessons: {len(lessons)}")
print(f"   Total Duration: {sum(l['durationMinutes'] for l in lessons)} minutes")
print("\n🎉 Course content is now ready!")

cursor.close()
conn.close()
