# Planner → Executor Architecture (DesignV2 Enhancements)

This document describes the two–phase AI enhancement system used by the overlay editor.

## Executive Summary
- Phase 1 (Planner): one LLM call produces a soft, human–readable plan from the prompt and current selection. It resolves scope (local vs global), targets (paths), and allowed fields per target. For copy–from intents it resolves the source values.
- Phase 2 (Executor): parallel fan‑out over the exact planned targets only, with budgets and allowed fields enforced. Replies must be valid JSON and pass our shape validator. Non‑applicable replies are marked as “skipped”, not failures.

## Responsibilities
- Planner
  - Classify intent (e.g., tweak, copy‑from, recolor, spacing)
  - Determine scope from BOTH prompt + selection
    - If prompt explicitly says “site‑wide / all sections” → scope = global
    - Else if selection exists and prompt references it or is ambiguous → scope = selection (local)
    - Else → auto heuristic: prefer local; escalate only if prompt clearly states global
  - Produce output:
    ```json
    {
      "scopeMode": "selection|global|auto",
      "primary": [{ "path": "designV2.sections.hero.layout", "allowedFields": ["inner.background","inner.background.value","padding"] }],
      "secondary": [{ "path": "designV2.tokens.colors", "allowedFields": ["highlight"] }],
      "budgets": { "maxChunks": 3, "maxFieldsPerChunk": 2, "allowPalette": false },
      "copyFrom": { "sourcePath": "designV2.sections.hero.layout.inner.background.value", "value": "#0a0a0a" }
    }
    ```
- Executor
  - Filter chunks to planned paths only (respect `budgets.maxChunks`)
  - Inject allowed fields and facts (e.g., `sourceColor=#0a0a0a`)
  - Enforce JSON–only replies, shape parity, and allowed fields delta
  - Treat “not applicable” as `skipped` (neutral outcome)
  - Merge successes; keep originals for failed/skipped

## Model Selection Strategy

### Planner Models (User Configurable)
The planner supports multiple high-quality reasoning models:

1. **Claude Sonnet 4** (`anthropic/claude-3.7-sonnet`) - **Default** - Latest Claude model with superior reasoning
2. **Gemini 2.5 Flash** (`google/gemini-2.5-flash`) - Fast Google model with good performance
3. **Gemini 2.0 Flash** (`google/gemini-2.0-flash`) - Previous generation Google model
4. **DeepSeek V3 0324** (`deepseek/deepseek-v3-0324`) - High-performance coding model
5. **Qwen3 Coder** (`qwen/qwen3-coder`) - Specialized coding model
6. **Claude 3.7 Sonnet** (`anthropic/claude-3.5-sonnet`) - Previous Claude version
7. **DeepSeek V3 0324 (free)** (`deepseek/deepseek-v3-0324-free`) - Free tier version
8. **Gemini 2.5 Pro** (`google/gemini-2.5-pro`) - Google's premium model
9. **R1 0528 (free)** (`deepseek/r1-0528-free`) - DeepSeek reasoning model (free)
10. **Kimi K2** (`moonshotai/kimi-k2`) - Moonshot AI model

### Executor Model (Fixed)
The executor uses **Gemini 2.5 Flash Lite** (`google/gemini-2.5-flash-lite`) for consistency and speed in processing multiple chunks.

## Save Changes Implementation (Temporary)

### Current Save Functionality Location
**File**: `src/contexts/DesignContext.tsx`
**Function**: `saveDesignToAPI()`

### Temporary Implementation Details
- **Status**: Local file download (no server calls)
- **Behavior**: Downloads `dbV2.json` file with current design state
- **Purpose**: Temporary solution while external endpoint is being developed
- **Future**: Will be replaced with external endpoint for proper file system integration

### Code Location for Future Reversion
```typescript
// In DesignContext.tsx - saveDesignToAPI function
// Current: Local file download implementation
// Future: Replace entire function with external endpoint call
```

### Notes
- Save functionality is intentionally separated from AI enhancement panel
- No authentication or server dependencies in current implementation  
- Ready for clean replacement with external endpoint when available

