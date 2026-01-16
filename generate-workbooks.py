#!/usr/bin/env python3
"""
Generate 7-Day Reset Workbook PDFs
Creates professional workbooks for each day with exercises and reflection prompts
"""

from fpdf import FPDF
import os

class WorkbookPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=15)
        
    def header(self):
        self.set_font('Arial', 'B', 10)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, 'REWIRED 7-Day Reset Workbook', 0, 1, 'C')
        self.ln(5)
        
    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')
    
    def add_title(self, title):
        self.set_font('Arial', 'B', 24)
        self.set_text_color(0, 128, 128)
        self.cell(0, 15, title, 0, 1, 'L')
        self.ln(5)
    
    def add_section(self, title):
        self.set_font('Arial', 'B', 16)
        self.set_text_color(0, 0, 0)
        self.cell(0, 10, title, 0, 1, 'L')
        self.ln(3)
    
    def add_text(self, text):
        self.set_font('Arial', '', 11)
        self.set_text_color(0, 0, 0)
        self.multi_cell(0, 6, text)
        self.ln(3)
    
    def add_prompt(self, prompt):
        self.set_font('Arial', 'I', 11)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 6, prompt)
        self.ln(2)
    
    def add_writing_space(self, lines=5):
        for i in range(lines):
            self.cell(0, 8, '', 'B', 1)
        self.ln(3)

# Day 1: RECOGNIZE
def create_day1_workbook():
    pdf = WorkbookPDF()
    pdf.add_page()
    
    pdf.add_title("Day 1: RECOGNIZE")
    pdf.add_text("Understanding Your Patterns, Triggers, and Rock Bottom")
    pdf.ln(5)
    
    pdf.add_section("Today's Focus")
    pdf.add_text("We can't change what we don't acknowledge. Today is about getting honest with yourself - without shame - about the patterns that have been running your life.")
    pdf.ln(5)
    
    pdf.add_section("Exercise 1: Identify Your Patterns")
    pdf.add_prompt("What are the automatic behaviors you engage in when you're stressed, lonely, or overwhelmed?")
    pdf.add_writing_space(6)
    
    pdf.add_section("Exercise 2: Recognize Your Triggers")
    pdf.add_prompt("What situations, people, or emotions consistently lead you toward your addictive behavior?")
    pdf.add_writing_space(6)
    
    pdf.add_page()
    pdf.add_section("Exercise 3: Your Rock Bottom")
    pdf.add_prompt("Describe your rock bottom moment. What brought you here? (This is not to punish yourself, but to see clearly.)")
    pdf.add_writing_space(8)
    
    pdf.add_section("Today's Action Step")
    pdf.add_text("Share one pattern or trigger with someone you trust. Speaking it out loud breaks its power over you.")
    pdf.add_writing_space(4)
    
    pdf.output("/home/ubuntu/shauncritzer/client/public/workbooks/Day_1_RECOGNIZE_Workbook.pdf")

# Day 2: ESTABLISH
def create_day2_workbook():
    pdf = WorkbookPDF()
    pdf.add_page()
    
    pdf.add_title("Day 2: ESTABLISH")
    pdf.add_text("Building Safety, Connection, and Support")
    pdf.ln(5)
    
    pdf.add_section("Today's Focus")
    pdf.add_text("The opposite of addiction is connection. Today, we establish safety in your environment and build a network of support.")
    pdf.ln(5)
    
    pdf.add_section("Exercise 1: Your Safe People")
    pdf.add_prompt("List the people who make you feel safe, seen, and understood:")
    pdf.add_writing_space(6)
    
    pdf.add_section("Exercise 2: Your Unsafe People")
    pdf.add_prompt("List the people who drain your energy or trigger your addictive behaviors:")
    pdf.add_writing_space(6)
    
    pdf.add_page()
    pdf.add_section("Exercise 3: Create Your Sanctuary")
    pdf.add_prompt("What changes can you make to your physical environment to feel safer and more at peace?")
    pdf.add_writing_space(6)
    
    pdf.add_section("Today's Action Step")
    pdf.add_text("Reach out to one safe person. Send a text, make a call, or schedule a coffee. Connection is medicine.")
    pdf.add_writing_space(4)
    
    pdf.output("/home/ubuntu/shauncritzer/client/public/workbooks/Day_2_ESTABLISH_Workbook.pdf")

