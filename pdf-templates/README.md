# REWIRED Professional PDF Template System

This directory contains a professional PDF generation system with REWIRED branding for all your resources.

## Features

✅ **Professional Design**
- REWIRED color scheme (teal, amber, purple, etc.)
- Playfair Display headings + Inter body text
- Beautiful typography and spacing
- Branded headers and footers

✅ **Pre-styled Components**
- Section boxes with gradient backgrounds
- Highlight boxes for important info
- Tip boxes with icons
- Exercise boxes for activities
- Professional tables
- Checklists with checkboxes
- Blockquotes and code blocks

✅ **Easy to Use**
- HTML content with Jinja2 templating
- Automatic page numbering
- Page break controls
- Responsive to content length

## Quick Start

### 1. Install Dependencies (Already Done)
```bash
pip3 install weasyprint jinja2
```

### 2. Generate a PDF

```python
from generate_pdf import generate_pdf

content = """
<h1>Your Title</h1>
<p>Your content here...</p>

<div class="section-box">
    <h3>Important Section</h3>
    <p>Highlighted content</p>
</div>
"""

generate_pdf(
    title="Your PDF Title",
    subtitle="Subtitle shown in header",
    content_html=content,
    output_path="/path/to/output.pdf"
)
```

### 3. Use Pre-styled Components

#### Section Box (Gradient Background)
```html
<div class="section-box">
    <h3>Section Title</h3>
    <p>Content here</p>
</div>
```

#### Highlight Box (Amber)
```html
<div class="highlight-box">
    <h4>Important!</h4>
    <p>Highlighted content</p>
</div>
```

#### Tip Box (Teal)
```html
<div class="tip-box">
    This will automatically get a 💡 TIP prefix
</div>
```

#### Exercise Box (Purple)
```html
<div class="exercise-box">
    <h4>Exercise: Name</h4>
    <ol>
        <li>Step 1</li>
        <li>Step 2</li>
    </ol>
</div>
```

#### Checklist
```html
<ul class="checklist">
    <li>Item 1</li>
    <li>Item 2</li>
</ul>
```

#### Table
```html
<table>
    <tr>
        <th>Header 1</th>
        <th>Header 2</th>
    </tr>
    <tr>
        <td>Data 1</td>
        <td>Data 2</td>
    </tr>
</table>
```

#### Page Break
```html
<div class="page-break"></div>
```

## REWIRED Color Scheme

The template uses these colors from your brand:

- **Primary (Teal):** `#0f766e` - Main headings, borders
- **Secondary (Amber):** `#f59e0b` - Highlights, accents
- **Purple:** `#8b5cf6` - Exercise boxes
- **Light Teal:** `#14b8a6` - Subheadings
- **Blue:** `#3b82f6` - REWIRED "R"
- **Green:** `#10b981` - REWIRED "E"
- **Pink:** `#ec4899` - REWIRED "E"
- **Orange:** `#f97316` - REWIRED "D"

## Examples

See `generate_pdf.py` for a complete example (REWIRED Relief Toolkit).

## Customization

Edit `rewired-template.html` to:
- Change fonts
- Adjust colors
- Modify header/footer
- Add new component styles
- Change page margins

## Tips

1. **Keep it simple:** HTML + CSS only (no JavaScript)
2. **Test locally:** Generate PDFs locally before deploying
3. **Use semantic HTML:** `<h1>`, `<h2>`, `<p>`, `<ul>`, etc.
4. **Avoid complex layouts:** WeasyPrint has limitations
5. **Use page breaks:** Control where pages break for better layout

## Future PDFs to Create

- [ ] Recovery Toolkit - Practical Worksheets
- [ ] First 3 Chapters (formatted version)
- [ ] Crooked Lines Reading Guide
- [ ] REWIRED Method Guide
- [ ] Course workbooks
- [ ] Coaching worksheets

## Need Help?

The template is fully commented. Check `rewired-template.html` for all available styles and components.
