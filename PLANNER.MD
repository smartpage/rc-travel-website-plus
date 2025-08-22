# Planner Intelligence: Challenges, Findings, and Upgrades (WIP)

## Let's talk about this:

Implemented: prompt negation handling and card-vs-section preference in ai-plan.js; extended aliases in buildIndexFromDesign; added safe classes/bindings for duration pill targeting; created PLANNER.MD with findings/TODOs.
UI: plan summary cleanup already applied.
Next: want me to standardize dataElement: "card" and dataElement: "pill" usage across templates now, or keep it minimal for this iteration?


## Current challenges
- Card vs Section confusion: prompts like "change travel card background" sometimes target section paths (designV2.sections.*) instead of card-level tokens/classes.
- Missing selectors for sub-elements (e.g., duration pill), planner invents non-existent selectors.
- Over-eager button edits: spacing requests cause accidental edits to components.button padding.
- Limited design-harmony reasoning: background changes may need contrast/text adjustments.

## What we learned
- Our design exposes useful tokens and classes:
  - tokens.colors.cardBackground (global card background)
  - typography for cards (e.g., tokens.typography.cardBody)
  - button bindings exist (dataElement.primaryButton/secondaryButton)
- Sections acting as card containers (e.g., sections.whyFeatureCards) should not be equated with cards.

## Upgrades implemented (this iteration)
- Prompt logic
  - Negation handling: if user says "not the section"/"cards only", avoid sections.*.layout.* for the requested property; prefer card tokens/classes.
  - Conservative button policy: only modify buttons when explicitly requested in the prompt.
  - Clearer card vs section mapping guidance in the system prompt.
- Index aliases
  - Added "card background (elements not section)" alias.
  - Expanded mapping for card sections (whyFeatureCards) and generic card-related sections.
  - Preserved card class padding option for prompts containing "cards" + spacing/padding intent.
- Safe bindings/classes (seed)
  - Introduced classes.card.base and classes.badge.duration with neutral overrides and selectors: { dataElement: "card" } and { dataElement: "pill", dataVariant: "duration" }.

## Remaining gaps / TODO
- Standardize card selectors across templates: dataElement: "card", optional variants (package, feature, service).
- Add canonical pill/badge selectors (dataElement: "pill", dataVariant: "duration" | "price" | ...).
- Extend relationships: background ↔ text contrast for card/pill contexts with thresholds.
- Add planner tests with hard prompts (negations, multi-target, ambiguous terms).
- Consider a schema registry for allowed selectors and their scopes to prevent invented selectors.

## Suggestions to improve planner intelligence
- Contextual selector validation: cross-check candidate selectors against a registry built from current design (bindings/selectors) before emitting bindingPatch.
- Weighted scoring of targets: prefer token-level edits for global card styling; prefer class-level for local instances.
- Negation-first parsing: build an allow/deny list of namespaces (sections vs cards) per prompt before path selection.
- Design-harmony auto-hints: when background changes, propose optional step to adjust contrast in related typography.

## Example rules now enforced
- Spacing-only prompts without "button": limit to sections.*.layout.padding or card class padding (if prompt mentions cards).
- "Cards only" prompts: do not touch sections.*.layout.* for background/padding; choose card tokens/classes instead.

(Keep this file updated as we iterate.)
