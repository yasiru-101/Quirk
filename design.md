# Quirk Design System: Multi-Mode Specification (Light & Dark)

## Overview

Quirk is a task-management system — boards, lists, timelines, the daily operating layer for a team — and its interface signals clarity through one disciplined move: a single living brand hue carries every signal in the product. Where legacy platforms run a simple black-and-white duet, Quirk runs a **mint-and-ink duet**: `{colors.primary}` mint green `#75EE8F` is the brand's one true accent — every primary CTA pill, every active nav state, the logo mark itself — and `{colors.ink}` near-black `#0D120F` carries structure, headlines, and the dark polarity-flip surfaces. Status and priority signals borrow controlled neighbours of that same hue family rather than reaching for arbitrary traffic-light colours, so the product never feels like five competing brands stapled together.

The logo is the literal source of truth: a rounded speech-bubble badge in mint `#75EE8F` with a deeper mint tail `#66EF87` for depth, a pure white `#FFFFFF` checkmark, and a near-white mint ghost `#F0FFF6` for the wordmark. Every colour in this system is mathematically derived from that one seed hue (132.9° in HSL) — tints, shades, and the full status/priority ramp all sit on the same colour wheel position, just at different lightness and saturation. This is what makes the palette feel inevitable rather than decorated on.

### The Polarity Shifting Ecosystem
* **In Light Mode:** Mint sits on crisp white and ink is reserved for text and rare polarity-flip bands. 
* **In Dark Mode:** That relationship reverses — **mint becomes the glow**, sitting on a deep charcoal-green canvas, reading as more luminous here than anywhere in the light system. Dark mode is where Quirk's brand colour gets to be the brightest thing on screen, the same way the logo's mint bubble stands out against the white app icon background. The canvas itself is not pure black; it carries a faint cool-green undertone (`#0F1512`) derived from the same 132.9° brand hue at very low lightness/saturation so that every surface traces back to the seed colour.

---

## Key Characteristics & Principles

* **Two-Colour CTA Hierarchy:** Mint `{colors.primary}` pill for primary conversion (Create task, Save, Invite); ink `{colors.ink}` pill (or light near-white `{colors.on-dark}` pill in Dark Mode) for high-emphasis secondary actions that need to feel weighty without competing with mint; soft `{colors.canvas-soft}` pill for tertiary/chip actions.
* **Shape Signature:** The pill is the single signature shape on every interactive control; every interactive element rounds to `{rounded.pill}` 999px. Cards and surfaces round to `{rounded.lg}` 12px because task cards in a dense board need a crisper edge than marketing promo cards. Modal and onboarding surfaces use `{rounded.xl}` 16px to read as more generous and less dense.
* **Typography Base:** **Poppins** carries the entire system across two weight roles: 600/700 for display and headline roles (sentence-case, no all-caps display), and 400/500 for body, button, and label roles. Poppins' geometric, rounded-terminal character echoes the logo's soft speech-bubble geometry.
* **Semantic Ramps:** A 5-step status ramp (Backlog → To do → In progress → In review → Done) and a 4-step priority ramp (Low → Medium → High → Urgent) are the only two semantic colour families outside mint/ink. They are built from controlled hue rotations around the brand's mint seed, never arbitrary, and they never share a hue path so they stay legible when placed together on a single card.
* **Polarity-Flip Rhythm:** * *Light Mode:* Light surface → dark ink promo/empty-state band → light surface. The dark band is where mint gets to glow against true near-black, creating the single highest-contrast moment in the UI.
    * *Dark Mode:* The rhythm reverses. The rare "flip band" is a light mint-tinted card used for the most important empty-state or upsell moments.
* **Brand Iconography:** The checkmark from the logo recurs as the system's "done" glyph everywhere — task completion, onboarding steps, confirmation toasts — rather than a generic checkmark icon, tying every completion state back to the brand mark.
* **Elevation Language:** Light mode uses flat layouts with subtle elevation shadows on hover/drag. Because shadows do not read against a dark background, Dark mode replaces shadows entirely with a 1px hairline border plus a translucent mint-tinted outer glow (`{colors.primary-glow}`) on hover/active states.

