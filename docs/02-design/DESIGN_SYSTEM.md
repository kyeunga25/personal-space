# Design System — Theatrical Cosmos

## 1. Design objective

Create an original personal editorial interface with the warmth of a private journal and the energy of a small stage under a night sky. It should feel expressive without becoming visually noisy or reducing readability.

All public assets and descriptions must remain original and generic. Do not reference or reproduce any existing entertainment property.

## 2. Visual principles

1. **Content first** — decoration frames content; it never competes with text.
2. **Warm night** — dark backgrounds should feel deep and welcoming, not corporate black.
3. **Three accent roles** — red for action, pink for identity/emotion, gold for highlights/status.
4. **Layered depth** — panels, glows, and fine borders create a stage-like depth.
5. **Finite motion** — avoid continuous distracting particle animation.
6. **Different content, different rhythm** — Notes compact, Articles calm, Editions structured.

## 3. Color tokens

```css
:root {
  --space-night-950: #100b18;
  --space-night-900: #171020;
  --space-night-850: #1e1429;
  --space-panel: #261831;
  --space-panel-raised: #30203c;

  --space-text: #fff7ef;
  --space-text-muted: #d9cad5;
  --space-text-faint: #a996a7;

  --space-red: #c63d5d;
  --space-red-strong: #e04b69;
  --space-pink: #ef78a5;
  --space-pink-soft: #f6b0ca;
  --space-gold: #f2c75c;
  --space-gold-soft: #ffe5a0;
  --space-nebula: #75518e;

  --space-border: rgba(255, 238, 246, 0.14);
  --space-border-strong: rgba(255, 229, 160, 0.30);
  --space-shadow: 0 18px 50px rgba(3, 1, 8, 0.36);
  --space-glow-pink: 0 0 40px rgba(239, 120, 165, 0.18);
  --space-glow-gold: 0 0 30px rgba(242, 199, 92, 0.15);
}
```

Light mode is not required for MVP. High-contrast readability is required.

## 4. Typography

Use privacy-friendly system stacks by default:

```css
--font-ui: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", "PingFang TC", "Noto Sans TC", "Noto Sans JP", sans-serif;

--font-reading: ui-serif, "Songti TC", "Noto Serif TC", Georgia, serif;
```

- UI, Notes, metadata: `--font-ui`.
- Long Article body: `--font-reading` when available.
- Edition body may use UI or reading font, but headings should remain editorial and clear.

## 5. Spacing and radius

```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.5rem;
--space-6: 2rem;
--space-7: 3rem;

--radius-sm: 0.625rem;
--radius-md: 1rem;
--radius-lg: 1.5rem;
--radius-pill: 999px;
```

Cards should not all use the same large radius. Notes may be subtle; Edition feature cards may be more theatrical.

## 6. Layout

### Desktop

```text
Left rail: 220–248px
Center column: 680–760px
Right context rail: 280–320px
Maximum canvas: approximately 1360px
```

- Left: navigation and compose action.
- Center: content.
- Right: current channel, tags, archive shortcut, Studio status for owner.

Below approximately 1100px, remove the right rail. On mobile, use a compact top header and bottom navigation.

## 7. Decorative language

Allowed original motifs:

- CSS radial gradients resembling distant stars;
- original four-point and six-point star SVGs;
- thin light-beam gradients;
- ticket-like labels for dates or channels;
- constellation-like dotted separators;
- curved panel highlights;
- abstract wing-like or ribbon-like geometry only when clearly original.

Restrictions:

- no copied logos;
- no character silhouettes;
- no recognizable costumes;
- no traced official icons;
- no copyrighted promotional art;
- no public documentation of private reference sources.

## 8. Content-specific treatments

### Note

- compact card;
- small identity row;
- body is dominant;
- title absent unless supplied;
- media edge-to-edge within card only when useful.

### Article

- wider vertical breathing room;
- optional cover;
- title and excerpt hierarchy;
- focused reader page with maximum line length around 68–75 characters for Latin text and appropriate CJK measure.

### Edition

- channel accent strip or badge;
- date ticket;
- numbered story sections;
- source count and AI-assisted badge;
- gold used sparingly for “selected/highlighted”, not every border.

## 9. Motion

- page transitions: none or very short fade;
- hover lift: 1–2px maximum;
- decorative star twinkle: optional, low frequency, disabled under `prefers-reduced-motion`;
- avoid animated galaxy canvases in MVP.

## 10. Accessibility

- body text contrast should meet WCAG AA.
- never communicate content type or status by color alone.
- focus rings use a bright gold/pink combination with sufficient contrast.
- labels remain visible; placeholders are not labels.
- support 200% browser zoom.
- avoid fixed heights for text cards.
- provide a skip link and semantic landmarks.