# Day 3: WORK
def create_day3_workbook():
    pdf = WorkbookPDF()
    pdf.add_page()
    
    pdf.add_title("Day 3: WORK")
    pdf.add_text("Turning Toward Your Triggers")
    pdf.ln(5)
    
    pdf.add_section("Today's Focus")
    pdf.add_text("Triggers are not the enemy - they are messengers. Today, we learn to work with difficult emotions instead of running from them.")
    pdf.ln(5)
    
    pdf.add_section("The RAIN Practice")
    pdf.add_text("R - Recognize: What am I feeling right now?")
    pdf.add_text("A - Allow: Can I let this feeling be here without judgment?")
    pdf.add_text("I - Investigate: Where is this in my body? What does it need?")
    pdf.add_text("N - Nurture: How can I show myself compassion right now?")
    pdf.ln(5)
    
    pdf.add_section("Exercise 1: Practice RAIN")
    pdf.add_prompt("Think of a recent trigger. Walk through the RAIN practice:")
    pdf.add_writing_space(8)
    
    pdf.add_page()
    pdf.add_section("Exercise 2: Your Trigger Map")
    pdf.add_prompt("What are your triggers trying to tell you? (e.g., 'I'm lonely,' 'I need rest,' 'A boundary was crossed')")
    pdf.add_writing_space(6)
    
    pdf.add_section("Today's Action Step")
    pdf.add_text("The next time a craving or difficult emotion arises, pause. Use the RAIN practice before reacting.")
    pdf.add_writing_space(4)
    
    pdf.output("/home/ubuntu/shauncritzer/client/public/workbooks/Day_3_WORK_Workbook.pdf")

# Day 4: INTEGRATE
def create_day4_workbook():
    pdf = WorkbookPDF()
    pdf.add_page()
    
    pdf.add_title("Day 4: INTEGRATE")
    pdf.add_text("Building a Sustainable Recovery Routine")
    pdf.ln(5)
    
    pdf.add_section("Today's Focus")
    pdf.add_text("Recovery is not an event - it is a daily practice. Today, we integrate healthy habits into your life.")
    pdf.ln(5)
    
    pdf.add_section("Exercise 1: Your Morning Routine")
    pdf.add_prompt("What 3 things can you do each morning to start your day grounded and centered?")
    pdf.add_writing_space(6)
    
    pdf.add_section("Exercise 2: Your Evening Routine")
    pdf.add_prompt("What 3 things can you do each evening to wind down and reflect?")
    pdf.add_writing_space(6)
    
    pdf.add_page()
    pdf.add_section("Exercise 3: Your Non-Negotiables")
    pdf.add_prompt("What are 3-5 daily practices that support your recovery? (e.g., meditation, meetings, journaling, exercise)")
    pdf.add_writing_space(6)
    
    pdf.add_section("Today's Action Step")
    pdf.add_text("Commit to one new habit today. Start small. Consistency beats intensity.")
    pdf.add_writing_space(4)
    
    pdf.output("/home/ubuntu/shauncritzer/client/public/workbooks/Day_4_INTEGRATE_Workbook.pdf")

# Day 5: REWIRE
def create_day5_workbook():
    pdf = WorkbookPDF()
    pdf.add_page()
    
    pdf.add_title("Day 5: REWIRE")
    pdf.add_text("Rewriting Your Story and Identity")
    pdf.ln(5)
    
    pdf.add_section("Today's Focus")
    pdf.add_text("You are not your addiction. Today, we begin to rewire your identity and reclaim who you really are.")
    pdf.ln(5)
    
    pdf.add_section("Exercise 1: Your Old Story")
    pdf.add_prompt("What story have you been telling yourself about who you are? (e.g., 'I'm broken,' 'I'm weak,' 'I always fail')")
    pdf.add_writing_space(6)
    
    pdf.add_section("Exercise 2: Your New Story")
    pdf.add_prompt("Who do you want to become? Write a new story about yourself in the present tense. (e.g., 'I am resilient,' 'I am worthy of love')")
    pdf.add_writing_space(8)
    
    pdf.add_page()
    pdf.add_section("Exercise 3: Evidence of Your New Identity")
    pdf.add_prompt("List 5 pieces of evidence that prove your new story is already true:")
    pdf.add_writing_space(6)
    
    pdf.add_section("Today's Action Step")
    pdf.add_text("Read your new story out loud every morning this week. Repetition rewires the brain.")
    pdf.add_writing_space(4)
    
    pdf.output("/home/ubuntu/shauncritzer/client/public/workbooks/Day_5_REWIRE_Workbook.pdf")

