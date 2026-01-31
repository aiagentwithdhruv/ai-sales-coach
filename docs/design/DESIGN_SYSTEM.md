# AI Sales Coach — Design System Reference

**Version:** 1.0  
**Last Updated:** 2026-02-01  

---

## 1. Brand Identity

### 1.1 Brand Personality
- **Professional**: Enterprise-grade, not playful
- **Intelligent**: AI-powered, data-driven
- **Trustworthy**: Secure, reliable, consistent
- **Modern**: Cutting-edge technology feel
- **Efficient**: Focused on productivity and results

### 1.2 Design Philosophy
> "Gunmetal & charcoal base, soft surfaces, with controlled neon blue accents for AI-futuristic moments."

- Dark theme primary (reduces eye strain for long sessions)
- High contrast for readability
- Minimal decoration, maximum function
- Subtle animations for feedback
- Consistent spacing and alignment

---

## 2. Color Palette

### 2.1 Core Colors

```css
/* Background Colors */
--onyx: #0D0D0D;           /* Primary background */
--graphite: #1A1A1A;       /* Card backgrounds */
--gunmetal: #2A2A2A;       /* Borders, dividers */
--charcoal: #333333;       /* Secondary surfaces */

/* Text Colors */
--platinum: #E5E7EB;       /* Primary text, headings */
--silver: #9CA3AF;         /* Body text */
--mist: #6B7280;           /* Muted text, labels */

/* Accent Colors */
--neonblue: #3B82F6;       /* Primary accent, links, AI elements */
--neonblue-hover: #2563EB; /* Hover state */
--neonblue-muted: #3B82F620; /* Background highlights */

/* Status Colors */
--automation-green: #10B981;  /* Success, CTA, positive */
--automation-green-hover: #059669;
--alert-red: #EF4444;         /* Error, danger, negative */
--alert-red-hover: #DC2626;
--warning-amber: #F59E0B;     /* Warning, caution */
--info-blue: #3B82F6;         /* Information */
```

### 2.2 Color Usage Rules

| Element | Color | Notes |
|---------|-------|-------|
| Page background | onyx | Always |
| Cards | graphite | With gunmetal border |
| Primary buttons | automation-green | White text |
| Secondary buttons | transparent | gunmetal border, silver text |
| Links | neonblue | Underline on hover |
| Headings | platinum | Bold weight |
| Body text | silver | Regular weight |
| Labels/captions | mist | Small size |
| AI indicators | neonblue | Subtle glow optional |
| Success states | automation-green | Icons, badges |
| Error states | alert-red | Icons, badges, borders |
| Warnings | warning-amber | Icons, badges |

### 2.3 Gradients (Use Sparingly)

```css
/* Hero/Feature highlight */
--gradient-hero: linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 100%);

/* AI accent glow */
--gradient-ai: linear-gradient(90deg, #3B82F620 0%, transparent 100%);

/* Score visualization */
--gradient-score: linear-gradient(90deg, #EF4444 0%, #F59E0B 50%, #10B981 100%);
```

---

## 3. Typography

### 3.1 Font Stack

```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 3.2 Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 36px | 700 | 1.2 | Page titles |
| H1 | 30px | 600 | 1.3 | Section headers |
| H2 | 24px | 600 | 1.3 | Card titles |
| H3 | 20px | 600 | 1.4 | Subsection titles |
| H4 | 16px | 600 | 1.4 | Component headers |
| Body | 14px | 400 | 1.5 | Main content |
| Small | 12px | 400 | 1.5 | Captions, labels |
| Tiny | 10px | 500 | 1.4 | Badges, tags |

### 3.3 Text Colors by Context

```css
.text-primary { color: var(--platinum); }   /* Headings */
.text-secondary { color: var(--silver); }   /* Body */
.text-muted { color: var(--mist); }         /* Labels */
.text-accent { color: var(--neonblue); }    /* Links, highlights */
.text-success { color: var(--automation-green); }
.text-error { color: var(--alert-red); }
```

---

## 4. Spacing System

### 4.1 Base Unit
Base unit: **4px**

### 4.2 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Tight inline spacing |
| space-2 | 8px | Icon gaps, tight padding |
| space-3 | 12px | Button padding, small gaps |
| space-4 | 16px | Default padding |
| space-5 | 20px | Card padding |
| space-6 | 24px | Section gaps |
| space-8 | 32px | Large section gaps |
| space-10 | 40px | Page margins |
| space-12 | 48px | Major section breaks |

### 4.3 Layout Grid

```
Desktop (1440px+):  12 columns, 24px gutter, 80px margins
Laptop (1024px):    12 columns, 20px gutter, 40px margins  
Tablet (768px):     8 columns, 16px gutter, 24px margins
Mobile (375px):     4 columns, 12px gutter, 16px margins
```

---

## 5. Component Specifications

### 5.1 Cards

```css
.card {
  background: var(--graphite);
  border: 1px solid var(--gunmetal);
  border-radius: 8px;
  padding: 20px;
}

