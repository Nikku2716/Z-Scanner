# Design System Master File — Notion Style Reference

> **LOGIC:** When building or updating components, strictly adhere to the tokens and specifications below.
> "Warm paper notebook under afternoon sun"

---

**Project:** BlackHawk
**Theme:** Light
**Design Reference:** Notion Style Reference
**Canvas:** `#f6f5f4` (warm paper warmth)

---

## 1. Global Tokens

### Color Palette

| Name | Hex Value | Token | Role |
|------|-----------|-------|------|
| Notion Blue | `#0075de` | `--color-notion-blue` | Primary CTA fill, active nav accent, filled action buttons — single chromatic commitment |
| Paper Warmth | `#f6f5f4` | `--color-paper-warmth` | Page canvas, hero background, section backgrounds — tactile analog feel |
| Pure White | `#ffffff` | `--color-pure-white` | Card surfaces, elevated panels, logo-wall background |
| Ink Black | `#000000` | `--color-ink-black` | Primary text, nav links, display headings (alpha: 100%, 95%, 90%, 60%, 40%) |
| Charcoal | `#111111` | `--color-charcoal` | Dark text variant where pure black would feel too harsh |
| Stone | `#757575` | `--color-stone` | Secondary nav text, muted helper text |
| Graphite | `#615d59` | `--color-graphite` | Body text with warm cast |
| Slate | `#696969` | `--color-slate` | Card body text, secondary content |
| Sky Tint | `#e6f3fe` | `--color-sky-tint` | Ghost CTA background, soft blue wash, active pill fill |
| Marigold | `#ffb110` | `--color-marigold` | Hero pill highlights, feature card accent background |
| Coral | `#f64932` | `--color-coral` | Decorative card backgrounds, warm-to-hot accent |
| Saffron | `#e89d01` | `--color-saffron` | Body-section accent panels |
| Vermillion | `#e32d14` | `--color-vermillion` | Deep coral for alerts and signal-warm accents |
| Mocha | `#b18164` | `--color-mocha` | Warm brown accent for panels |
| Signal Blue | `#097fe8` | `--color-signal-blue` | Decorative card backgrounds, avatar border |
| Sky Wash | `#62aef0` | `--color-sky-wash` | Lightest blue in the cast |
| Midnight Ink | `#02093a` | `--color-midnight-ink` | Dark mode island card surface for high-contrast moments |

---

## 2. Typography

- **Primary Sans-Serif:** `Inter` (substitute for `NotionInter`)
  - Weights: `400, 500, 600, 700`
  - Sizes: `12px, 14px, 16px, 20px, 22px, 24px, 40px, 42px, 48px, 54px, 72px, 96px`
  - Negative Letter Spacing on large sizes:
    - `96px`: `-4.608px` (`-0.048em`)
    - `72px`: `-2.016px` (`-0.028em`)
    - `54px`: `-1.89px` (`-0.035em`)
    - `22px`: `-0.242px` (`-0.011em`)
    - `12px`: `+0.12px` (`+0.01em`)
- **Editorial Serif:** `Source Serif 4` / `Source Serif Pro` (substitute for `Lyon Text`)
  - Weight: `400`
  - Sizes: `18px, 32px`
  - Line Heights: `1.56, 1.25`
  - Role: Editorial body copy, pull quotes, section intro subtitles.
- **Monospace:** `JetBrains Mono`
  - Weights: `400, 500`

---

## 3. Spacing & Shapes

- **Base Unit:** `4px`
- **Scale:** `4px, 8px, 12px, 16px, 20px, 24px, 28px, 32px, 36px, 64px, 80px`
- **Page Max Width:** `1440px`
- **Section Gap:** `80px`
- **Card Padding:** `24px`
- **Border Radii:**
  - Cards: `12px`
  - Pills: `9999px`
  - Small Controls: `4px`
  - Buttons: `8px`

---

## 4. Elevation

- **Nav (Sticky):** `0px 0.7px 1.462px 0px rgba(0, 0, 0, 0.015), 0px 3px 9px 0px rgba(0, 0, 0, 0.03)`
- **Product UI Mockup:** `0px 4px 12px rgba(0, 0, 0, 0.1)`
- **Content Cards:** `none` (Strictly 1px hairline border at `rgba(0, 0, 0, 0.08)`)

---

## 5. Components

### Primary CTA Button
- **Background:** `#0075de` (`--color-notion-blue`)
- **Text:** `#ffffff` at 14px 500 weight
- **Border Radius:** `8px`
- **Padding:** `6px 15px`
- The only chromatic filled button in the system!

### Ghost CTA Button
- **Background:** `#e6f3fe` (`--color-sky-tint`)
- **Text:** `#0075de` at 14px 500 weight
- **Border Radius:** `8px`
- **Padding:** `6px 15px`

### Muted Nav Link
- **Background:** Transparent
- **Text:** `rgba(0, 0, 0, 0.54)`
- **Hover:** `rgba(0, 0, 0, 0.95)`, NO underline
- **Border Radius:** `8px`
- **Padding:** `8px 12px`

### White Feature Card
- **Background:** `#ffffff`
- **Border:** `1px solid rgba(0, 0, 0, 0.08)`
- **Border Radius:** `12px`
- **Padding:** `24px`
- **Box Shadow:** `none`

### Accent Feature Card
- **Background:** Accent hue (`#ffb110`, `#f64932`, `#62aef0`, `#e6f3fe`)
- **Border Radius:** `12px`
- **Padding:** `24px`

### Dark Feature Card ("Dark Mode Island")
- **Background:** `#02093a` (`--color-midnight-ink`)
- **Text:** `#ffffff`
- **Border Radius:** `12px`
- **Padding:** `24px`

### Hero Highlight Rectangle
- **Background:** `#f6d5b8` (Peach) or `#ffb110` (Marigold)
- **Text:** `#000000`
- **Typography:** `font-style: italic`
- **Shape:** Rectangle (not oval) — `border-radius: 4px`
- **Padding:** `2px 14px 4px`

### Avatar Character Marks
- `40-48px` circle with `2px` colored border (blue, coral, yellow, sky)
- White background, flat illustration / icon inside
- Bouncy spring animation on hover

---

## 6. Do's and Don'ts

### Do
- Use `#f6f5f4` as the page canvas and `#ffffff` for card surfaces.
- Reserve `#0075de` for the single primary action.
- Apply negative letter-spacing to display sizes (`-2.016px` at 72px, `-1.89px` at 54px).
- Use `1px` solid borders at `rgba(0, 0, 0, 0.08)` instead of shadows for content cards.
- Use `12px` radius for cards and `8px` for buttons.
- Keep motion at `200ms` with ease timing.

### Don't
- Do not use dark `#090909` or pure `#ffffff` as page canvas background.
- Do not add box shadows to content cards.
- Do not use multiple chromatic button colors in the same view.
- Do not use gradients (the system uses flat fills).
- Do not use `Lyon Text` for navigation or UI labels (reserved for editorial subheads).
