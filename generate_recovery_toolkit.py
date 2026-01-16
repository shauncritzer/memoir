#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

def create_recovery_toolkit_pdf():
    """Generate the Recovery Toolkit PDF with proper UTF-8 encoding"""
    
    # Create PDF
    pdf_file = "client/public/recovery-toolkit.pdf"
    doc = SimpleDocTemplate(pdf_file, pagesize=letter,
                           rightMargin=0.75*inch, leftMargin=0.75*inch,
                           topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#333333'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    heading2_style = ParagraphStyle(
        'CustomHeading2',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=12,
        spaceBefore=20,
        fontName='Helvetica-Bold'
    )
    
    heading3_style = ParagraphStyle(
        'CustomHeading3',
        parent=styles['Heading3'],
        fontSize=13,
        textColor=colors.HexColor('#333333'),
        spaceAfter=10,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=11,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=10,
        leading=16,
        fontName='Helvetica'
    )
    
    # Title Page
    elements.append(Spacer(1, 1*inch))
    elements.append(Paragraph("The Recovery Toolkit", title_style))
    elements.append(Paragraph("Practical Worksheets for Your Journey", subtitle_style))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("By Shaun Critzer", subtitle_style))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("A collection of tools, exercises, and resources to support your recovery journey—whether you're in active addiction, early recovery, or supporting someone who is.", body_style))
    
    elements.append(PageBreak())
    
    # Introduction
    elements.append(Paragraph("Introduction", heading2_style))
    elements.append(Paragraph("Recovery isn't just about not drinking or using. It's about becoming whole. It's about processing trauma, building authentic relationships, and creating a life worth staying sober for.", body_style))
    elements.append(Paragraph("This toolkit contains practical exercises I've used in my own recovery and with others I've mentored. These aren't magic solutions—they're tools. And like any tool, they only work if you use them.", body_style))
    
    elements.append(Paragraph("<b>What's inside:</b>", body_style))
    elements.append(Paragraph("• Daily Recovery Check-In", body_style))
    elements.append(Paragraph("• Trigger Identification Worksheet", body_style))
    elements.append(Paragraph("• Gratitude Practice Template", body_style))
    elements.append(Paragraph("• Amends Planning Guide", body_style))
    elements.append(Paragraph("• Inner Child Healing Exercise", body_style))
    elements.append(Paragraph("• Emergency Contact Card", body_style))
    elements.append(Paragraph("• Recovery Milestone Tracker", body_style))
    
    elements.append(PageBreak())
    
    # Daily Recovery Check-In
    elements.append(Paragraph("Daily Recovery Check-In", heading2_style))
    elements.append(Paragraph("Use this every morning to set intentions and every evening to reflect.", body_style))
    
    elements.append(Paragraph("<b>Morning Check-In:</b>", heading3_style))
    elements.append(Paragraph("☐ Did I get enough sleep? (6-8 hours)", body_style))
    elements.append(Paragraph("☐ Am I physically safe today?", body_style))
    elements.append(Paragraph("☐ What am I grateful for right now?", body_style))
    elements.append(Paragraph("☐ What's one thing I can do today to support my recovery?", body_style))
    elements.append(Paragraph("☐ Who can I reach out to if I struggle today?", body_style))
    elements.append(Paragraph("☐ What's my intention for today?", body_style))
    
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("<b>Evening Reflection:</b>", heading3_style))
    elements.append(Paragraph("☐ Did I stay sober today?", body_style))
    elements.append(Paragraph("☐ What went well today?", body_style))
    elements.append(Paragraph("☐ What challenged me today?", body_style))
    elements.append(Paragraph("☐ Did I use my tools when I needed them?", body_style))
    elements.append(Paragraph("☐ What am I grateful for from today?", body_style))
    elements.append(Paragraph("☐ What's one thing I learned about myself today?", body_style))
    
    elements.append(PageBreak())
    
    # Trigger Identification Worksheet
    elements.append(Paragraph("Trigger Identification Worksheet", heading2_style))
    elements.append(Paragraph("Understanding your triggers is the first step to managing them.", body_style))
    
    elements.append(Paragraph("<b>People Triggers</b>", heading3_style))
    elements.append(Paragraph("Who are the people that trigger cravings or negative emotions?", body_style))
    elements.append(Paragraph("1. _____________________________________________", body_style))
    elements.append(Paragraph("2. _____________________________________________", body_style))
    elements.append(Paragraph("3. _____________________________________________", body_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("What is it about these people that triggers you?", body_style))
    elements.append(Paragraph("_________________________________________________", body_style))
    
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("<b>Place Triggers</b>", heading3_style))
    elements.append(Paragraph("What locations trigger cravings or negative emotions?", body_style))
    elements.append(Paragraph("1. _____________________________________________", body_style))
    elements.append(Paragraph("2. _____________________________________________", body_style))
    elements.append(Paragraph("3. _____________________________________________", body_style))
    
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("<b>Emotional Triggers</b>", heading3_style))
    elements.append(Paragraph("What emotions make you want to use or engage in old behaviors?", body_style))
    elements.append(Paragraph("☐ Anger  ☐ Loneliness  ☐ Stress  ☐ Boredom  ☐ Shame  ☐ Fear  ☐ Joy/Celebration", body_style))
    
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("<b>Your Action Plan</b>", heading3_style))
    elements.append(Paragraph("For each trigger category, write one healthy coping strategy:", body_style))
    elements.append(Paragraph("<b>When triggered by people:</b> ______________________", body_style))
    elements.append(Paragraph("<b>When triggered by places:</b> ______________________", body_style))
    elements.append(Paragraph("<b>When triggered by emotions:</b> ____________________", body_style))
    
    elements.append(PageBreak())
    
    # Gratitude Practice
    elements.append(Paragraph("Gratitude Practice Template", heading2_style))
    elements.append(Paragraph("Research shows gratitude rewires the brain for positivity and resilience.", body_style))
    
    elements.append(Paragraph("<b>Daily Gratitude (Use this every day)</b>", heading3_style))
    elements.append(Paragraph("<b>Today's Date:</b> _______________", body_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("<b>Three things I'm grateful for today:</b>", body_style))
    elements.append(Paragraph("1. _______________________________________________", body_style))
    elements.append(Paragraph("2. _______________________________________________", body_style))
    elements.append(Paragraph("3. _______________________________________________", body_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("<b>One person I'm grateful for and why:</b>", body_style))
    elements.append(Paragraph("_________________________________________________", body_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("<b>One thing about my recovery I'm grateful for:</b>", body_style))
    elements.append(Paragraph("_________________________________________________", body_style))
    
    elements.append(PageBreak())
    
    # Amends Planning Guide
    elements.append(Paragraph("Amends Planning Guide", heading2_style))
    elements.append(Paragraph("Making amends is about taking responsibility and repairing relationships—when appropriate.", body_style))
    
    elements.append(Paragraph("<b>Important Notes Before You Begin:</b>", heading3_style))
    elements.append(Paragraph("• Not all amends require direct contact", body_style))
    elements.append(Paragraph("• Some amends would cause more harm than good", body_style))
    elements.append(Paragraph("• Timing matters—don't rush this process", body_style))
    elements.append(Paragraph("• Work with a sponsor or therapist on this", body_style))
    
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("<b>Person I Want to Make Amends To:</b>", body_style))
    elements.append(Paragraph("Name: ____________________________________________", body_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("<b>What I Did That Caused Harm:</b>", body_style))
    elements.append(Paragraph("_________________________________________________", body_style))
    elements.append(Paragraph("_________________________________________________", body_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("<b>How It Affected Them:</b>", body_style))
    elements.append(Paragraph("_________________________________________________", body_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("<b>What I Want to Say (Draft):</b>", body_style))
    elements.append(Paragraph("_________________________________________________", body_style))
    elements.append(Paragraph("_________________________________________________", body_style))
    
    elements.append(PageBreak())
    
    # Inner Child Healing
    elements.append(Paragraph("Inner Child Healing Exercise", heading2_style))
    elements.append(Paragraph("Much of our addiction stems from childhood wounds. This exercise helps you connect with and heal your inner child.", body_style))
    
    elements.append(Paragraph("<b>Step 1: Find a Quiet Space</b>", heading3_style))
    elements.append(Paragraph("Set aside 15-20 minutes where you won't be interrupted.", body_style))
    
    elements.append(Paragraph("<b>Step 2: Visualize Your Younger Self</b>", heading3_style))
    elements.append(Paragraph("Close your eyes. Picture yourself as a child—whatever age feels right. What are you wearing? Where are you? What do you look like?", body_style))
    
    elements.append(Paragraph("<b>Step 3: Ask Questions</b>", heading3_style))
    elements.append(Paragraph("Imagine sitting down with this younger version of yourself. Ask:", body_style))
    elements.append(Paragraph("• What do you need right now?", body_style))
    elements.append(Paragraph("• What are you afraid of?", body_style))
    elements.append(Paragraph("• What do you want me to know?", body_style))
    
    elements.append(Paragraph("<b>Step 4: Offer Comfort</b>", heading3_style))
    elements.append(Paragraph("What does your inner child need to hear? Write it here:", body_style))
    elements.append(Paragraph("Dear younger me,", body_style))
    elements.append(Paragraph("_________________________________________________", body_style))
    elements.append(Paragraph("_________________________________________________", body_style))
    
    elements.append(Paragraph("<b>Step 5: Make a Promise</b>", heading3_style))
    elements.append(Paragraph("What can you promise your inner child?", body_style))
    elements.append(Paragraph("My promise: _______________________________________", body_style))
    
    elements.append(PageBreak())
    
    # Emergency Contact Card
    elements.append(Paragraph("Emergency Contact Card", heading2_style))
    elements.append(Paragraph("Print this, fill it out, and keep it in your wallet.", body_style))
    
    # Create a box for the emergency card
    card_data = [
        ['EMERGENCY RECOVERY CONTACTS'],
        [''],
        ['Sponsor: ______________________________'],
        ['Phone: ________________________________'],
        [''],
        ['Therapist: ____________________________'],
        ['Phone: ________________________________'],
        [''],
        ['Accountability Partner: _______________'],
        ['Phone: ________________________________'],
        [''],
        ['Crisis Hotline: 988'],
        ['SAMHSA: 1-800-662-4357'],
        [''],
        ['My Sobriety Date: _____________________'],
        [''],
        ['I am ____ days sober and I\'m not'],
        ['throwing that away. I will call someone'],
        ['before I use.']
    ]
    
    card_table = Table(card_data, colWidths=[5*inch])
    card_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOX', (0, 0), (-1, -1), 2, colors.black),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0f0f0')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
    ]))
    
    elements.append(card_table)
    
    elements.append(PageBreak())
    
    # Recovery Milestone Tracker
    elements.append(Paragraph("Recovery Milestone Tracker", heading2_style))
    elements.append(Paragraph("Celebrate your progress. Every day counts.", body_style))
    
    milestone_data = [
        ['Milestone', 'Date Achieved', 'How I Celebrated'],
        ['24 Hours', '', ''],
        ['1 Week', '', ''],
        ['30 Days', '', ''],
        ['60 Days', '', ''],
        ['90 Days', '', ''],
        ['6 Months', '', ''],
        ['1 Year', '', ''],
        ['18 Months', '', ''],
        ['2 Years', '', ''],
        ['5 Years', '', ''],
        ['10 Years', '', '']
    ]
    
    milestone_table = Table(milestone_data, colWidths=[1.5*inch, 1.75*inch, 2.5*inch])
    milestone_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0f0f0')),
    ]))
    
    elements.append(milestone_table)
    
    elements.append(PageBreak())
    
    # Additional Resources
    elements.append(Paragraph("Additional Resources", heading2_style))
    
    elements.append(Paragraph("<b>Books That Helped Me:</b>", heading3_style))
    elements.append(Paragraph("• <i>The Body Keeps the Score</i> by Bessel van der Kolk", body_style))
    elements.append(Paragraph("• <i>Alcoholics Anonymous</i> (The Big Book)", body_style))
    elements.append(Paragraph("• <i>Twelve Steps and Twelve Traditions</i>", body_style))
    elements.append(Paragraph("• <i>Getting Past Your Past</i> by Francine Shapiro (EMDR)", body_style))
    
    elements.append(Paragraph("<b>Therapy Modalities That Work:</b>", heading3_style))
    elements.append(Paragraph("• EMDR (Eye Movement Desensitization and Reprocessing)", body_style))
    elements.append(Paragraph("• CBT (Cognitive Behavioral Therapy)", body_style))
    elements.append(Paragraph("• Trauma-Focused Therapy", body_style))
    elements.append(Paragraph("• Group Therapy", body_style))
    
    elements.append(Paragraph("<b>Support Groups:</b>", heading3_style))
    elements.append(Paragraph("• Alcoholics Anonymous (AA)", body_style))
    elements.append(Paragraph("• Narcotics Anonymous (NA)", body_style))
    elements.append(Paragraph("• SMART Recovery", body_style))
    elements.append(Paragraph("• Celebrate Recovery", body_style))
    
    elements.append(Spacer(1, 0.3*inch))
    
    # Final Thoughts
    elements.append(Paragraph("Final Thoughts", heading2_style))
    elements.append(Paragraph("Recovery is possible. I'm living proof.", body_style))
    elements.append(Paragraph("Thirteen years ago, I was in psych wards, facing protective orders, losing my kids, and wanting to die. Today, I have a life beyond my wildest dreams—not because I'm special, but because I did the work.", body_style))
    elements.append(Paragraph("You can too.", body_style))
    elements.append(Paragraph("One day at a time.", body_style))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("— Shaun Critzer", body_style))
    
    elements.append(Spacer(1, 0.3*inch))
    
    # Get More Support
    elements.append(Paragraph("Get More Support", heading2_style))
    elements.append(Paragraph("<b>Visit www.shauncritzer.com for:</b>", body_style))
    elements.append(Paragraph("• The full memoir \"Crooked Lines: Bent, Not Broken\"", body_style))
    elements.append(Paragraph("• Recovery courses and community", body_style))
    elements.append(Paragraph("• Weekly blog posts and videos", body_style))
    elements.append(Paragraph("• Free resources and tools", body_style))
    
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("Copyright © 2025 by Shaun Critzer. All rights reserved.", body_style))
    elements.append(Paragraph("You are welcome to print and use these worksheets for personal use or share them with others who might benefit. Please do not sell or modify this content.", body_style))
    
    # Build PDF
    doc.build(elements)
    print(f"PDF created successfully: {pdf_file}")

if __name__ == "__main__":
    create_recovery_toolkit_pdf()
