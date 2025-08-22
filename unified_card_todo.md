### Unified Card Component – TODO / Design Notes

#### Motivation
- Reduce duplication across `ServiceCard`, `TravelPackageCard`, `TestimonialCard`, `FeatureCard`, `faqCard`, etc.
- Normalize paint/layout paths in `dbV2` so Planner/PathFinder can target cards reliably (e.g., background, border, radius, padding, shadow).
- Keep typography token-driven and section-override friendly.

#### Decision (high level)
- Introduce a single reusable `CardUnified` component with variant “recipes”.
- Keep section wrappers (e.g., `ServicesSection`) but map their data items to a common card data shape via small adapters.
- Default behavior requires no `siteIndex` change; item-level `cardType/cardVariant` is optional.

#### Component API (draft)
- Props:
  - `type`: 'service' | 'testimonial' | 'travelPackage' | 'feature' | 'faq' | 'custom'
  - `variant`: 'standard' | 'highlight' | 'imageHero' | 'condensed' | string
  - `data`: { media?, icon?, eyebrow?, title, subtitle?, description, meta?, badge?, actions?: [{ label, href }] }
  - `layout`: { orientation?: 'vertical'|'horizontal', emphasis?: 'title'|'media', elevation?: 'none'|'sm'|'md'|'lg' }
  - `slotOverrides?`: allow rare bespoke insertions without forking the component

#### dbV2 schema (additions)
- `components.card.variants.<name>` – paint/layout primitives only:
  - `backgroundColor`, `textColor`
  - `borderColor`, `borderWidth`, `borderRadius`
  - `padding`, `shadow`
  - `mediaHeight?`, `headerBarColor?`, `hoverBg?`, `hoverShadow?`
- Typography remains in `tokens.typography.*`:
  - `cardTitle`, `cardBody`, `cardEyebrow`, `cardMeta` (plus existing section-specific like `serviceCardTitle/Description`)
- Optional per-section defaults:
  - e.g., `components.services.defaultCardVariant = 'standard'`

#### Semantic aliases (PathFinder/Planner)
- `aliases['cards background'] → components.card.variants.*.backgroundColor`
- `aliases['card title'] → tokens.typography.cardTitle.*`
- `aliases['card body'] → tokens.typography.cardBody.*`
- Section-aware fallbacks remain (e.g., `serviceCardTitle`) but unified aliases preferred.

#### Adapters (one per section)
- `mapServiceToCard(item) → { type: 'service', variant, data }`
- `mapTestimonialToCard(item) → { type: 'testimonial', variant, data }`
- `mapPackageToCard(item) → { type: 'travelPackage', variant, data }`
- Rules:
  - `variant = item.cardVariant || item.cardType || sectionDefaultVariant || 'standard'`
  - Map existing fields (icon, image, title, description, cta) into card slots.

#### Migration plan (incremental)
1) Seed `components.card.variants.standard|highlight|imageHero|condensed` in `dbV2` with minimal primitives.
2) Build `CardUnified.tsx` to read variant paint + typography families; expose consistent DOM hooks/data-attributes.
3) Implement adapters for Services and Testimonials first; replace their internal cards with `CardUnified`.
4) Expand to `TravelPackageCard` (mind image/media specifics), then `FeatureCard`.
5) Extend aliases in `AIEnhanceContext.buildIndexFromDesign()` for new card paths.
6) Update Planner prompt examples to reference unified card paths.

#### Pros
- Single place for paint/layout logic; fewer bugs and inconsistencies.
- Strong canonical paths for AI; easier PathFinder validation and micro-execution.
- Faster theming: add/edit `components.card.variants.*` without touching components.
- Reusable slots (eyebrow/badge/meta/actions) reduce bespoke code.

#### Cons / Risks
- Over-generalization: some cards (e.g., complex travel packages) need extensions; mitigate with `slotOverrides` and per-type adapters.
- Token sprawl: keep variant schema focused; typography stays in `tokens.typography`.
- Migration effort: refactors across sections; do it incrementally.

#### Editor / Inspector contract
- Clicking a card exposes variant paint controls and slot typography; avoid leaking inner divs.
- Data attributes for selection: `data-card`, `data-card-variant`, `data-typography="cardTitle|cardBody|..."`.

#### AI impact (why this helps)
- Fewer heterogeneous paths → simpler planning; “center card descriptions” becomes a tiny, known set of updates.
- Aliases map “cards background/title/body” directly to unified paths.
- Micro-executor works on small chunks (one variant property) → faster, reliable.

#### Open questions
- Do we need per-section typography defaults (e.g., `services.cardTitle`) or rely on global `cardTitle` with section overrides? Start global; allow optional section overrides.
- Should CTA button be a slot or a sub-variant on the card? Start as a slot, style comes from button tokens.

#### Execution checklist (for later)
- Add `components.card.variants.*` to `dbV2.json` (minimal primitives) [ ]
- Add `tokens.typography.cardTitle` & `cardBody` (alias existing families initially) [ ]
- Implement `CardUnified.tsx` with slots and token resolution [ ]
- Create adapters: services, testimonials, packages [ ]
- Swap ServicesSection to use adapter + `CardUnified` [ ]
- Expand aliases in `buildIndexFromDesign` for unified card paths [ ]
- Update Planner prompt examples to reference unified card paths [ ]
- Validate PathFinder + Micro-Executor against card edits (background, radius, padding, textAlign) [ ]


