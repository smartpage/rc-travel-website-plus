## Design System v2 (additive, AI-friendly, chunkable)

This spec defines an additive schema and workflow to enable fast AI-driven edits on very large design JSON. It keeps the current `design.*` intact for runtime and introduces `designV2.*` for indexing, classes, and targeted chunking.

### Goals
- Backward compatible: keep `design.*` as-is; add `designV2.*` alongside it.
- Ultra-fast “scout” call: send only keys/paths/classes metadata (no values) to determine the minimal payload.
- Second call: send only selected chunks plus dependent classes/tokens.
- First-class class system with precedence and optional locks.
- Breakpoint-aware edits (mobile/tablet/desktop) with prompt-driven scope.

### Data model (additive)
- `design` (v1): unchanged; current runtime consumers keep using this.
- `designV2` (new): structured for chunking and AI edits.

```json
{
  "design": { /* v1 unchanged */ },
  "designV2": {
    "tokens": {
      "colors": { /* leaf values only */ },
      "typography": { /* leaf values only */ },
      "spacing": {},
      "radii": {},
      "shadows": {}
    },
    "components": {
      "button": {
        "defaults": { "$ref": "designV2.tokens" },
        "variants": {
          "primary": {},
          "secondary": {},
          "tab": { "regular": {}, "inverted": {}, "container": {} }
        }
      },
      "tabNav": { "defaults": {}, "variants": {} },
      "card": { "defaults": {}, "variants": {} }
    },
    "sections": {
      "hero": { "layout": {} },
      "packages": { "layout": {} },
      "faq": { "layout": {} },
      "contact": { "layout": {} }
    },
    "classes": {
      "btn.primary": {
        "appliesTo": ["components.button"],
        "extends": ["components.button.variants.primary"],
        "overrides": { /* leaf props only */ },
        "locked": false,
        "selectors": [ { "dataElement": "primaryButton" } ]
      },
      "typo.hero": {
        "appliesTo": ["tokens.typography"],
        "extends": ["tokens.typography.headings"],
        "overrides": {},
        "locked": false,
        "selectors": [ { "dataTypography": "hero_headings" } ]
      }
    },
    "bindings": {
      "dataElement.primaryButton": ["classes.btn.primary"],
      "dataTypography.travelDesignerCard": ["classes.typo.hero"]
    },
    "index": {
      "version": 1,
      "paths": [
        { "id": "tokens.colors", "path": "designV2.tokens.colors", "size": 1200 },
        { "id": "components.button.variants.primary", "path": "designV2.components.button.variants.primary", "size": 800 },
        { "id": "sections.hero.layout", "path": "designV2.sections.hero.layout", "size": 2600 }
      ],
      "aliases": {
        "buttons.primary": "designV2.components.button.variants.primary",
        "typography.hero": "designV2.tokens.typography.hero_headings"
      },
      "refs": [
        { "from": "classes.btn.primary", "to": ["designV2.tokens.colors.primary", "designV2.components.button.variants.primary"] },
        { "from": "designV2.components.tabNav.variants.inverted", "to": ["designV2.tokens.colors.*"] }
      ],
      "checksums": {
        "tokens.colors": "sha256-...",
        "components.button.variants.primary": "sha256-..."
      }
    },
    "meta": {
      "chunkHints": {
        "buttons": ["designV2.components.button", "designV2.tokens.colors", "designV2.tokens.typography"],
        "typography": ["designV2.tokens.typography", "designV2.tokens.colors"]
      },
      "sizeBudgets": {
        "scoutMaxBytes": 20000,
        "chunkMaxBytes": 80000
      }
    }
  }
}
```

Notes:
- Use `$ref` wherever possible to reduce duplication and simplify dependency expansion.
- `classes.*` are reusable bundles, can be applied via DOM bindings and can be `locked`.
- `index.paths` declares chunk boundaries and byte sizes.
- `index.refs` is a dependency graph for transitive inclusion.