.card-header {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--gunmetal);
  margin-bottom: 16px;
}

.card-elevated {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}
```

### 5.2 Buttons

| Variant | Background | Text | Border | Usage |
|---------|------------|------|--------|-------|
| Primary | automation-green | white | none | Main CTA |
| Secondary | transparent | silver | gunmetal | Secondary actions |
| Ghost | transparent | silver | none | Tertiary actions |
| Danger | alert-red | white | none | Destructive actions |
| AI | neonblue | white | none | AI-specific actions |

```css
.button {
  height: 40px;
  padding: 0 16px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.15s ease;
}

.button-sm { height: 32px; padding: 0 12px; font-size: 12px; }
.button-lg { height: 48px; padding: 0 24px; font-size: 16px; }
```

### 5.3 Inputs

```css
.input {
  height: 40px;
  padding: 0 12px;
  background: var(--onyx);
  border: 1px solid var(--gunmetal);
  border-radius: 6px;
  color: var(--platinum);
  font-size: 14px;
}

.input:focus {
  border-color: var(--neonblue);
  outline: none;
  box-shadow: 0 0 0 2px var(--neonblue-muted);
}

.input::placeholder {
  color: var(--mist);
}

.input-error {
  border-color: var(--alert-red);
}
```

### 5.4 Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.badge-success { background: #10B98120; color: #10B981; }
.badge-warning { background: #F59E0B20; color: #F59E0B; }
.badge-error { background: #EF444420; color: #EF4444; }
.badge-info { background: #3B82F620; color: #3B82F6; }
.badge-neutral { background: #6B728020; color: #9CA3AF; }
```

### 5.5 Tables

```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 12px 16px;
  background: var(--charcoal);
  color: var(--mist);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--gunmetal);
  color: var(--silver);
  font-size: 14px;
}

.table tr:hover td {
  background: var(--charcoal);
}
```

### 5.6 Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--graphite);
  border: 1px solid var(--gunmetal);
  border-radius: 12px;
  max-width: 560px;
  width: 90%;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--gunmetal);
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--gunmetal);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
```

---

## 6. Icons

### 6.1 Icon Library
Primary: **Lucide React** (consistent, modern, MIT licensed)

### 6.2 Icon Sizes

| Size | Pixels | Usage |
|------|--------|-------|
| xs | 12px | Inline with small text |
| sm | 16px | Buttons, inline |
| md | 20px | Default |
| lg | 24px | Card headers |
| xl | 32px | Feature highlights |
| 2xl | 48px | Empty states |

### 6.3 Common Icons

| Purpose | Icon Name | Notes |
|---------|-----------|-------|
| Dashboard | LayoutDashboard | |
| Practice | Phone | Live call |
| Calls | PhoneCall | Analyzer |
| Coach | MessageSquare | Text chat |
| Follow-up | Send | Autopilot |
| Knowledge | BookOpen | Company brain |
| Analytics | BarChart3 | Dashboard |
| Settings | Settings | Cog |
| User | User | Profile |
| AI/Sparkle | Sparkles | AI features |
| Upload | Upload | File upload |
| Success | CheckCircle | Green |
| Error | XCircle | Red |
| Warning | AlertTriangle | Amber |
| Info | Info | Blue |

---

## 7. Motion & Animation

### 7.1 Timing Functions

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### 7.2 Durations

| Duration | Value | Usage |
|----------|-------|-------|
| instant | 75ms | Micro-interactions |
| fast | 150ms | Hovers, toggles |
| normal | 250ms | Most transitions |
| slow | 350ms | Modals, drawers |
| slower | 500ms | Page transitions |

### 7.3 Animation Patterns

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Pulse (for AI thinking) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Shimmer (for loading) */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## 8. Responsive Breakpoints

```css
/* Mobile first approach */
--breakpoint-sm: 640px;   /* Large phones */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

---

## 9. Accessibility

### 9.1 Contrast Requirements
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

### 9.2 Focus States
All interactive elements must have visible focus:

```css
:focus-visible {
  outline: 2px solid var(--neonblue);
  outline-offset: 2px;
}
```

### 9.3 Touch Targets
Minimum touch target: 44x44px

---

## 10. Dark Mode Only

This application uses dark mode exclusively. No light mode variant is required.

All colors, contrasts, and design decisions are optimized for dark backgrounds.
