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

## End‑to‑End Flow
1. UI calls `POST /ai-plan-scope` with `{ prompt, index, selectionHint }`.
2. UI displays plan preview (paths, budgets) and live plan time.
3. UI calls `POST /ai-enhance-content-multipart-stream` with `{ data, prompt, aiModel, plannerOutput }`.
4. Server streams per‑chunk events; UI renders live progress + final report.

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
