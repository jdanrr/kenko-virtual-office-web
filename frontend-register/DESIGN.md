---
name: Kenko EPS
colors:
  surface: '#fbf8fc'
  surface-dim: '#dcd9dd'
  surface-bright: '#fbf8fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f2f7'
  surface-container: '#f0edf1'
  surface-container-high: '#eae7eb'
  surface-container-highest: '#e4e1e6'
  on-surface: '#1b1b1e'
  on-surface-variant: '#42474e'
  inverse-surface: '#303033'
  inverse-on-surface: '#f3f0f4'
  outline: '#72777e'
  outline-variant: '#c2c7ce'
  surface-tint: '#3c6184'
  primary: '#013252'
  on-primary: '#ffffff'
  primary-container: '#21496a'
  on-primary-container: '#92b8de'
  inverse-primary: '#a5caf1'
  secondary: '#7e5700'
  on-secondary: '#ffffff'
  secondary-container: '#fdb318'
  on-secondary-container: '#6a4800'
  tertiary: '#002a75'
  on-tertiary: '#ffffff'
  tertiary-container: '#003ea4'
  on-tertiary-container: '#98b2ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cee5ff'
  primary-fixed-dim: '#a5caf1'
  on-primary-fixed: '#001d33'
  on-primary-fixed-variant: '#224a6b'
  secondary-fixed: '#ffdead'
  secondary-fixed-dim: '#ffba39'
  on-secondary-fixed: '#281900'
  on-secondary-fixed-variant: '#604100'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b3c5ff'
  on-tertiary-fixed: '#00184a'
  on-tertiary-fixed-variant: '#003fa5'
  background: '#fbf8fc'
  on-background: '#1b1b1e'
  surface-variant: '#e4e1e6'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an institutional, accessible, and deeply trustworthy digital foundation tailored for healthcare administration and health promotion services (EPS). The design language synthesizes institutional authority with modern, approachable civic clarity.

### Personality & Emotional Response
The system must project:
- **Institutional Reliability:** High clarity, structured data density, and unfaltering dependability.
- **Empathetic Utility:** Reassurance, warmth, and frictionless navigation for patients, caregivers, and medical practitioners navigating critical workflows.
- **Accessible Rigor:** Uncompromising contrast, immediate scannability, and structural order complying with WCAG 2.2 AA standards.

### Aesthetic Direction: Modern Institutionalism
The system avoids decorative fluff in favor of crisp architectural layouts, subtle structural boundaries, refined tonal containment, and deliberate functional highlights. Warm gold touches break bureaucratic coldness without compromising executive gravity.

## Colors

The palette balances authoritative medical blue tones with energetic Colombian civic warmth and highly legible neutral containers.

### Core Roles & Contrast Directives
- **Primary (`#21496a`):** Deep institutional navy blue. Dedicated to structural chrome, primary navigation bars, headings, table headers, and primary operational triggers. High contrast against light canvas (`4.5:1+`).
- **Secondary (`#ffb51b`):** Warm golden yellow. Serves as high-priority call-to-action surfaces, system focus states, critical alerts, and highlighted milestones. Always pairs with dark text (`#18181b`) to ensure WCAG AAA text legibility.
- **Tertiary / Interactive Accent (`#1e5bd7`):** Electric blue. Reserved exclusively for hyperlinking, active tab indicators, selected radio/checkbox states, and informational badges.
- **Neutral Foreground (`#18181b`):** Dark zinc neutral. Used for dense body text, form labels, data cells, and strong line demarcations.
- **Canvas / Surface Background (`#f9fafb`):** Clean off-white surface tone that mitigates eye fatigue while preserving crisp border delineation.
- **Border / Divider:** `rgba(24, 24, 27, 0.1)` (Tailwind `zinc-200`) providing structural definition without visual heaviness.

## Typography

The typography hierarchy balances authoritative headline presence with clinical legibility across high-density portals, health certificates, and medical history views.

### Structure
- **Headlines & Display:** Space Grotesk provides a geometric, structured, and modern civic feel with crisp numeral presentation for identifiers (e.g., Cédula de Ciudadanía, authorization codes).
- **Body & Data Typography:** Manrope provides exceptional clarity at small-to-medium sizes, geometric openness, and legible distinctions between numerals and similar glyphs (1, l, I).

### Legibility Directives
- Maintain paragraph measures between 55 and 75 characters per line for educational health material.
- For patient forms and dense data grids, enforce tabular figures (`tnum`) in numeric fields.

## Layout & Spacing

The layout is grounded in a 12-column responsive fluid grid designed to accommodate tabular administrative data, multi-step appointment schedules, and transactional health authorizations.