---

## Colors

### 1. Brand & Accent

| Token | Light Mode Hex | Dark Mode Hex | Description |
| :--- | :--- | :--- | :--- |
| `{colors.primary}` | `#75EE8F` | `#75EE8F` | **Mint.** The brand's one constant true accent. Every primary CTA pill, active nav indicator, focus ring, and logo mark. |
| `{colors.primary-deep}` | `#66EF87` | `#66EF87` | **Mint Deep.** Logo tail/shadow tone. Used for hover/pressed states on mint surfaces and two-tone brand moments. |
| `{colors.primary-tint}` | `#F0FFF6` | — | **Mint Tint.** Logo ghost-wordmark tone. Near-invisible brand wash for selected rows or sidebar item hovers. |
| `{colors.primary-glow}` | — | `rgba(117,238,143,0.18)` | **Mint Glow.** Dark-mode-only translucent wash used as an outer glow on hover/active states to replace shadows. |
| `{colors.ink-elevated}` | `#171C1A` | `#1D2621` | **Ink Elevated.** Near-black/deep-charcoal used for elevated surfaces inside dark/translucent panel layouts. |

### 2. Surface Stack

| Token | Light Mode Hex | Dark Mode Hex | Description & Mode Rules |
| :--- | :--- | :--- | :--- |
| `{colors.canvas}` | `#FFFFFF` | `#0F1512` | Default page background. Dark canvas is brand-tinted near-black, never pure `#000000`. |
| `{colors.canvas-soft}` | `#FAFEFB` | `#151E1A` | **Card & Panel Fill.** Light mode optimized to an ultra-light, near-white brand tint. Dark mode steps one layer up from canvas. |
| `{colors.canvas-softer}` | `#F4FDF6` | `#1D2621` | **Nested Fill & Column Fill.** Light mode uses a highly-diluted mint-gray. Dark mode uses it for nested inputs/board backgrounds. |
| `{colors.surface-pressed}`| `#D3FCDD` | `#242E29` | Pressed-state fill for soft pills, chips, and subtle buttons. |
| `{colors.hairline}` | `#E2EFE5` | `#2A3530` | Border colour for card edges, dividers, and input outlines. |

### 3. Text Roles

| Token | Light Mode Hex | Dark Mode Hex | Description |
| :--- | :--- | :--- | :--- |
| `{colors.ink}` | `#0D120F` | `#0D120F` | Primary text in Light Mode. In Dark Mode, reserved *exclusively* for text placed on top of light/mint surfaces (e.g., primary buttons). |
| `{colors.on-dark}` | `#FFFFFF` | `#F4FBF6` | All text on dark surfaces. Dark mode hex is a whisper-warm near-white carrying the mint undertone. |
| `{colors.body}` / `{colors.on-dark-body}` | `#5E5E5A` | `#A9B6AD` | Secondary text — captions, sub-headings, supporting copy. |
| `{colors.hairline-mid}` | `#4B4B47` | — | Mid-gray for muted link text inside footer columns and breadcrumbs (Light Mode). |
| `{colors.mute}` / `{colors.on-dark-mute}` | `#A3A39C` | `#6B756E` | Lightest text role — placeholder text, fine print, low-priority metadata, disabled states. |
| `{colors.on-mint}` | `#0D120F` | `#0D120F` | Text and icons placed directly on mint-filled surfaces. Ink, not white, to pass contrast. |

### 4. Semantic — Status (5-step ramp)
A single ordered ramp walking from a cool neutral through the brand hue to a settled deep green — so "done" always reads as the most resolved, saturated state.

