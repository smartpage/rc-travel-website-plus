## Live Design Editing — Quick Overview (API-first, swappable local DB)

- How to open: append `?design=1` to any URL.
- Preview: updates an in-memory working copy in `DesignContext` (instant UI), no network.
- Save: sends PUT to the design API (`/organizations/{orgId}/sites/{siteId}/design`). No content CRUD here.
- Scope: click any section to focus; Inspector edits `design.sections[<sectionId>]` tokens (e.g., padding), plus globals (e.g., `colors.primary`).
- Swappable data source:
  - Now: API-only (backed by Firestore via your backend).
  - Local JSON DB option: point the same interface to `/design-api/design` (json‑server) for rapid local edits; later swap back to Firestore without UI changes.

### Interface (single contract)
- `updateDesignLocal(updater)`: apply preview to working copy (no network).
- `saveDesignToAPI()`: persist full design to current backend (API or local DB endpoint when enabled).
- `refreshDesign()`: reload from backend, discarding unsaved preview.

```mermaid
flowchart LR
  A[Editor Overlay (?design=1)] -- click section --> S[data-section-id]
  A -- Preview --> W((Working Copy))
  W -->|instant| UI[Live UI]
  A -- Save --> P{Endpoint}
  P -- API --> B[Your Backend]
  B --> F[Firestore]
  P -- Local DB (opt) --> J[json-server /design]
```

> Swap strategy: only the endpoint changes (API vs `/design-api/design`); the Inspector and UI remain identical.

## RC Travel Website Plus — Frontend Editor Upgrade Plan (Craft.js + Token System)

### Objective
- **Build a modular, token-driven, WYSIWYG-like editor mode** on top of the current manifest architecture without breaking production rendering.
- **Single source of truth** remains the exported `design` JSON and `siteIndex.json`; editor applies JSON patches only.

### Non-Goals
- Replacing rendering runtime. The live site continues to render via `DynamicRenderer` + contexts.
- Changing content schema radically. Content edits are optional and must remain JSON-compatible.

### Guardrails
- Editor toggled by flag/route only (e.g., `?edit=1`), never auto-enabled.
- All writes are JSON patches; maintain a **diff + undo** stack.
- Enforce `Section` ownership of layout/typography. No arbitrary CSS.

## Milestones & Gating Confirmations

### Phase 0 — Baseline & Branching
- [ ] Confirm repo state green: `npm run build` passes.
- [ ] Create `feature/editor-mode` branch.
- [ ] Confirm local JSON DB (`/design-api/design`) works at dev startup.

### Phase 1 — Token Schema & Adapters
- [ ] Define/lock Zod `DesignSchema` including breakpoints: `mobile`, `tablet`, `desktop`.
- [ ] Add `design.overrides` subtree for instance-level styles (keyed by node id).
- [ ] Adapter API:
  - `getDesign()`
  - `patchDesign(patches[])` (RFC6902)
  - `batchPatch(patches[])` with optimistic update + rollback on fail
- [ ] Confirmation: Schema validated against current `design`; no runtime breaks.

### Phase 2 — Editor Shell (Craft.js)
- [ ] Install Craft.js, create `EditorShell` route and `?edit=1` gate.
- [ ] Add viewport toolbar: Desktop (1280px), Mobile (390px), custom width slider.
- [ ] Implement undo/redo, save, and autosave debounce (e.g., 500–800ms).
- [ ] Confirmation: Editor renders current site tree read-only.

### Phase 3 — Node Wrappers (Token-Aware)
- [ ] `SectionNode` wraps real `Section` with `sectionId` prop.
- [ ] `SectionTitleNode` wraps `SectionTitle`.
- [ ] Optional: `TabGridNode`, `CardGridNode` read-only for first cut.
- [ ] Map node props to token paths (no inline CSS). Use precedence:
  - overrides → section tokens → component defaults → global tokens.
- [ ] Confirmation: Rendering identical to non-editor mode.