### Editor selection model in v2 (bindings-first UI)
- In v1, tokens for the same visual component were scattered and ambiguous.
- In v2, selection resolves to canonical groups, shown first as a binding list; inputs appear below and edit the chosen group.

How resolution works:
1) User clicks an element on the page.
2) Token resolver reads DOM hints like `data-element="primaryButton"` or `data-typography="headings"`.
3) Each hint is looked up in `designV2.bindings` → returns class IDs (e.g., `classes.btn.primary`).
4) Each class “extends” a canonical target (e.g., `designV2.components.button.variants.primary`).
5) The inspector shows these canonical groups at the top; the form inputs below edit that target.

Where edits are written:
- Buttons Primary → `designV2.components.button.variants.primary.*`
- Buttons Secondary → `designV2.components.button.variants.secondary.*`
- Buttons Tab → `designV2.components.button.variants.tab.*`
- Typography chips → `designV2.tokens.typography.*`
- Section chips → `designV2.sections.<sectionId>.layout.*`

Bindings explained:
- `designV2.bindings` is the DOM→class link table. Keys like `dataElement.primaryButton` map to arrays of class IDs.
- Classes (in `designV2.classes`) bundle reusable styles and extend canonical paths. We are not using per‑class overrides yet; edits currently go to canonical paths for global changes.

UI rule:
- Always show the binding list first; keep inputs beneath it. This preserves context and encourages editing canonical groups.

### Precedence rules
`tokens` < `components.defaults` < `components.variants.*` < `classes.*` < `sections.*` < instance overrides.

### Breakpoints
- Represent typography/size props with explicit keys per breakpoint: `fontSize`, `fontSizeMd`, `fontSizeLg`, etc.
- Heuristics from prompt:
  - Mentions of "mobile", "phone", "small" → mobile
  - Mentions of "desktop", "large", explicit large size (e.g. `8rem`) with no device → default to desktop; offer toggle to apply to all breakpoints
  - Mentions of "all devices"/"everywhere" → all breakpoints
- Editor presents a scope control inferred from the prompt, user can adjust before apply.

### Two-call AI flow (scout → enhance)
1) Scout (tiny, fast): send only metadata
   - Include: `designV2.index.paths`, `index.aliases`, `index.refs`, `classes` METADATA only (ids, `appliesTo`, `selectors`, `extends`, `locked`), and the user prompt.
   - Model: a fast one (e.g., `meta-llama/llama-4-scout`).
   - Output:
     ```json
     {
       "includePaths": [
         "designV2.components.button.variants.primary",
         "designV2.tokens.colors"
       ],
       "includeClasses": ["classes.btn.primary"],
       "breakpoints": ["desktop"],
       "policy": { "normalizeOverrides": true, "respectLocked": true }
     }
     ```
2) Server expands dependencies
   - Resolve `index.refs` for transitive deps.
   - Pull exact chunks for the included paths.
   - Add full bodies for included classes.
   - Keep under `meta.sizeBudgets.chunkMaxBytes`; if over, split into multiple batches.
3) Enhance (targeted): send only the expanded chunks + policy
   - Model can be slower/stronger.
   - Returns a patch for only the included paths.
4) Validation & apply
   - Validate patch against schema and allowed paths; reject structural changes unless in "structural mode".
   - Normalize overrides (optional): drop class overrides that equal previous global values so they inherit new tokens.
   - Write to preview state; provide Undo/Reject; persist on approval.

### Multi-pass strategy
- Pass 0: Prompt classification → targets, scope, breakpoints, policy.
- Pass 1: Scout → minimal includePaths/includeClasses, breakpoints.
- Pass 2: Enhance → patch for the selected chunks.
- Pass 3: Normalize → remove redundant class overrides.
- Pass 4: Sync (optional) → mirror v2 → v1 for legacy consumers.