* **Light Mode Statuses (Text on Tint):**
    * **Backlog (`{colors.status-backlog}`):** `#A3A39C` on `#F1F1EE`
    * **To do (`{colors.status-todo}`):** `#4B4B47` on `#EDEDE9`
    * **In progress (`{colors.status-progress}`):** `#1AD141` on `#E8FBEC` (Brand hue at working saturation)
    * **In review (`{colors.status-review}`):** `#15AD36` on `#DFF7E5`
    * **Done (`{colors.status-done}`):** `#0C641F` on `#D8F3DD` (Deepest point, echoing logo checkmark)
* **Dark Mode Statuses (Luminous Text on Deep Tint):**
    * **Backlog (`{colors.status-backlog}`):** `#9CA89E` on `#1B2420`
    * **To do (`{colors.status-todo}`):** `#C7D0C9` on `#1D2A20`
    * **In progress (`{colors.status-progress}`):** `#63E980` on `#163B1E`
    * **In review (`{colors.status-review}`):** `#3CDD5E` on `#18391F`
    * **Done (`{colors.status-done}`):** `#75EE8F` on `#163B1E` (Mint at full brand brightness)

### 5. Semantic — Priority (4-step ramp)
Priority never shares a hue with status, running warm-to-cool instead of light-to-dark.

* **Urgent (`{colors.priority-urgent}`):** Light Mode: `#E0451C` \| Dark Mode: `#FF6B42`. Warm flame-orange-red. The only warm colour in the entire system, reserved exclusively for urgency so its rarity carries real signal.
* **High (`{colors.priority-high}`):** Light Mode: `#C77D17` \| Dark Mode: `#E5A33D`. Amber.
* **Medium (`{colors.priority-medium}`):** Light Mode: `#2563AC` \| Dark Mode: `#5B9AE0`. Cool blue — reads as "default/neutral priority" against warm tones.
* **Low (`{colors.priority-low}`):** Light Mode: `#7A7A74` \| Dark Mode: `#8C8C85`. Neutral gray, lowest visual weight.

### 6. Interactive Links
* **Link (`{colors.link}`):** Light Mode: `#15AD36` \| Dark Mode: `#63E980`. Uses the brand ramp's "in review/luminous" tone rather than standard browser blue.

### 7. User-Created Tag & Label Palette
A 6-colour rotation built around the brand hue plus controlled neighbours, used as tint-background + saturated-text:

| Tag Family | Light Mode (Text on Tint Background) | Dark Mode (Text on Deep Tint Background) |
| :--- | :--- | :--- |
| **Mint** | `#15AD36` on `#DFF7E5` | `#63E980` on `#163B1E` |
| **Teal** | `#0E7C7B` on `#E1F4F3` | `#4DC9C7` on `#13302F` |
| **Blue** | `#2563AC` on `#EAF1FB` | `#5B9AE0` on `#162A3D` |
| **Violet** | `#6D43D6` on `#F0EBFC` | `#9B7FE8` on `#251D3D` |
| **Amber** | `#C77D17` on `#FBF1E3` | `#E5A33D` on `#332714` |
| **Coral** | `#E0451C` on `#FCEAE3` | `#FF6B42` on `#3D1F14` |

---

## Typography

### Font Family
One typeface, two weight bands, carries the entire system. Poppins is loaded via Google Fonts. Fallback stack: `'Poppins', 'Inter', -apple-system, sans-serif`.
1.  **Poppins (600/700):** Display and headline roles. Sizes 20px (`display-sm`) to 52px (`display-xxl`). Tight 1.2 – 1.25 line heights.
2.  **Poppins (400/500):** Body, button, label, and small headings (12px – 18px). Tracking is always neutral.

> **Dark Mode Legibility Rule:** Poppins 400 can feel thin against a dark canvas at small sizes. Where `body-sm` (14px/400) text sits directly on `{colors.canvas}` rather than an elevated card surface, step up to weight **500** to preserve legibility.

### Hierarchy Table