## End‑to‑End Flow
1. UI calls `POST /ai-plan-scope` with `{ prompt, index, selectionHint }`.
2. UI displays plan preview (paths, budgets) and live plan time.
3. UI calls `POST /ai-enhance-content-multipart-stream` with `{ data, prompt, aiModel, plannerOutput }`.
4. Server streams per‑chunk events; UI renders live progress + final report.

## API Endpoints & Auth (from ENDPOINTS.md)

### Auth: Get session cookie via Magic Link
- Request Magic Link:
```sh
curl -X POST "http://localhost:5001/sendMagicLink" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","redirectTo":"http://localhost:5001/test"}'
```
- Validate Magic Link and capture the intuitiva_session cookie from Set-Cookie:
```sh
curl -X POST "http://localhost:5001/validateMagicLink" \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_MAGIC_LINK_TOKEN"}' -v
```
Use the value of intuitiva_session in subsequent requests as: `-H "Cookie: intuitiva_session=<SESSION>"`.

Dev note: Server runs on http://localhost:5001. In Vite dev, only `/api/*` is proxied; these AI endpoints are not under `/api`, so use absolute URLs or add a proxy rule.

### Planner — POST /ai-plan-scope
Request:
```json
{
  "prompt": "change the hero title color to neon pink",
  "index": { /* designV2.index object */ },
  "selectionHint": { "tokenPath": "designV2.tokens.typography.hero_headings" },
  "scopeMode": "auto",
  "aiModelPlan": { "provider": "openrouter", "id": "anthropic/claude-3.5-sonnet" }
}
```
Example:
```sh
curl -X POST "http://localhost:5001/ai-plan-scope" \
  -H "Content-Type: application/json" \
  -H "Cookie: intuitiva_session=<SESSION>" \
  -d '{"prompt":"change the hero title color to neon pink","index":{},"selectionHint":{"tokenPath":"designV2.tokens.typography.hero_headings"},"scopeMode":"auto","aiModelPlan":{"provider":"openrouter","id":"anthropic/claude-3.5-sonnet"}}'
```
Response (example):
```json
{
  "success": true,
  "plan": {
    "primary": [{"path":"designV2.tokens.typography.hero_headings","allowedFields":["color"]}],
    "secondary": [{"path":"designV2.sections.hero.layout","allowedFields":["padding","minHeight"]}],
    "budgets": {"maxChunks": 6, "maxFieldsPerChunk": 2, "allowPalette": false},
    "scopeMode": "auto"
  },
  "planTimeMs": 1234,
  "model": {"provider": "openrouter", "id": "anthropic/claude-3.5-sonnet"}
}
```

### Executor (single-shot, legacy) — POST /ai-enhance-content
Note: ENDPOINTS.md flags this endpoint as potentially unauthenticated in dev (see "AI API Abuse" vulnerability). Prefer the streaming executor for production-like runs.

Example:
```sh
curl -X POST "http://localhost:5001/ai-enhance-content" \
  -H "Content-Type: application/json" \
  -H "Cookie: intuitiva_session=<SESSION>" \
  -d '{
    "data": {"design": {"colors": {"primary": "red"}, "typography": {"body": {"color": "black"}}}},
    "prompt": "Change primary color to blue and body text to white",
    "sectionType": "db",
    "aiModel": {"provider": "openrouter", "id": "anthropic/claude-3-haiku", "name": "Claude 3 Haiku"}
  }'
```

### Executor (multipart streaming) — POST /ai-enhance-content-multipart-stream
Returns NDJSON events:
- `{ type: "plan", chunks: [...] }`
- `{ type: "chunk_start", index, path, keyIndex }`
- `{ type: "chunk_complete", index, path, ok, ms, error? }`
- `{ type: "result", success, enhancedData?, metadata }`

Example:
```sh
curl -N -X POST "http://localhost:5001/ai-enhance-content-multipart-stream" \
  -H "Content-Type: application/json" \
  -H "Cookie: intuitiva_session=<SESSION>" \
  -d '{
    "data": {"designV2": {/* ... */}},
    "prompt": "Improve hero spacing and make headings white",
    "aiModel": {"provider":"openrouter","id":"anthropic/claude-3-haiku"},
    "plannerOutput": {"primary":[],"secondary":[],"budgets":{"maxChunks":6,"maxFieldsPerChunk":2,"allowPalette":false}}
  }'
```

