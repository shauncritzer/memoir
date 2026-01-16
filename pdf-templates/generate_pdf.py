#!/usr/bin/env python3
"""
Professional PDF Generator for REWIRED Resources
Uses WeasyPrint to convert HTML templates to beautiful PDFs
"""

from weasyprint import HTML, CSS
from jinja2 import Template
import os
import sys

def generate_pdf(title, subtitle, content_html, output_path):
    """
    Generate a professional PDF from HTML content using REWIRED template
    
    Args:
        title: PDF title
        subtitle: Subtitle shown in header
        content_html: Main content HTML
        output_path: Where to save the PDF
    """
    
    # Load template
    template_path = os.path.join(os.path.dirname(__file__), 'rewired-template.html')
    with open(template_path, 'r') as f:
        template_content = f.read()
    
    # Render template with content
    template = Template(template_content)
    html_content = template.render(
        title=title,
        subtitle=subtitle,
        content=content_html
    )
    
    # Generate PDF
    HTML(string=html_content).write_pdf(output_path)
    print(f"✓ PDF generated: {output_path}")
    return output_path


def generate_rewired_relief_toolkit():
    """Generate the REWIRED Relief Toolkit PDF"""
    
    content = """
    <h1>REWIRED Relief Toolkit</h1>
    <p class="lead">A crisis-focused guide to regulating your nervous system when you need it most.</p>
    
    <div class="section-box">
        <h3>What Is This Toolkit?</h3>
        <p>This is your emergency toolkit for moments of crisis, overwhelm, or intense dysregulation. When you're spiraling, when the urge to use is overwhelming, when you feel like you're losing control—these are the tools that can help you find your way back to safety.</p>
    </div>
    
    <h2>Understanding Your Nervous System</h2>
    <p>Your nervous system has three main states:</p>
    
    <ul>
        <li><strong>Ventral Vagal (Safe & Social):</strong> Calm, connected, grounded</li>
        <li><strong>Sympathetic (Fight or Flight):</strong> Anxious, panicked, activated</li>
        <li><strong>Dorsal Vagal (Freeze/Shutdown):</strong> Numb, disconnected, collapsed</li>
    </ul>
    
    <p>When you're in crisis, you're stuck in sympathetic or dorsal vagal. The goal is to gently guide yourself back to ventral vagal—to safety.</p>
    
    <div class="page-break"></div>
    
    <h2>Tool #1: The 5-4-3-2-1 Grounding Technique</h2>
    <p>This technique brings you back to the present moment by engaging your senses.</p>
    
    <div class="exercise-box">
        <h4>How to Do It:</h4>
        <ol>
            <li><strong>5 things you can SEE</strong> - Look around and name them out loud</li>
            <li><strong>4 things you can TOUCH</strong> - Feel the texture, temperature</li>
            <li><strong>3 things you can HEAR</strong> - Notice sounds near and far</li>
            <li><strong>2 things you can SMELL</strong> - Even subtle scents count</li>
            <li><strong>1 thing you can TASTE</strong> - Notice the taste in your mouth</li>
        </ol>
    </div>
    
    <div class="tip-box">
        Say each one out loud if possible. The act of speaking engages your prefrontal cortex and helps regulate your nervous system.
    </div>
    
    <h2>Tool #2: Box Breathing</h2>
    <p>This simple breathing pattern activates your vagus nerve and shifts you out of fight-or-flight.</p>
    
    <div class="exercise-box">
        <h4>How to Do It:</h4>
        <ol>
            <li>Inhale through your nose for 4 counts</li>
            <li>Hold your breath for 4 counts</li>
            <li>Exhale through your mouth for 4 counts</li>
            <li>Hold empty for 4 counts</li>
            <li>Repeat for 5-10 cycles</li>
        </ol>
    </div>
    
    <h2>Tool #3: The TIPP Skill</h2>
    <p>TIPP stands for Temperature, Intense exercise, Paced breathing, Paired muscle relaxation. These are rapid interventions for intense emotional distress.</p>
    
    <table>
        <tr>
            <th>Technique</th>
            <th>How It Works</th>
            <th>How to Do It</th>
        </tr>
        <tr>
            <td><strong>Temperature</strong></td>
            <td>Cold water activates the dive reflex, rapidly calming your nervous system</td>
            <td>Splash cold water on your face, hold ice cubes, take a cold shower</td>
        </tr>
        <tr>
            <td><strong>Intense Exercise</strong></td>
            <td>Burns off adrenaline and cortisol</td>
            <td>Do 20 jumping jacks, run in place, do push-ups until you're tired</td>
        </tr>
        <tr>
            <td><strong>Paced Breathing</strong></td>
            <td>Slows heart rate and activates parasympathetic system</td>
            <td>Breathe in for 4, out for 6. Make exhale longer than inhale.</td>
        </tr>
        <tr>
            <td><strong>Paired Muscle Relaxation</strong></td>
            <td>Releases physical tension stored in the body</td>
            <td>Tense each muscle group for 5 seconds, then release. Start with feet, move up.</td>
        </tr>
    </table>
    
    <div class="page-break"></div>
    
    <h2>Tool #4: The Self-Compassion Break</h2>
    <p>In moments of crisis, shame and self-judgment make everything worse. This practice interrupts that cycle.</p>
    
    <div class="exercise-box">
        <h4>Say These Words (Out Loud or Silently):</h4>
        <blockquote>
            <p>"This is a moment of suffering."</p>
            <p>"Suffering is part of being human."</p>
            <p>"May I be kind to myself in this moment."</p>
            <p>"May I give myself the compassion I need."</p>
        </blockquote>
        <p>Place your hand on your heart as you say these words. This simple gesture activates your caregiving system.</p>
    </div>
    
    <h2>Tool #5: The Emergency Contact List</h2>
    <p>You don't have to do this alone. Having a pre-made list prevents you from having to think when you're in crisis.</p>
    
    <div class="highlight-box">
        <h4>Fill This Out Now (While You're Calm):</h4>
        <ul class="checklist">
            <li>Trusted friend or sponsor: ___________________________</li>
            <li>Therapist or counselor: ___________________________</li>
            <li>Crisis hotline (988 Suicide & Crisis Lifeline): 988</li>
            <li>Local support group contact: ___________________________</li>
            <li>Safe person who understands recovery: ___________________________</li>
        </ul>
    </div>
    
    <h2>Tool #6: The "Ride the Wave" Technique</h2>
    <p>Cravings and intense emotions come in waves. They peak and then they pass. You don't have to act on them.</p>
    
    <div class="exercise-box">
        <h4>How to Ride the Wave:</h4>
        <ol>
            <li><strong>Notice the urge</strong> - "I'm having the urge to use/act out."</li>
            <li><strong>Don't judge it</strong> - "This is my nervous system trying to regulate."</li>
            <li><strong>Observe it</strong> - Where do you feel it in your body? What does it feel like?</li>
            <li><strong>Breathe through it</strong> - Use box breathing or paced breathing.</li>
            <li><strong>Wait 10 minutes</strong> - Set a timer. The peak will pass.</li>
        </ol>
    </div>
    
    <div class="tip-box">
        Most intense urges peak within 15-20 minutes. If you can ride it out, it will pass.
    </div>
    
    <div class="page-break"></div>
    
    <h2>Putting It All Together: Your Crisis Action Plan</h2>
    <p>When you're in crisis, decision-making is impaired. Having a step-by-step plan removes the need to think.</p>
    
    <div class="section-box">
        <h3>Step 1: Recognize</h3>
        <p>"I'm dysregulated. My nervous system is in survival mode. This will pass."</p>
        
        <h3>Step 2: Ground</h3>
        <p>Use 5-4-3-2-1 grounding or box breathing.</p>
        
        <h3>Step 3: Intervene</h3>
        <p>Choose one TIPP technique (cold water is fastest).</p>
        
        <h3>Step 4: Connect</h3>
        <p>Call someone from your emergency contact list or use the self-compassion break.</p>
        
        <h3>Step 5: Wait</h3>
        <p>Ride the wave for 10-20 minutes. The intensity will decrease.</p>
    </div>
    
    <h2>Remember This</h2>
    <p>You are not broken. Your nervous system is doing exactly what it was designed to do: protect you. These tools help you work <em>with</em> your nervous system, not against it.</p>
    
    <p>Recovery is not about perfection. It's about having tools you can use when you need them most.</p>
    
    <p><strong>You've got this.</strong></p>
    """
    
    output_path = "/home/ubuntu/memoir-merge/client/public/rewired-relief-toolkit-professional.pdf"
    generate_pdf(
        title="REWIRED Relief Toolkit",
        subtitle="Crisis-Focused Nervous System Regulation Guide",
        content_html=content,
        output_path=output_path
    )
    return output_path


if __name__ == "__main__":
    # Generate the REWIRED Relief Toolkit as an example
    generate_rewired_relief_toolkit()
    print("\n✅ Professional PDF generated successfully!")
    print("📄 Location: /home/ubuntu/memoir-merge/client/public/rewired-relief-toolkit-professional.pdf")
    print("\n💡 To generate more PDFs, use the generate_pdf() function with your own content.")
