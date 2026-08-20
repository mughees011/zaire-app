---
name: Synthetic Intelligence Trading
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb3ad'
  on-tertiary: '#68000a'
  tertiary-container: '#ff5451'
  on-tertiary-container: '#5c0008'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  data-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2.5rem
  gutter: 1rem
  margin-mobile: 1rem
  margin-desktop: 2rem
---

## Brand & Style

The design system is engineered for a high-performance AI trading environment. It targets sophisticated investors and algorithmic traders who require immediate data processing and technical clarity. 

The aesthetic is **Modern Corporate with Glassmorphism touches**. It balances a professional, trustworthy foundation with futuristic, high-tech accents. The interface should feel like a high-end command center: dark, immersive, and precise. Visual depth is achieved through translucent overlays and vibrant neon highlights that guide the eye toward critical market movements and AI-generated insights.

## Colors

The palette is anchored in a deep, multi-layered dark mode. 

- **Backgrounds:** Use `#0F172A` for the primary application canvas. Use `#1E293B` for elevated containers, sidebars, and card elements to create structural hierarchy.
- **Accents:** 
    - **Signature Violet (#6366F1):** Reserved for AI-driven features, primary actions, and branding.
    - **Electric Green (#10B981):** Represents profit, growth, and "Buy" signals.
    - **Soft Red (#EF4444):** Reserved for losses, risk alerts, and "Sell" signals.
- **Data Visualization:** Use the primary and secondary accents against the dark background to ensure a high-contrast ratio for chart lines and technical indicators.

## Typography

This design system utilizes a dual-font strategy to separate narrative content from financial data.

- **Inter:** The primary typeface for all UI labels, navigation, and body copy. It provides a neutral, highly legible foundation.
- **JetBrains Mono:** Used exclusively for numeric data, price tickers, wallet addresses, and code snippets. The monospaced nature ensures that numbers do not "jump" during live price updates.

**Scale:** Use `display-lg` for portfolio totals. Use `label-caps` for table headers and section overlines to maintain a technical, organized feel.

## Layout & Spacing

The design system employs a **Fluid Grid** approach for dashboards, ensuring maximum information density on large displays while remaining accessible on mobile.

- **Grid Model:** 12-column system for desktop, 4-column for mobile.
- **Density:** High. Margins and gutters are kept tight (`1rem`) to maximize the area for charts and data tables.
- **Structure:** Modular "widgets" should be used for the dashboard layout, allowing users to focus on specific data streams.
- **Mobile Reflow:** On mobile, sidebars collapse into a bottom navigation bar, and complex data tables transition into simplified list cards.

## Elevation & Depth

Depth is communicated through **Tonal Layering** and **Glassmorphism**, rather than traditional shadows.

- **Base Level:** `#0F172A` (Pure background).
- **Raised Level:** `#1E293B` with a 1px solid border at 10% white opacity. This creates a "beveled" appearance common in high-tech hardware interfaces.
- **Glassmorphism:** For overlays, modals, and dropdowns, use a background of `rgba(30, 41, 59, 0.7)` with a `20px` backdrop-filter blur. 
- **Glows:** Use subtle outer glows (10-20px blur) using the Primary or Secondary colors to indicate active AI processes or significant market alerts.

## Shapes

The shape language is **Soft** but disciplined. 

- Use `0.25rem` (4px) for most interactive components like input fields and buttons to maintain a precise, technical look.
- Use `0.5rem` (8px) for larger dashboard widgets and cards.
- **Avoid** fully rounded pill shapes unless used for status tags (e.g., "AI Active") to differentiate them from functional buttons.

## Components

- **Buttons:** Primary buttons use the Signature Violet (`#6366F1`) with white text. Secondary buttons are outlined with a 1px border. "Buy" and "Sell" buttons use the Green and Red accents respectively.
- **Input Fields:** Darker than the container background, using a subtle 1px border that glows Violet on focus. Monospaced font for numeric inputs.
- **Cards/Widgets:** Feature a 1px border (`#FFFFFF` at 10% opacity). Headers within cards should have a slight background tint to separate them from the content area.
- **Chips/Badges:** Small, low-profile indicators. Use "Glass" style (low-opacity color fills with high-opacity text) for status indicators like "Executed" or "Pending."
- **Data Tables:** Row stripes are unnecessary; use 1px horizontal dividers. On hover, rows should highlight with a subtle `#1E293B` fill.
- **AI Insight Cards:** Differentiated by a subtle gradient border using the Signature Violet to indicate the content was generated by the platform's intelligence.