## Frontend AI Panel Issues & Improvements

### Critical Problems Identified (January 2025)

**1. Overly Complex State Management**
- 5+ conflicting loading states (aiLoading, planning, executing, saving, previewActive)
- Inconsistent preview logic between auto-apply and manual controls
- State pollution across AI context and panel local state

**2. Poor UX Flow**
- Auto-apply preview on streaming creates user confusion
- Multiple "save" concepts (working copy → API) add cognitive load
- Mixed terminology: "Generate Preview" vs "Re-apply Preview" vs "Apply to Working Copy"

**3. Terrible Error Handling**
- Generic error messages with no actionable feedback
- No retry mechanisms for transient failures
- Error state pollution across components

**4. Weak Planner Intelligence**
- Hard-coded regex patterns for detection (`/(button|bot[aã]o|bot[oõ]es|btn)/`)
- No semantic understanding of color relationships or visual hierarchy
- Missing bindings discovery - can't map "cards background" to section layout paths

**5. Shallow Design Index Building**
- Only checks existence of top-level design.tokens.colors
- No semantic aliases or relationship mapping
- Missing visual bindings knowledge

### Proposed Frontend Improvements

**1. Simplified State Machine**
```typescript
type AIState = 'idle' | 'planning' | 'executing' | 'preview' | 'committed' | 'error';
// Single source of truth instead of 5+ booleans
```

**2. Enhanced Index Building with Semantic Aliases**
```typescript
aliases: {
  "cards background": ["designV2.sections.*.layout.inner.background"],
  "button background": ["designV2.components.button.variants.*.backgroundColor"], 
  "text color": ["designV2.tokens.typography.*.color"],
  "hero section": ["designV2.sections.hero.*"]
}
```

**3. Smart Binding Discovery**
- Pre-analyze prompts with LLM to identify visual concepts
- Map concepts to design paths using semantic relationships
- Context-aware field suggestions based on prompt analysis

**4. Better Error UX**
- Specific error types with recovery suggestions
- Retry buttons for transient failures
- Progress indicators during long operations

**5. Streamlined Preview Flow**
- Single preview mode - no auto-apply confusion
- Clear preview vs committed state distinction
- Undo/redo stack for better change management

### Implementation Status (January 2025)

✅ **COMPLETED - All 5 Frontend Improvements + Smart Planner:**

**1. Simplified State Machine**
- Replaced 5+ boolean states with single `AIState` enum: `'idle' | 'planning' | 'executing' | 'preview' | 'committed' | 'error'`
- Clear state transitions with atomic operations
- Legacy compatibility maintained for existing code

**2. Enhanced Index Building with Semantic Aliases**
- New `buildIndexFromDesign()` creates semantic mappings:
  ```typescript
  aliases: {
    "cards background": ["designV2.sections.whyFeatureCards.layout.inner.background"],
    "button background": ["designV2.components.button.variants.*.backgroundColor"], 
    "text color": ["designV2.tokens.typography.*.color"]
  }
  ```
- Version 2 index with relationships and categories
- Smart aliasing based on section names and component types

**3. Smart Binding Discovery**
- Semantic concept detection in planner
- Visual concept → design path mapping
- Context-aware field suggestions based on prompt analysis
- Enhanced planner system prompt with semantic understanding

**4. Better Error UX**
- Structured `AIError` type with specific error categories
- Contextual error messages with recovery suggestions
- Retry mechanism for transient failures
- Technical details in collapsible sections

**5. Streamlined Preview Flow**
- No auto-apply confusion - explicit user actions required
- State-driven UI buttons (Apply/Reject/Save/Retry)
- Clear preview → committed → saved flow
- Preview backup and revert functionality

**6. Enhanced Planner Intelligence**
- Semantic concept detection from enhanced index aliases
- Visual relationship understanding (background affects text)
- Smart prompt analysis with concept-to-path mapping
- Improved system prompt with semantic mapping examples

