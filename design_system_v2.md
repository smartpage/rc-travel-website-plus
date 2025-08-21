### Executive Summary
- Unified the three design docs into a single, source‑of‑truth specification for RC Travel Website Plus, preserving all information and clearly marking v2 items that supersede earlier guidance.
- Kept v1 runtime tokens and flows intact; integrated the additive v2 model (designV2) for chunking, bindings, and editor/AI workflows. No speculative content added.
- Normalized terminology for tokens, theming, a11y, and component specs. Replacements are limited to sections explicitly marked as v2 or “additive”/new.

### Consolidated Spec
#### Foundations
- Token stores
  - v1 (runtime): design object (colors, typography, sections, components, buttons, sliderOptions, etc.) [DESIGN_SYSTEM.md L21–L39, L41–L95].
  - v2 (additive): designV2 with tokens, components, sections, classes, bindings, index/meta for chunking and AI edits [design_system_v2.md L12–L26, L27–96].
- Contexts and flow
  - DesignContext loads and distributes design; editor applies local preview; save persists to DB [DESIGN_FLOW.md L39–L45, L98–L107; DESIGN_SYSTEM.md L98–129].
  - Editor overlay: selection priority, token resolving, inspector inputs [DESIGN_FLOW.md L45–L57, L72–L87, L88–L97].
- Selection/Resolution
  - v1: element → token via data-typography, semantic tags, background heuristics [DESIGN_FLOW.md L53–L71].
  - v2: DOM hints → bindings → classes → canonical targets (components/tokens/sections) [design_system_v2.md L105–L129].

#### Theming
- v1 theming scope (runtime)
  - Colors (primary palettes and utility categories), navigation, logos, buttons, sections layout, typography variants, slider options [DESIGN_SYSTEM.md L41–L95, L56–L71, L75–L90, L91–95].
- v2 additions (editor/AI)
  - Explicit breakpoints in token families (fontSize/fontSizeMd/fontSizeLg) and binding‑first selection UI [design_system_v2.md L133–L139, L105–L121].

#### Accessibility (a11y)
- The three sources do not define explicit a11y tokens, roles, or contrast requirements. No normative a11y guidance found. Recommend tracking as an open item (see Open Questions).

#### Components (with API tables)
- Section (core wrapper) [DESIGN_SYSTEM.md L136–145]
  - Responsibilities: wrapper structure; inject responsive CSS for padding/background/overlay; style scoping.
  - Props:
    - sectionId: string (key into design.sections)
    - backgroundImageUrl?: string (override)
- SectionTitle [DESIGN_SYSTEM.md L146–151]
  - Props: subtitle, title, description, variant?
- v2 Components structure [design_system_v2.md L27–38]
  - components.button.{defaults, variants.primary|secondary|tab.{regular,inverted,container}}
  - TabNav/Card analogous placeholders (no APIs in sources).

Component API tables (compact)

Section
| Prop | Type | Description | Source |
|---|---|---|---|
| `sectionId` | string | Key in `design.sections` | DESIGN_SYSTEM.md L139–145 |
| `backgroundImageUrl?` | string | URL override | DESIGN_SYSTEM.md L139–145 |

SectionTitle
| Prop | Type | Description | Source |
|---|---|---|---|
| `subtitle` | string | Subtitle text | DESIGN_SYSTEM.md L146–151 |
| `title` | string | Title text | DESIGN_SYSTEM.md L146–151 |
| `description` | string | Description text | DESIGN_SYSTEM.md L146–151 |

Primary Button (v2 canonical target)
| Path | Leafs (types) | Source |
|---|---|---|
| `designV2.components.button.variants.primary` | `backgroundColor`, `borderColor`, `textColor`, `fontSize`, `fontWeight`, `padding`, `borderRadius` (string) | design_system_v2.md L27–38, L117–121 |

Editor/Flow API tables (compact)

Token Resolver (v1)
| API | Description | Source |
|---|---|---|
| `resolveGlobalTokens` | Map element → tokens (data‑typography, tags, background) | DESIGN_FLOW.md L53–L71 |

EditorOverlay
| Contract | Description | Source |
|---|---|---|
| Selection Priority | `data-element|data-typography` → `h1..h6` → `p` → `button,a` → fallback | DESIGN_FLOW.md L72–L80 |

Inspector
| API | Description | Source |
|---|---|---|
| `renderTokenEditor` | Path → read value → control → write back | DESIGN_FLOW.md L88–L97 |

Bindings (v2)
| API | Description | Source |
|---|---|---|
| `designV2.bindings` | DOM hint → class IDs → canonical target(s) | design_system_v2.md L111–121, L123–129 |

