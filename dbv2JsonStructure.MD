# dbV2 JSON Structure (Top‑Down Map)

This guide gives a compact index first, followed by a practical deep‑dive into how keys relate to: components, tokens, the Design Inspector, and the end‑to‑end flow to add a new editable design element.

## 0) Quick Index (Where things live)

- `tokens` (global design tokens)
  - `colors.*` – brand palette and UI colors
  - `typography.*` – families, sizes, weights, line-height, color for typographic systems
  - `spacing.*` – scales and utilities (optional)
  - `shadows`/`radii` – elevation and rounding presets (optional)

- `components` (UI component tokens)
  - `button.variants.*` – primary/secondary/tab tokens
  - `logos.*` – logo sizes/fits
  - `primaryCards.*` – shared card class presets (borders/rounded/shadow/hover)
  - `serviceCard`/`travelPackageCard`/`testimonialCard`/`whyFeatureCards` – per‑component editable style tokens
  - `slider.*` – Embla slider tokens, e.g., `gap`, `slidesToShow`

- `sections.*` (layout tokens per page section)
  - `hero`/`packages`/`travelDesigner`/`testimonials`/... – layout backgrounds, paddings, inner container settings

> Runtime source of truth: loaded into `DesignContext` and edited via the Inspector using `updateDesignLocal`. Saved to `/public/dbV2.json`.

---

## 1) Essential Keys by Concern

- Typography (per element)
  - `tokens.typography.<systemKey>.*` → Used by components reading inline styles
  - Bind via `data-typography="<systemKey>"` in JSX and map in the resolver

- Component styling
  - `components.<componentKey>.*` → Inline styles (background, border, radius, padding, maxWidth, etc.)
  - Ex: `components.testimonialCard.gap`, `components.travelPackageCard.imageHeight`

- Section layout
  - `sections.<sectionId>.layout.*` → Section background, padding, inner container

- Slider (Embla)
  - `components.slider.gap` (px or CSS unit; also accepts `{ mobile, tablet, desktop }`)
  - `components.slider.slidesToShow = { mobile, tablet, desktop }`

---

## 2) Top‑Down Hierarchy & Flow

1) DOM hint
   - Add `data-typography` or `data-card-type` on elements/roots to hint the editor and resolver.

2) Resolver mapping → token path
   - Hints are matched to `tokens.typography.*` (and in some panels to `components.*`).
   - The Inspector renders controls from these resolved token paths.

3) Component binding
   - Components must consume tokens directly (no `||` fallbacks). Use inline styles reading from `design.tokens.*` or `design.components.*` 

4) Inspector edit → updateDesignLocal
   - Controls write into `design` via `updateDesignLocal`, mutating the in‑memory working copy.

5) Save → dbV2
   - `saveDesignToDBV2()` persists to `/public/dbV2.json`. On success, the working copy becomes the new baseline.

---

## 3) Adding a New Editable Design Element (End‑to‑End)

Example: make a new card subtitle editable.

1) DOM markup
```tsx
<h4 data-typography="myCard.subtitle">{subtitle}</h4>
```

2) Tokens in dbV2.json
```json
{
  "tokens": {
    "typography": {
      "myCardSubtitle": {
        "fontFamily": "Inter, sans-serif",
        "fontSize": "1rem",
        "fontWeight": "500",
        "lineHeight": "1.4",
        "color": "#ffffff"
      }
    }
  }
}
```

3) Resolver mapping (if using explicit mapping)
- Ensure the resolver maps `data-typography="myCard.subtitle"` to `tokens.typography.myCardSubtitle`.

4) Component binding
```tsx
const { design } = useDesign();
<h4
  data-typography="myCard.subtitle"
  style={{
    fontFamily: design.tokens?.typography?.myCardSubtitle?.fontFamily,
    fontSize:   design.tokens?.typography?.myCardSubtitle?.fontSize,
    fontWeight: design.tokens?.typography?.myCardSubtitle?.fontWeight,
    lineHeight: design.tokens?.typography?.myCardSubtitle?.lineHeight,
    color:      design.tokens?.typography?.myCardSubtitle?.color,
  }}
>
  {subtitle}
</h4>
```

5) Inspector control
- In `DesignInspectorContent.tsx`, add a panel/row that targets `tokens.typography.myCardSubtitle.*` via `renderTokenEditor()` or explicit `SmartInput`/`ColorSwatch` for each property.

6) Save flow
- `Save All Changes` → `saveDesignToDBV2()` updates `/public/dbV2.json`.

---

## 4) Slider: Lane‑Filling Slides & Gap

- Slides per view: `components.slider.slidesToShow = { mobile, tablet, desktop }`
- Gap: preferred `components.testimonialCard.gap` → fallback `components.slider.gap` → fallback `16px`
- Runtime:
  - Track sets `--gap` and `margin-left: calc(-1 * var(--gap))`
  - Each slide: `margin-left: var(--gap)` and width: `calc((100% - (n − 1) * var(--gap)) / n)`
- Accepts responsive gaps `{ mobile, tablet, desktop }` and px/rem/number values.

---

## 5) Conventions & Rules

- No `||` fallbacks with token strings. Use `resolveTokenRef(val) ?? fallback`.
- Components read from `design.tokens.*` and `design.components.*` exactly as defined.
- Tokens must be complete for every editable component.
- For cards, include `data-card-type` on the root for proper Inspector routing.

---

## 6) Troubleshooting

- Control appears in Inspector but UI doesn’t change:
  - Component isn’t bound to the token path; add inline style reads.
- Token shows as string like `"tokens.colors.primary"` in the UI:
  - Wrap with `resolveTokenRef()` and use `??` for fallbacks.
- Slider gap doesn’t close:
  - Ensure slide widths fill the lane with the calc formula and track/slide margin pairing.