## Heuristics
- Scope inference (prompt + selection):
  - If explicit global phrases ("all sections", "throughout the site") → global
  - Else if a selection exists and prompt references it (“this section/hero/travel designer”) → selection
  - Else → selection by default (conservative)
- Copy‑from intents:
  - Planner resolves `sourcePath` and reads the literal value
  - Executor passes `sourceColor/value` as a fact; target chunks do not discover cross‑chunk data
- Budgets:
  - selection: `maxChunks` small (1–3), `allowPalette=false`
  - global: `maxChunks` larger, `allowPalette=true` when recoloring

## Validation Rules (Executor)
- JSON only; reject markdown or prose
- Shape parity: objects keep same keys, arrays keep same length; primitives free to change
- Allowed fields enforcement: if planner provides `allowedFields` for a target path, only those fields (or their nested descendants) may change. Executor computes the leaf diffs for the chunk and rejects the reply if any changed path is outside the allowed set. This prevents background/layout edits when the request targets typography color.
- Skips: when model replies "not applicable", mark `skipped` (white dot) instead of failure

### AllowedFields – How it’s enforced

- Planner output example:
  ```json
  {
    "primary": [
      { "path": "designV2.tokens.typography.headings", "allowedFields": ["color"] }
    ]
  }
  ```
- Executor behavior:
  - Validates shape parity first
  - Diffs original vs. candidate to collect changed leaf paths
  - Verifies every changed path matches one of the allowed fields (exact match or descendant)
  - On violation, marks chunk as failure with `allowed_fields_violation` and keeps original data
  - NDJSON event includes full prompts and the error; UI shows ❌ with reason

## UI Contracts
- Live Progress (during run): planner time + per‑chunk rows (✅ ok, ⚪ skipped, ❌ failed)
- Last Run (persistent): planner model/time; executor total time + success/total; toggle failed‑only; expandable chunk list; show plan JSON
- Controls: Re‑apply Preview, Save All Changes, Discard Changes; Suggestions panel toggle

## Extensibility
- Add other scopes (e.g., section‑type scope)
- Richer diff checking (deep allowed fields)
- Planner disambiguation flow: return candidate targets + `needsDisambiguation=true` to ask the user

## BindMakerGod – On‑the‑fly bindings (classes + selectors)

BindMakerGod is an optional part of the planner output that lets the AI create precise, reusable targets instead of blindly editing token trees. It works with the existing `designV2.classes` and `designV2.bindings`.

When to use
- The instruction applies to instances (e.g., “paragraphs in Travel Designer section”) rather than global tokens.
- The user wants a new style that can be toggled/removed later.

Planner output (added fields)
```json
{
  "bindingPatch": {
    "classesToCreate": [
      {
        "id": "auto.heroParagraphBright",
        "appliesTo": ["tokens.typography"],
        "extends": "designV2.tokens.typography.body",
        "overrides": { "color": "#ffffff", "lineHeight": "1.7" },
        "locked": false
      }
    ],
    "bindingsToAdd": [
      {
        "selector": { "dataSection": "travelDesigner", "dataTypography": "body" },
        "classes": ["classes.auto.heroParagraphBright"]
      }
    ]
  }
}
```

Executor behavior
- If `bindingPatch` exists, apply it before token chunk edits:
  - Add/merge keys under `designV2.classes` using the provided `id`
  - Add/merge entries under `designV2.bindings` using a deterministic selector key (e.g., `dataSection.travelDesigner`, `dataTypography.body`)
- Enforce safety:
  - Only `classesToCreate` and `bindingsToAdd` are allowed locations
  - Reject extra/unknown keys
  - Respect `budgets.maxChunks` and selection scope (no palette edits when local)

Scope evaluator alignment
- Planner receives both the prompt and `selectionHint { sectionId, tokenPaths[] }`
- Rule: selection wins unless prompt explicitly requests site‑wide/global
- BindMakerGod honors the resolved scope by emitting selectors that include `dataSection: <selection.sectionId>`; global scope may omit the section filter on purpose
- Executor already filters to planner primary targets; `bindingPatch` is treated as a single targeted write consistent with scope

Result
- Precise, reversible, reusable edits bound to the selection, with no spillover to unrelated sections. The UI still shows preview/apply/save as before.
