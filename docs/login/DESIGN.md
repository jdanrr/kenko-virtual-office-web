---
name: Kenko EPS Health System
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
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
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
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system delivers a clinical, accessible, and deeply reassuring digital environment tailored specifically for Colombia’s healthcare ecosystem. The visual language balances institutional authority with empathetic human-centered service delivery.

### Personality & Emotional Tenor
- **Institutional Reliability:** Anchored by deep maritime slate (`#21496a`), conveying stability, clinical accreditation, and patient safety.
- **Empathetic Clarity:** Uncluttered layouts and crisp surfaces minimize cognitive strain during urgent clinical triage, appointment scheduling, and authorization lookups.
- **Vibrant Guidance:** Strategic deployment of canary gold (`#ffb51b`) and interactive sapphire (`#1e5bd7`) creates immediate visual hierarchy and intuitive callouts.
- **Universal Dignity:** Engineered under strict WCAG 2.2 AA standards to ensure readability for elderly users, mobile-first low-bandwidth environments, and visually impaired patients.

### Design Style: Modern Clinical Precision
The interface employs a **Modern Functional Healthcare** aesthetic characterized by:
- Pure white containment cards floating on an expansive, light grey base (`#f9fafb`).
- Soft, non-distracting borders with featherweight ambient elevation.
- Prominent focus rings and high-contrast typographic scales designed to eliminate patient error in high-stress digital workflows.

## Colors

The palette is engineered to achieve strict WCAG 2.2 AA contrast ratios across mobile and desktop displays, prioritizing clinical clarity and accessible interactivity.

### Palette Architecture
- **Primary (`#21496a`):** Institutional maritime blue. Governs top-tier headers, major navigation bars, credential seals, and dominant action buttons.
- **Secondary (`#ffb51b`):** Golden beacon accent. Reserved for vital notices, status alerts, prioritized CTAs, active badges, and focus rings.
- **Tertiary / Interactive Accent (`#1e5bd7`):** Vibrant digital sapphire. Governs text links, interactive icon buttons, step indicators, and active tab states.
- **Neutral / Content (`#18181b`):** High-density carbon slate. Delivers crisp contrast against pure white cards and soft canvas backgrounds.
- **Canvas Background (`#f9fafb`):** Neutral foundation reducing eye fatigue while sustaining contrast against structured content surfaces.

### Semantic On-Color Hierarchy
- **On-Primary:** `#f9fafb` (ensures minimum 7:1 contrast against `#21496a`).
- **On-Secondary:** `#18181b` (high-contrast carbon ink across golden surfaces).
- **On-Tertiary:** `#f9fafb` (crisp white across interactive sapphire surfaces).
- **Surface Neutral:** `#ffffff` (dedicated container color for elevated medical records, cards, and forms).
- **Border Subtle:** `rgba(24, 24, 27, 0.08)` / `#e2e8f0` (clean division lines without visual noise).

## Typography

Typography bridges clinical authority with immediate readability. While the system pairs geometric structure for major wayfinding with humanistic clarity for dense patient copy, line heights are intentionally generous to accommodate medical nomenclature and Spanish-language phrasing.

### Hierarchy & Usage
- **Headlines & Display (Space Grotesk):** Provides structured geometric authority for patient portals, key statistics, clinical numbers, and primary section headers. Letter spacing is subtly pulled in on larger scales to maintain cohesion.
- **Body & Data (Manrope):** Delivers open counters, distinct ascenders/descenders, and clear distinction between similar characters (such as `1`, `l`, and `I`), critical for medical identification numbers, dosage amounts, and clinical diagnostics.
- **Labels & Badges (Manrope Semibold / Bold):** Used across clinical badges, authorization tags, input labels, and table column headers.

## Layout & Spacing

The layout model implements a fluid 12-column responsive grid centered on an accessible 8pt spatial baseline (`0.5rem`).

### Grid Structure
- **Desktop (>= 1024px):** 12-column fluid grid, `2rem` outer margin, `1.5rem` gutters, max container width of `1280px`.
- **Tablet (768px - 1023px):** 8-column grid, `1.5rem` outer margins, `1rem` gutters.
- **Mobile (< 768px):** 4-column grid, `1rem` outer margins, `1rem` gutters.

### Component Spacing Discipline
- **Micro Spacing (`space-xs`, `space-sm`):** Form field inner padding, badge internal alignment, icon-to-label separation.
- **Component Spacing (`space-md`, `space-lg`):** Card inner paddings, list item vertical separations, form stack gaps.
- **Section Spacing (`space-xl`):** Vertical clearance between diagnostic modules, patient data groupings, and footer bounds.

## Elevation & Depth

Visual hierarchy uses a refined balance of low-contrast ghost outlines and soft, natural ambient shadowing rather than abrupt drop shadows.