### Phase 4 — Inspector (Panels + Breakpoint Tabs)
- [ ] Inspector Right Dock with tabs:
  - Design (global): `colors`, `typography`, `buttons`, `sliderOptions`.
  - Section (per `sectionId`): `sections[*].layout` (padding, background, overlay, inner).
  - Overrides (instance): writes to `design.overrides[nodeId]`.
  - SiteIndex (structure): reorder/toggle `sections`, edit `internalComponents` props.
- [ ] For each editable control provide breakpoint switcher (Mobile/Desktop).
- [ ] Confirmation: Changing tokens reflects live on canvas immediately.

### Phase 5 — Persistence & Diffs
- [ ] JSON Patch generator from form deltas.
- [ ] Optimistic apply to `DesignContext`; queue server PATCH.
- [ ] On failure, rollback and show toast with diff.
- [ ] Confirmation: Network toggle test proves offline safety.

### Phase 6 — SiteIndex Editing (Structure)
- [ ] Craft reorder of top-level nodes updates `siteIndex.sections` order.
- [ ] Toggle `isActive` per section.
- [ ] Add/remove internal components within allowed types (e.g., TabGrid).
- [ ] Confirmation: Non-editor route respects updated manifest.

### Phase 7 — Instance Overrides
- [ ] Add `design.overrides[nodeId]` for allowed slots (spacing, alignment, bg opacity, etc.).
- [ ] Implement resolver merging order at render-time.
- [ ] Confirmation: Overrides persist and survive reload.

### Phase 8 — Content Editing (Optional for Pass 1)
- [ ] Bind active section content JSON to a form (Zod-validated).
- [ ] Save path mirrors `ContentContext` (dev: local JSON fallback; prod: API).
- [ ] Confirmation: No schema drift; components re-render safely.

### Phase 9 — RBAC & Safety
- [ ] Add `EDITOR_ROLE` gate to `/editor` route.
- [ ] Add “Preview only” mode with disabled writes.
- [ ] Confirmation: Unauthorized users cannot write.

### Phase 10 — Versioning, Undo/Redo & Snapshots
- [ ] In-memory undo/redo stack with patch inversion.
- [ ] Snapshot export/import of `design` and `siteIndex`.
- [ ] Confirmation: Full round-trip of snapshot works.

### Phase 11 — Telemetry & Audit
- [ ] Log: user, timestamp, patch summary.
- [ ] Diff viewer modal (before/after for current selection).
- [ ] Confirmation: Audit logs present for all writes.

### Phase 12 — A11y/Perf/QA
- [ ] Check keyboard nav in Inspector; focus traps.
- [ ] Canvas performance: large images, Embla slider with tokens.
- [ ] E2E: flows for edit/save/undo/viewport switch.
- [ ] Confirmation: Lighthouse no regressions > baseline.

## Nitty-Gritty Implementation Steps

### 1) Token & Override Foundations
- [ ] Extend `DesignSchema` to include:
  - `sections: Record<sectionId, SectionConfig>` with `layout.padding.{mobile,tablet,desktop}`
  - `overrides: Record<string, Partial<OverridableSlots>>`
- [ ] Add `resolveTokens(nodeId, sectionId, componentName)` utility:
  - Merge order: overrides[nodeId] → sections[sectionId] → componentDefaults[componentName] → globals
- [ ] Add `tokenPath(path: string)` helper for safe get/set.

### 2) Persistence Adapter
- [ ] Implement `patchDesign(patches: JsonPatch[])` (RFC6902):
  - Validate patch targets with Zod pre-check.
  - Queue with debounce; coalesce by path.
  - Optimistic update to `DesignContext`.
  - On error: inverse patches applied; toast with details.

### 3) Editor Shell
- [ ] Route `/editor` or `?edit=1` gate with `EditorShell`.
- [ ] Toolbar: viewport selector, undo/redo, save, snapshot, exit.
- [ ] Canvas container sets width for Desktop/Mobile; centers with dark backdrop.

