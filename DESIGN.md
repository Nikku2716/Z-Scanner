# Design System: BlackHawk (Obsidian — Crystalline Knowledge Vault)

## 1. Visual Theme & Atmosphere

BlackHawk uses the **Obsidian** design system — a crystalline knowledge vault with deep-focus dark aesthetics.
- **Canvas:** Abyss (`#171717`) — deep, immersive workspace background.
- **Panels & Surfaces:** Surface (`#1e1e1e`) — crisp, elevated panels with 1px white inset glow luminescence.
- **Primary Accents:** Amethyst (`#7c3aed`) for interactive primary calls-to-action and active states; Lavender (`#a78bfa`) for links, badges, and secondary highlights.
- **Atmosphere:** Clean, precise, and distraction-free security telemetry.

## 2. Color Palette & Tokens

- **Canvas Abyss:** `#171717` (`--color-abyss`)
- **Surface / Panel:** `#1e1e1e` (`--color-surface`)
- **Text Bright Gray:** `#eeeeee` (`--color-bright-gray`) — primary text and headers
- **Text Medium Gray:** `#bcbcbc` (`--color-medium-gray`) — secondary labels, descriptions, and metadata
- **Text Muted Gray:** `#a3a3a3` (`--color-muted-gray`) — placeholders, timestamps, subtle captions
- **Primary CTA Amethyst:** `#7c3aed` (`--color-amethyst`)
- **Accent / Link Lavender:** `#a78bfa` (`--color-lavender`)
- **Tag / Badge Background:** `#8a5cf5` @ 15% opacity (`rgba(138, 92, 245, 0.15)`)
- **Graphite Border:** `#3f3f3f` / `rgba(255, 255, 255, 0.05)`
- **Status Colors:**
  - **Success Green:** `#4ade80` (`--color-success-green`)
  - **Warning Yellow:** `#facc15` (`--color-warning-yellow`)
  - **Error Red:** `#f87171` (`--color-error-red`)

## 3. Typography

- **Font Family:** System UI font stack exclusively:
  `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
- **Decorative & External Google Fonts (Geist, JetBrains Mono, Inter) are strictly banned.**
- **Typography Scale:**
  - Title: 32px / 40px line-height / regular (400) weight / -0.5px letter-spacing
  - Heading: 24px / 32px line-height / regular (400) weight / -0.3px letter-spacing
  - Subheading: 18px / 26px line-height / medium (500) weight / -0.2px letter-spacing
  - Body: 14px / 22px line-height / regular (400) weight
  - Body Small: 13px / 20px line-height / regular (400) weight
  - Eyebrow: 11px / 16px line-height / semibold (600) weight / 0.04em uppercase letter-spacing

## 4. Elevation & Geometry

- **Elevation:** 1px subtle white inset glow (`rgba(255, 255, 255, 0.05) 0px 0px 0px 1px inset`). No heavy drop shadows.
- **Border Radii:**
  - Inputs & Buttons: `8px` (`--radius-inputs`, `--radius-buttons`)
  - Cards & Panels: `12px` (`--radius-cards`)
  - Tags & Pills: `9999px` (`--radius-full`, `--radius-pills`)

## 5. Layout & Spacing

- **Page Max-Width:** `1120px` (`--page-max-width`)
- **Spacing Units:** 4px base increment (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `48px`).
- **Card Padding:** `20px 24px`.

## 6. Components

- **Primary Buttons:** Amethyst background (`#7c3aed`), bright white text, 8px radius, hover brightness transition.
- **Ghost Buttons:** Transparent background with subtle border (`rgba(255, 255, 255, 0.05)`), Bright Gray text, hover surface highlight.
- **Inputs & Search:** Surface background (`#1e1e1e`), 1px white inset glow, Amethyst focus ring.
- **Badges & Tags:** Lavender text with `#8a5cf5` @ 15% opacity background pill.