| Token | Size | Weight | Line Height | Use Cases |
| :--- | :--- | :--- | :--- | :--- |
| `{typography.display-xxl}` | 52px | 700 | 64px | Marketing hero headlines. |
| `{typography.display-xl}` | 36px | 700 | 44px | Page section headlines, onboarding titles. |
| `{typography.display-lg}` | 32px | 700 | 40px | Promo-card headlines, empty-state titles. |
| `{typography.display-md}` | 24px | 600 | 32px | Card titles, modal headings. |
| `{typography.display-sm}` | 20px | 600 | 28px | Sub-card headings, column titles. |
| `{typography.body-lg}` | 18px | 500 | 24px | Lead paragraphs and larger body. |
| `{typography.body-md}` | 16px | 400 | 24px | Default paragraph body. |
| `{typography.body-md-strong}`| 16px | 500 | 20px | Bolded inline body and most button labels. |
| `{typography.body-sm}` | 14px | 400 | 20px | Captions, secondary metadata, task card body. |
| `{typography.body-sm-strong}`| 14px | 500 | 16px | Bold caption / chip labels / status pills. |
| `{typography.caption}` | 12px | 400 | 16px | Fine print, task IDs, timestamps. |
| `{typography.button-large}` | 18px | 500 | 24px | Large rounded buttons inside onboarding/auth flows. |
| `{typography.button-md}` | 16px | 500 | 20px | Default button labels. |

---

## Layout & Spacing

* **Base Spacing Unit:** 4px.
    * `{spacing.xxs}`: 4px · `{spacing.xs}`: 6px · `{spacing.sm}`: 8px · `{spacing.md}`: 12px · `{spacing.lg}`: 16px · `{spacing.xl}`: 20px · `{spacing.2xl}`: 24px · `{spacing.3xl}`: 32px.
* **Padding Rules:**
    * *App Shell Bands:* `{spacing.2xl}` 24px (onboarding/marketing steps up to `{spacing.3xl}` 32px).
    * *Task Card Interior:* `{spacing.md}` 12px to keep board layouts dense and scannable.
    * *Modal/Onboarding Interior:* `{spacing.2xl}` 24px for a more generous feel.
* **Gaps:** Button rows, chip rows, avatar stacks use `{spacing.sm}` 8px layout gaps. Board columns use `{spacing.lg}` 16px gaps.
* **Sizing Constraints:**
    * *Sidebar:* Fixed 248px on desktop (collapses to 64px or hides below 900px).
    * *Board Columns:* Fixed 296px width, unconstrained horizontal scroll layout patterns.
    * *Max Content Width:* ~1200px for list/timeline views.

---

## Components

### 1. Buttons
* **`button-primary`** — Mint fill, ink text. `{colors.primary}` background, `{colors.on-mint}` text, `{rounded.pill}`, `{typography.button-md}`. Hover transitions to `{colors.primary-deep}`. High contrast element by design in both modes.
* **`button-secondary-contextual`** — High-emphasis secondary action that shouldn't compete with mint (e.g. "Delete project" confirmation).
    * *Light Mode (`button-secondary-dark`):* `{colors.ink}` background, `{colors.on-dark}` white text, `{rounded.pill}`.
    * *Dark Mode (`button-secondary-light`):* `{colors.on-dark}` near-white background, `{colors.ink}` text, `{rounded.pill}`.
* **`button-secondary`** — In Light Mode: `{colors.canvas}` fill, 1px `{colors.hairline}` border. In Dark Mode: `{colors.canvas-soft}` fill, 1px `{colors.hairline}` border. Combined with `{colors.on-dark}` text and `{rounded.pill}`.
* **`button-subtle`** — Soft background button.
    * *Light Mode:* `{colors.canvas-soft}` background, `{colors.ink}` text.
    * *Dark Mode:* `{colors.canvas-softer}` background, `{colors.on-dark}` text.
    * *Pressed State:* Steps up to `{colors.surface-pressed}` in both modes.