### Merging rules
- Patches are path-based and leaf-only by default:
  ```json
  [
    { "op": "replace", "path": "designV2.tokens.typography.headings.color", "value": "#ffffff" },
    { "op": "replace", "path": "designV2.tokens.typography.headings.fontSizeLg", "value": "8rem" }
  ]
  ```
- For classes:
  - If `locked: true`, skip unless policy says otherwise.
  - If an override equals the old global value, remove it to inherit.
- Conflict resolution (same leaf in multiple chunks): last-writer-wins within a single request; cross-request merges require user review.

### Use cases
- Change all headings to white, 8rem (desktop):
  - Scout includes `tokens.typography.headings`, all `classes.typo.*` that override heading color/size.
  - Enhance updates globals; non-locked class overrides are normalized.
- Set primary button background to `#00ff59`:
  - Scout includes `components.button.variants.primary`, `tokens.colors` if referenced, `classes.btn.primary`.
  - Enhance writes minimal patch; normalization drops redundant overrides.
- Make tab nav use inverted style:
  - Scout selects `components.button.variants.tab.inverted` and dependent tokens; applies class if bound.
- Adjust FAQ typography
  - Scout includes `tokens.typography.faq*` and any overriding `classes.typo.faq*`.

### Backward compatibility
- Keep `design.*` as the runtime source.
- Editor/AI prefer `designV2.*` when present; otherwise fall back to `design.*`.
- Optional sync (behind a flag): after approved changes, mirror v2 → v1 paths (e.g., `buttons.primary` ↔ `components.button.variants.primary`).

### Guardrails
- JSON schema validation for `designV2`.
- Allowed paths whitelist sourced from Scout output.
- Structural changes require explicit opt-in.
- Byte-size budgets enforced per request; split automatically if exceeded.
- Audit trail: store request prompt, selected paths, and resulting patch.

### AI Patch Editing Protocol (simple first, scout later)
- TL;DR: Model returns a minimal patch; we validate and apply. No full JSON round-trips.
- Supported patch formats:
  - RFC‑6902 JSON Patch (op/add/remove/replace/move/copy/test)
  - JSONPath ops (set/insert/delete) wrapped in `{ operations: [...] }`
- Envelope example:
```json
{
  "intent": "Make primary button green",
  "operations": [
    { "op": "replace", "path": "/designV2/components/button/variants/primary/backgroundColor", "value": "#00ff59" },
    { "op": "replace", "path": "/designV2/components/button/variants/primary/borderColor", "value": "#00ff59" }
  ],
  "tests": ["assert $.designV2.components.button.variants.primary != null"]
}
```
- Server flow:
  1) Validate patch schema
  2) Apply to a copy
  3) Validate against `designV2` JSON Schema and invariants (whitelist paths, class lock rules)
  4) If valid → return patched doc; else → return errors or auto‑repair proposal
- Client flow:
  - Preview result instantly; Undo/Reject; Save to persist
- Models: GPT‑4o / Claude 3.5 Sonnet / Gemini 1.5 Pro; OpenRouter Llama for cost‑sensitive
- Later: add the scout call on top to auto-restrict includePaths/includeClasses and breakpoints

### Implementation checklist
- [ ] Add `designV2` skeleton (tokens/components/sections/classes/index/meta).
- [ ] Build indexer to compute `index.paths` (ids, sizes) and `index.refs` (deps graph).
- [ ] Extend AI endpoint: support Scout (metadata only) and Enhance (chunked payload).
- [ ] Editor: prompt parser + breakpoint inference; expose scope controls.
- [ ] Editor: preview/undo; explicit Save to persist; optional v2→v1 sync.
- [ ] Class semantics in editor UI: show `locked`, normalize option, inheritance preview.
- [ ] Schema & guardrails; validation + allowed paths enforcement server-side.

### Open decisions
- Default class behavior: inherit vs locked? (proposal: inherit by default)
- Physical sharding: keep single JSON with virtual chunks (index) vs multi-file storage.
- Auto v2→v1 sync on save or manual mapping only.