### 4) Craft Integration
- [ ] Install Craft.js, create resolvers map: `{ SectionNode, SectionTitleNode, TabGridNode }`.
- [ ] Serialize from `siteIndex.sections` → Craft JSON on mount.
- [ ] Lock disallowed operations (no free nesting; only allowed child nodes).
- [ ] Selection highlights: outline + breadcrumbs (`Home > Hero > Title`).

### 5) Inspector Panels
- [ ] Global Design panel: color pickers, font selectors, button presets, slider options.
- [ ] Section panel: padding (per breakpoint), bg (color/image/overlay), inner rounding/overflow.
- [ ] Overrides panel: exposed subset (e.g., marginTop, textAlign, dot colors for a specific slider instance).
- [ ] SiteIndex panel: toggle, reorder, internal component controls.

### 6) Confirmations & Reviews (per milestone)
- [ ] Design token edits affect all relevant nodes immediately.
- [ ] Section edits scoped to `sectionId` only.
- [ ] Overrides strictly limited, never mutate globals.
- [ ] SiteIndex reorder confirmed by navigating non-editor route.

### 7) Testing
- [ ] Unit: token resolver precedence, patch inversion.
- [ ] Integration: Inspector → patch → DesignContext state → rendered styles.
- [ ] E2E: Cypress/Playwright flows across desktop/mobile.

## JSON Patch Examples
- Change primary color:
```
[
  { "op": "replace", "path": "/colors/primary", "value": "#FF7A00" }
]
```
- Update hero padding (mobile):
```
[
  { "op": "replace", "path": "/sections/hero/layout/padding/mobile", "value": "6rem 1rem" }
]
```
- Instance override (nodeId=abc123) title alignment on desktop:
```
[
  { "op": "add", "path": "/overrides/abc123/title/textAlign/desktop", "value": "left" }
]
```

## Risk Register & Mitigations
- **Risk**: Style drift via overrides.
  - **Mitigation**: Whitelist fields; Inspector guards; diff viewer.
- **Risk**: Breakpoint inconsistencies.
  - **Mitigation**: Single source in tokens; required mobile/desktop pair validation.
- **Risk**: Craft serialization mismatch with `siteIndex`.
  - **Mitigation**: Source of truth remains `siteIndex`; Craft is a view; reconcile with clear diff.
- **Risk**: Performance regressions.
  - **Mitigation**: Debounced patches; memoized token resolution; image lazy.

## Rollback Plan
- Disable editor flag; restore last known-good snapshot of `design` and `siteIndex`.
- Re-run `npm run build` smoke test.

## Acceptance Checklists (per phase)
- **P1 Schema**
  - [ ] Zod passes on `design` and default fallback
  - [ ] Overrides subtree recognized in resolver
- **P2 Shell**
  - [ ] Viewport switch works; canvas resizes without reflow/glitches
  - [ ] Undo/redo works for last 20 edits
- **P4 Inspector**
  - [ ] Global/Section/Overrides panels function with breakpoint tabs
  - [ ] Invalid inputs blocked by Zod with helpful errors
- **P6 SiteIndex**
  - [ ] Reorder + toggle persist, reflected on non-editor route

## Timeline (indicative)
- Week 1: P1–P3 (schema, shell, nodes)
- Week 2: P4–P5 (inspector, persistence)
- Week 3: P6–P7 (siteIndex + overrides) and QA
- Week 4: P8–P12 (content edits, RBAC, telemetry) + hardening

## Ownership
- Editor Shell/UX: FE Lead
- Token Schema/Adapters: Platform FE
- Craft Nodes/Inspector: Component Team
- QA/E2E: QA Eng

## Confirmations Required Before Build
- [ ] Approve `DesignSchema` changes (incl. `overrides` subtree)
- [ ] Approve allowed override fields per component
- [ ] Approve SiteIndex edit scope (add/remove vs reorder/toggle only)
- [ ] Approve RBAC policies for editor access

---

## Content Editing Model (Text, Cards, Grids)