# Day 6: ENGAGE
def create_day6_workbook():
    pdf = WorkbookPDF()
    pdf.add_page()
    
    pdf.add_title("Day 6: ENGAGE")
    pdf.add_text("Finding Purpose and Meaning")
    pdf.ln(5)
    
    pdf.add_section("Today's Focus")
    pdf.add_text("Recovery is not just about stopping something - it is about starting something new. Today, we engage with purpose.")
    pdf.ln(5)
    
    pdf.add_section("Exercise 1: Your Values")
    pdf.add_prompt("What matters most to you? (e.g., family, creativity, service, growth)")
    pdf.add_writing_space(6)
    
    pdf.add_section("Exercise 2: Your Gifts")
    pdf.add_prompt("What are you naturally good at? What do people come to you for?")
    pdf.add_writing_space(6)
    
    pdf.add_page()
    pdf.add_section("Exercise 3: Your Contribution")
    pdf.add_prompt("How can you use your gifts to serve others or contribute to something bigger than yourself?")
    pdf.add_writing_space(6)
    
    pdf.add_section("Today's Action Step")
    pdf.add_text("Take one small step toward engaging with your purpose. Volunteer, create something, or help someone.")
    pdf.add_writing_space(4)
    
    pdf.output("/home/ubuntu/shauncritzer/client/public/workbooks/Day_6_ENGAGE_Workbook.pdf")

# Day 7: DISCOVER
def create_day7_workbook():
    pdf = WorkbookPDF()
    pdf.add_page()
    
    pdf.add_title("Day 7: DISCOVER")
    pdf.add_text("Celebrating Progress and Looking Forward")
    pdf.ln(5)
    
    pdf.add_section("Today's Focus")
    pdf.add_text("You've made it through 7 days. Today, we celebrate your progress and discover what's next.")
    pdf.ln(5)
    
    pdf.add_section("Exercise 1: Your Wins")
    pdf.add_prompt("What are 5 things you're proud of from this week?")
    pdf.add_writing_space(6)
    
    pdf.add_section("Exercise 2: Your Lessons")
    pdf.add_prompt("What did you learn about yourself this week?")
    pdf.add_writing_space(6)
    
    pdf.add_page()
    pdf.add_section("Exercise 3: Your Next Steps")
    pdf.add_prompt("What are 3 commitments you're making to yourself moving forward?")
    pdf.add_writing_space(6)
    
    pdf.add_section("Exercise 4: Your Letter to Future You")
    pdf.add_prompt("Write a letter to yourself 30 days from now. What do you want to remember? What do you hope to achieve?")
    pdf.add_writing_space(8)
    
    pdf.add_section("Closing Reflection")
    pdf.add_text("Recovery is not a destination - it is a daily practice. You have proven to yourself that you can do this. One day at a time. Keep going.")
    
    pdf.output("/home/ubuntu/shauncritzer/client/public/workbooks/Day_7_DISCOVER_Workbook.pdf")

if __name__ == "__main__":
    # Create workbooks directory
    os.makedirs("/home/ubuntu/shauncritzer/client/public/workbooks", exist_ok=True)
    
    print("Generating 7-Day Reset Workbooks...")
    create_day1_workbook()
    print("✓ Day 1: RECOGNIZE")
    create_day2_workbook()
    print("✓ Day 2: ESTABLISH")
    create_day3_workbook()
    print("✓ Day 3: WORK")
    create_day4_workbook()
    print("✓ Day 4: INTEGRATE")
    create_day5_workbook()
    print("✓ Day 5: REWIRE")
    create_day6_workbook()
    print("✓ Day 6: ENGAGE")
    create_day7_workbook()
    print("✓ Day 7: DISCOVER")
    print("\n✅ All workbooks generated successfully!")