### Planner/Executor (v2 additions)
- Scope Evaluator: resolves local vs global from prompt + current selection (local is conservative default unless the prompt explicitly requests site‑wide changes).
- BindMakerGod: planner may emit a `bindingPatch` with `classesToCreate` and `bindingsToAdd` so the executor can create precise, instance‑level bindings (selectors like `{ dataSection, dataTypography }`) before token edits. Executor validates and only accepts those locations, then processes planned token targets.

### Replacements & Rationale
| Replaced Item | Replacement | Rationale | Source Ref(s) |
|---|---|---|---|
| Ambiguous v1 selection grouping in editor | v2 “bindings-first UI” (classes extend canonical targets; inputs edit canonical groups) | design_system_v2 explicitly introduces binding-first selection to reduce ambiguity | design_system_v2.md L105–L129 |
| Unstructured large JSON edits | v2 two-call AI flow with chunking (index.paths, refs, size budgets) | Enables targeted, validated patches; marked as the v2 model | design_system_v2.md L141–169, L65–96 |
| Implicit precedence | v2 precedence (tokens < components.defaults < variants < classes < sections < instance) | Explicit precedence rules defined in v2 | design_system_v2.md L130–132 |

Notes:
- v2 is additive; v1 runtime remains the runtime source unless v2 is present (backward compatibility) [design_system_v2.md L202–206].

### Source Coverage Map
| File | Covered Lines | Notes |
|---|---|---|
| DESIGN_FLOW.md | L1–176 | Full: flow, selection, resolver, inspector, examples |
| design_system_v2.md | L1–255 | Full: v2 data model, bindings, precedence, breakpoints, AI flow, guardrails |
| DESIGN_SYSTEM.md | L1–189 | Full: v1 overview, tokens, components, context/hook, types |

### Insights & Recommendations
- Keep v1 as the runtime baseline; implement v2 structures progressively where editor/AI assistance is required (classes, bindings, index/meta).
- Adopt binding-first selection in the editor to anchor users on canonical targets before exposing leaf edits (reduces drift and duplication) [design_system_v2.md L105–L129].
- Define a11y tokens and policies (contrast thresholds, focus visible, motion preferences) as a dedicated token family to close current gap (no a11y content in sources).
- Add JSON Schema for designV2; enforce allowed path whitelists and class lock semantics server-side (already suggested in v2) [design_system_v2.md L207–213].
- Document Section and SectionTitle prop contracts in the codebase README of components to match this spec and prevent drift.

### Pros & Cons
- Pros
  - v2 enables targeted, validated, and efficient AI/editor flows with clear precedence and binding model.
  - v1 remains stable for runtime, reducing migration risk.
- Cons
  - Dual models increase mental overhead.
  - a11y is unspecified; lacking normative guidance may cause inconsistencies.

### Open Questions/TODOs
- a11y: Define contrast, motion, focus, and ARIA guidance; add a11y token family (N/A in sources).
- Classes/locks: Finalize class lock semantics and override normalization policy in editor UI [design_system_v2.md L185–188, L246–248].
- Physical sharding vs single JSON with virtual chunks: decision pending [design_system_v2.md L251–252].
- v2→v1 sync policy: auto vs manual mapping [design_system_v2.md L202–206, L250–253].
- Extend component API tables for TabNav/Card when their contracts are documented (not in sources).

Citings of replacements
- Binding-first selection and canonical target editing adopted from design_system_v2.md L105–L129.
- Two-call AI flow, chunking, and guardrails adopted from design_system_v2.md L141–169, L65–96, L207–213.
- Precedence rules adopted from design_system_v2.md L130–132.

---

### Accessibility Tokens (A11y) – Additive, in‑file spec
Namespace: `designV2.tokens.a11y`

Token families and purpose
- `colors.contrast.minimum`: string (WCAG ratio e.g., "4.5")
- `focus.outline`: { color: string; width: string; offset: string; style: string }
- `motion.reduced`: boolean | "respect"
- `aria.landmarks`: { header: string; main: string; nav: string; footer: string }
- `visibility.skipLink`: { enabled: boolean; text: string; className: string }

Application rules
- Components MUST respect `motion.reduced` by disabling nonessential animations.
- Use `focus.outline` on interactive elements by default.
- Validate color pairs against `colors.contrast.minimum`.

Editor exposure
- Inspector group: “A11y” with inputs for focus outline and motion.

---

### Bindings & Classes Catalog – Canonical list
Bindings (`designV2.bindings`) map DOM hints to classes:

| DOM Hint | Class IDs | Target |
|---|---|---|
| `dataElement.primaryButton` | `["classes.btn.primary"]` | `components.button.variants.primary` |
| `dataElement.secondaryButton` | `["classes.btn.secondary"]` | `components.button.variants.secondary` |
| `dataTypography.hero_headings` | `["classes.typo.hero"]` | `tokens.typography.hero_headings` |
| `dataTypography.headings` | `["classes.typo.headings"]` | `tokens.typography.headings` |

Reusable classes (`designV2.classes`)

| Class | Extends | Overrides | Applies To |
|---|---|---|---|
| `classes.btn.primary` | `components.button.variants.primary` | `{}` | `components.button` |
| `classes.btn.secondary` | `components.button.variants.secondary` | `{}` | `components.button` |
| `classes.typo.hero` | `tokens.typography.hero_headings` | `{}` | `tokens.typography` |
| `classes.typo.headings` | `tokens.typography.headings` | `{}` | `tokens.typography` |

Lock/Normalization policy
- `locked: true` prevents edits unless explicitly overridden by policy.
- Normalize overrides: if a class override equals the updated canonical value, drop the override to inherit.

---

### v2 → v1 Sync Policy – Operational
Scope: optional, executed on Save when `syncV2toV1 = true`.

Mapping rules
- tokens.typography.* → design.typography.*
- components.button.variants.* → design.buttons.* and/or design.buttonStyles.* where applicable
- sections.<id>.layout.* → design.sections.<id>.layout.*

Procedure
1) Compute diff in v2 paths changed during the session
2) Map each changed path via the rules above
3) Apply to v1 object; validate shape parity
4) Persist both v2 and v1 in the same transaction

Conflict handling
- Last‑writer‑wins within the transaction; prompt user if v1 contains divergent manual changes outside the mapped set.

---

### JSON Schema (designV2) – In‑file baseline
Root
```
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "#/designV2",
  "type": "object",
  "properties": {
    "tokens": { "$ref": "#/defs/tokens" },
    "components": { "$ref": "#/defs/components" },
    "sections": { "$ref": "#/defs/sections" },
    "classes": { "$ref": "#/defs/classes" },
    "bindings": { "$ref": "#/defs/bindings" },
    "index": { "$ref": "#/defs/index" },
    "meta": { "$ref": "#/defs/meta" }
  },
  "required": ["tokens","components","sections"],
  "additionalProperties": false,
  "defs": {
    "tokens": {
      "type": "object",
      "properties": {
        "colors": { "type": "object", "additionalProperties": { "type": "string" } },
        "typography": { "type": "object", "additionalProperties": { "type": "object" } },
        "a11y": { "type": "object", "additionalProperties": true }
      },
      "additionalProperties": true
    },
    "components": {
      "type": "object",
      "properties": {
        "button": { "type": "object", "properties": { "variants": { "type": "object" } } }
      },
      "additionalProperties": true
    },
    "sections": { "type": "object", "additionalProperties": { "type": "object" } },
    "classes": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "extends": { "type": "array", "items": { "type": "string" } },
          "overrides": { "type": "object" },
          "locked": { "type": "boolean" }
        },
        "additionalProperties": true
      }
    },
    "bindings": {
      "type": "object",
      "additionalProperties": {
        "type": "array",
        "items": { "type": "string" }
      }
    },
    "index": {
      "type": "object",
      "properties": {
        "paths": { "type": "array", "items": { "type": "object", "properties": { "id": {"type":"string"}, "path": {"type":"string"}, "size": {"type":"number"} }, "required": ["id","path"] } },
        "refs": { "type": "array", "items": { "type": "object", "properties": { "from": {"type":"string"}, "to": {"type":"array","items":{"type":"string"}} }, "required": ["from","to"] } }
      },
      "additionalProperties": true
    },
    "meta": { "type": "object", "additionalProperties": true }
  }
}
```

Validation & Guardrails
- Enforce `additionalProperties: false` selectively in critical objects during CI.
- Validate “allowed paths” from Scout output before applying patches.

---

### Versioning & Changelog
- Spec version: v2 (this file). Maintain a changelog at the bottom of this file for future revisions.

---

### Test & Review Checklist (non‑UI)
- Schema validation passes (designV2 root + changed subtrees)
- Allowed paths whitelist enforced (scout → enhance)
- Precedence respected (no hidden overrides)
- v2→v1 sync dry‑run shows zero structural diffs
- a11y tokens present and honored by components that opt‑in
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