### Breakpoints & Grid Scaling
- **Mobile (<768px):** 4-column layout, `margin: 1rem (16px)`, `gutter: 1rem (16px)`. Modals and drawers extend full-width or bottom-sheet format.
- **Tablet (768px - 1023px):** 8-column layout, `margin: 1.5rem (24px)`, `gutter: 1.5rem (24px)`. Side panels collapse into off-canvas navigation.
- **Desktop (1024px+):** 12-column layout, max-width `1280px` centered with auto margins, `gutter: 1.5rem (24px)`. Left-hand persistent navigation consumes 3 columns or fixed 280px.

### Spacing Principles
- Multi-input form groups must maintain `space-md` vertical rhythm.
- Dashboard cards and operational modules apply internal padding using `space-lg` on desktop, adapting down to `space-md` on mobile.

## Elevation & Depth

This design system avoids excessive drop shadows, prioritizing structural low-contrast borders and subtle ambient diffusion. The resulting UI feels clean, grounded, and modern.

### Hierarchy Layers
- **Base Surface (Level 0):** Canvas `#f9fafb`. The foundational background for all layouts.
- **Card & Data Containers (Level 1):** Solid white (`#ffffff`) with a crisp border: `1px solid rgba(24, 24, 27, 0.1)`. No default shadow.
- **Interactive Hover & Dropdowns (Level 2):** Ambient diffused shadow: `0 4px 12px -2px rgba(24, 24, 27, 0.06), 0 2px 6px -1px rgba(24, 24, 27, 0.04)`, bordered by `rgba(24, 24, 27, 0.12)`.
- **Modals & Overlays (Level 3):** Elevates clinical forms and confirmation dialogs over an accessible backdrop (`rgba(24, 24, 27, 0.45)`), with `0 20px 25px -5px rgba(24, 24, 27, 0.1), 0 8px 10px -6px rgba(24, 24, 27, 0.05)`.

## Shapes

The design system implements a controlled **Rounded** profile (`roundedness: 2`, base radius: `0.5rem / 8px`). This provides an approachable, human-centered feel while preserving enterprise stability.

### Radius Assignments
- **Inputs, Buttons, Badges, Table Rows:** `rounded` (8px). Matches hand ergonomics on mobile tap targets.
- **Cards, Panels, Modals:** `rounded-lg` (16px). Creates soft, identifiable modules that clearly delineate clinical contexts.
- **Floating Status Pills & Avatars:** Full rounded (`9999px`) to distinguish categorical tags and affiliation states from actionable controls.

## Components

### Buttons
- **Primary:** Background `#21496a`, text `#f9fafb`. Hover: `#1a3a54`. Active: `#142d42`. Border: none. Minimum touch target: 44px.
- **Secondary / CTA:** Background `#ffb51b`, text `#18181b`, font-weight 600. Hover: `#e6a318`. Active: `#cc9014`.
- **Ghost / Outlined:** Background transparent, border `1.5px solid #21496a`, text `#21496a`. Hover: `rgba(33, 73, 106, 0.06)`.
- **Focus State:** `outline: none; box-shadow: 0 0 0 2px #f9fafb, 0 0 0 4px #ffb51b;` across all interactive elements.

### Inputs & Form Controls
- **Text Inputs:** Background `#ffffff`, border `1px solid rgba(24, 24, 27, 0.18)`, text `#18181b`, placeholder `rgba(24, 24, 27, 0.45)`. Minimum height: 44px. Padding: `0.625rem 0.875rem`.
- **Focus:** Border color `#21496a`, outer ring `2px solid #ffb51b`.
- **Error State:** Border `#dc2626`, focus ring `#fca5a5`, with helper text rendering at `label-sm` in `#b91c1c`.

### Checkboxes & Radio Buttons
- **Checkbox:** 20px x 20px, border `1.5px solid rgba(24, 24, 27, 0.3)`. Checked state: background `#1e5bd7`, border `#1e5bd7`, check icon in `#f9fafb`.
- **Radio:** Circular 20px x 20px, active inner dot 10px `#1e5bd7`.

### Cards & Content Modules
- Background `#ffffff`, border `1px solid rgba(24, 24, 27, 0.1)`, padding `1.5rem`.
- Card headers feature `headline-sm` with a bottom separator `1px solid rgba(24, 24, 27, 0.06)` for procedural summaries (e.g., copay breakdown, prescription authorizations).

### Chips & Status Badges
- **Affiliation / Active:** Background `rgba(30, 91, 215, 0.1)`, text `#1e5bd7`, font-weight 600, border `1px solid rgba(30, 91, 215, 0.2)`.
- **Warning / Pending Authorization:** Background `rgba(255, 181, 27, 0.2)`, text `#784f00`, border `1px solid rgba(255, 181, 27, 0.4)`.
- **Success / Validated:** Background `#ecfdf5`, text `#065f46`, border `1px solid #a7f3d0`.

### Links & Interactive Tags
- Links render with text `#1e5bd7`, medium weight, underline on hover with a 2px offset.