### Goals
- Keep content data in JSON (per current `ContentContext`), with strong schemas and predictable IDs.
- Provide a smooth editing UX for strings, rich text, arrays (cards), and cross-referenced lists (tabs → cardIds), without breaking the manifest.

### Integration with Craft.js
- Treat Craft as the “canvas” and selection system. Content is edited via Inspector panels, not by making the Craft tree the source of content.
- Selected node determines which content document and path to bind:
  - HeroSection → `heroContent.json`
  - TravelPackages (TabGrid) → `travelPackagesTabCardsContent.json` (`tabs[]`, `cards[]`)
  - Testimonials → `testimonialsContent.json` or `testimonialsTabCardsContent.json`

### Content Panels (per component type)
- Strings: inputs/textareas with live preview; optional markdown toggle for long text.
- Arrays (cards): sortable list UI with Add / Duplicate / Delete; stable `id` per card.
- Cross-refs: tabs contain `cardIds[]`; validate referential integrity on every change.
- Rich text (optional later): tiptap/lexical editor bound to a string field; saved as HTML/MD in JSON.

### Data plumbing
- `ContentContext` remains the runtime source. Editor writes via a `contentAdapter`:
  - `getContent(sectionName)`
  - `patchContent(sectionName, patches[])` (RFC6902)
  - Dev: json-server endpoints (e.g., `/content/hero`) or local JSON fallback
  - Prod: existing API at `/api/organizations/{org}/sites/{site}/content`
- Zod schemas per content doc guard edits; invalid forms cannot save.
- Optimistic updates with rollback on failure; toast with diff of rejected change.

### Arrays and IDs
- Each list item (card, testimonial, FAQ) must have a stable `id`.
- TabGrid pattern (refactor baseline already aligned):
  - `cards[]` is the source of truth
  - `tabs[].cardIds[]` references cards
  - Moves across tabs only touch `cardIds` arrays; card stays single-sourced

### Should content be “embedded into Craft”?
- No for structure; yes for selection. Keep content as JSON and use Inspector forms to edit. This preserves our manifest (siteIndex) and keeps rendering deterministic. Craft’s tree mirrors `siteIndex`, not content objects.

---

## Two‑Tier Rollout Recommendation (Design → Content)

1) Phase A — Design Editor (recommended first)
- Token schemas, Inspector, breakpoints, persistence. Lowest risk; immediate value; no content schema churn.

2) Phase B — Content Editor
- After design is stable, add content panels per section type with Zod schemas and adapters.
- Rationale: content editing introduces array ops, cross-refs, upload flows, and more validation edge cases; better to harden the editor shell first.

---

## Design Profiles (Themes) — One‑Click Whole‑Site Swap

### Requirements
- Switch the entire design system with a single action.
- Keep multiple profiles for A/B/clients, with cloning and safe rollback.

### Data model (JSON)
```json
{
  "activeProfile": "rc_black_yellow",
  "profiles": {
    "rc_black_yellow": { /* full DesignConfig */ },
    "nw_white_blue":   { /* full DesignConfig */ }
  }
}
```
- Optionally split storage for scale:
  - `design/activeProfile`
  - `design/profiles/{profileId}` → `DesignConfig`

### Runtime resolution
- `DesignContext` loads `activeProfile` and the corresponding `DesignConfig`.
- Editor writes patches under `profiles[activeProfile]`.
- A “Profile Switcher” in the toolbar sets `activeProfile` with confirmation.

### Inheritance (optional)
- Add `baseProfile` and a small resolver to merge `base` → `profile` → `overrides`.
- Useful for sharing brand primitives (colors/type) while letting sections diverge per client.

### Editor UX for profiles
- Toolbar: Profile selector (dropdown) + Duplicate + Rename + Delete (guarded if in use).
- Diff viewer: show delta between profiles for auditing.

### Rollout & Safety
- Snapshot on profile switch; allow one-click revert.
- RBAC: limit profile creation/deletion to admins.

### Migration plan
- Lift current `design` into `profiles.default` and set `activeProfile = "default"`.
- Future profiles created by cloning `default`.