* **`button-icon`** — Circular icon-only control. 34px square, `{rounded.full}`. `{colors.canvas-soft}` background base. Light mode hover transitions to `{colors.canvas-softer}`. Dark mode hover adds a `{colors.primary-glow}` outer ring.

### 2. Status & Priority Chips
* **`status-chip`** — Text and background paired directly from the respective mode's status ramp. Always `{rounded.pill}`, `{typography.body-sm-strong}`, configured with `{spacing.xxs} {spacing.sm}` padding.
* **`priority-flag`** — Icon + label pair with no background fill. Text-only execution using the respective priority ramp color, paired with a small glyph (flame for urgent; bars for high/medium/low). Set to `{typography.caption}` weight 600.

### 3. Cards
* **`task-card`** — Configured to `{rounded.lg}` 12px with a 1px `{colors.hairline}` border. 
    * *Light Mode:* `{colors.canvas}` background. Level-0 flat by default, Level-1 shadow on hover/drag. Interior padding `{spacing.md}`.
    * *Dark Mode:* `{colors.canvas-soft}` background. Drop shadows are omitted; hover/drag interactions apply `{colors.primary-glow}` as an outer halo.
* **`empty-state-card` (Polarity-Flipped Core)** — A card that flips the standard interface polarity. Uses `{rounded.xl}` 16px. Large mint checkmark glyph centered inside.
    * *Light Mode:* `{colors.ink}` background, `{colors.on-dark}` text.
    * *Dark Mode:* `{colors.on-dark}` near-white background, `{colors.ink}` text, with the checkmark rendered in `{colors.primary-deep}`.

### 4. Navigation Layouts
* **`sidebar`** — Left-hand core app navigation.
    * *Light Mode (`sidebar-dark`):* Uses a dark polarity-flip style. `{colors.ink}` background, `{colors.on-dark}` text, `{colors.on-dark-mute}` for inactive items. Active nav items flip to a white background with ink text.
    * *Dark Mode:* Inherits the standard canvas style. `{colors.canvas-soft}` background, `{colors.on-dark}` text, `{colors.on-dark-mute}` for inactive items. Active nav items transition to a full `{colors.primary}` mint background with `{colors.on-mint}` ink text.
* **`nav-dot`** — 8px circular swatch preceding project profiles in nav panels, drawing from a rotating set of brand-adjacent tag colors.

---

## Do's and Don'ts

### Do
* **Do** reserve `{colors.primary}` mint for the single highest-emphasis action per view. One mint pill per visible viewport maintains clear action hierarchy.
* **Do** keep status and priority on their separate ramps — never reuse a status colour for priority or vice versa, ensuring the two systems stay independently legible on the same card.
* **Do** use the polarity-flip rules for empty states and high-stakes confirmations — this produces the optimal contrast moments for the brand.
* **Do** step `body-sm` text to 500 weight in dark mode when it sits directly on the core canvas layer to maintain readable rendering.
* **Do** ensure that the dark canvas carries its faint brand-green undertone (`#0F1512`) rather than defaulting to generic deep blacks.

### Don't
* **Don't** use white text on mint fills — `{colors.on-mint}` is always ink. Mint at `#75EE8F` is too light for white text to clear comfortable contrast guidelines.
* **Don't** mathematically invert light-mode hex values to generate dark-mode colors. The dark-mode ramp has been re-tuned for true contrast readability.
* **Don't** introduce pure `#000000` anywhere in the dark surface layout stack.
* **Don't** apply standard drop shadows to dark-mode cards. Use the hairline border + glow pattern instead.
* **Don't** drop Poppins below weight 400 for body text or above 700 for display layers — the system contains no light or black-weight roles.
* **Don't** render task cards at `{rounded.xl}` 16px — that radius is reserved for modal/onboarding surfaces so the density difference between "board" and "focused flow" stays visually legible.