### Elevation Levels
- **Level 0 (Flat Canvas):** `#f9fafb` background without shadows or borders.
- **Level 1 (Clinical Container / Cards):** `#ffffff` fill accompanied by a hairline border (`rgba(24, 24, 27, 0.08)`) and an ambient shadow: `0 1px 3px rgba(33, 73, 106, 0.04), 0 1px 2px rgba(33, 73, 106, 0.02)`.
- **Level 2 (Interactive Floating / Active Cards):** On hover or selection: `0 4px 12px rgba(33, 73, 106, 0.08), 0 2px 4px rgba(33, 73, 106, 0.04)`.
- **Level 3 (Modals, Slide-overs & Flyouts):** Used for appointment booking sheets, clinical popups, and prescription dialogs: `0 12px 32px rgba(33, 73, 106, 0.12), 0 4px 8px rgba(33, 73, 106, 0.04)` combined with a tinted backdrop overlay (`rgba(33, 73, 106, 0.4)`).

## Shapes

The shape system employs roundedness level **2** (`0.5rem` standard radius), establishing a balanced, approachable feel without feeling toy-like.

- **Base Radius (`rounded-md`, 0.5rem):** Standard buttons, text inputs, card containers, badge pills, and dropdown lists.
- **Large Radius (`rounded-lg`, 1rem):** High-level medical dashboard widgets, modal containers, and hero notification boxes.
- **Extra Large Radius (`rounded-xl`, 1.5rem):** Triage category selector banners and primary patient portal summaries.
- **Pill Radius (`rounded-full`):** State badges (e.g., "Autorizado", "Pendiente", "Vigente") and circular avatar icons.

## Components

### Buttons
- **Primary Button:** Background `#21496a`, text `#f9fafb`, height `44px` (touch-target accessible). Rounded `0.5rem`. On hover, shifts to slightly deeper blue `#193852`. Active states reduce scale slightly (98%).
- **Secondary / Action Button:** Background `#1e5bd7`, text `#f9fafb`. For intermediate digital tasks (e.g., "Descargar Orden Médica", "Ver Detalles"). Hover: `#1747a8`.
- **Accent / Alert CTA:** Background `#ffb51b`, text `#18181b`, font weight `600`. Reserved for urgent actions (e.g., "Pedir Cita Prioritaria", "Renovar Afiliación"). Hover: `#e6a215`.
- **Ghost / Tertiary Button:** Transparent background, text `#1e5bd7`, padding `0.5rem 1rem`.

### Input Fields & Form Controls
- **Text Inputs:** Background `#ffffff`, border `1px solid rgba(24, 24, 27, 0.15)`, text `#18181b`. Height `44px`, padding `0.75rem 1rem`.
- **Focus Ring (WCAG 2.2 AA Mandatory):** All inputs and interactive targets display a double-stroke focus ring consisting of an inner `2px` white outline and an outer `3px` solid `#ffb51b` ring (`box-shadow: 0 0 0 2px #ffffff, 0 0 0 5px #ffb51b`).
- **Error State:** Border `1.5px solid #dc2626`, background `rgba(220, 38, 38, 0.02)`. Accompanied by inline error text with a warning icon.

### Cards & Data Panels
- Pure white `#ffffff` fill, `0.5rem` radius, border `1px solid rgba(24, 24, 27, 0.08)`.
- Internal padding is strictly `1.5rem` on desktop and `1rem` on mobile.
- Card headers use `#21496a` font color with `title-md` or `headline-sm` scales.

### Status Chips & Badges
- **Approved / Active:** Background `rgba(30, 91, 215, 0.1)`, text `#1e5bd7`, border `1px solid rgba(30, 91, 215, 0.2)`.
- **Pending / Alert:** Background `rgba(255, 181, 27, 0.15)`, text `#8a5e00`, border `1px solid rgba(255, 181, 27, 0.4)`.
- **Institutional / Neutral:** Background `rgba(33, 73, 106, 0.08)`, text `#21496a`, border `1px solid rgba(33, 73, 106, 0.15)`.

### Checkboxes & Radio Buttons
- 20x20px dimension for minimum accessibility target area. Border `2px solid rgba(24, 24, 27, 0.3)`.
- Checked state fills with `#21496a` displaying an accessible `#f9fafb` checkmark. Focus states apply the `#ffb51b` 3px outer ring.

### Healthcare-Specific Components
- **Medical Turn Indicator (Digiturno):** Large number card displaying `display-lg` numbers in `#21496a`, paired with a high-contrast `#ffb51b` status strip indicating consulting room or queue status.
- **Affiliation Status Card:** Header rendered in `#21496a`, document ID in bold `body-lg`, with floating badge for EPS regimen tier (Contributivo / Subsidiado).