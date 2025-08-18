## Design Class Resolver – Single JSON, Reusable, Works For Any Element

Purpose: Resolve reusable, viewport‑aware classes from the single `design` JSON and apply them to any element (typography, wrappers, cards, buttons, etc.) using lightweight element metadata.

### Data model (inside the same `design` JSON)

```
{
  "classes": {
    "headingXL": { "base": "font-bold tracking-tight", "mobile": "text-4xl", "desktop": "text-7xl" },
    "mutedText": { "base": "text-slate-400" },
    "cardSurface": { "base": "rounded-xl shadow-lg border border-white/10 bg-black/30" },
    "containerPad": { "mobile": "px-4", "tablet": "px-6", "desktop": "px-8" },
    "buttonBase": { "base": "inline-flex items-center justify-center rounded-md" },
    "buttonPrimary": { "extends": ["buttonBase"], "base": "bg-yellow-500 text-black hover:bg-yellow-600" }
  },
  "classRules": [
    { "match": { "component": "HeroSection", "part": "Wrapper" }, "use": ["containerPad","cardSurface"], "mode": "append" },
    { "match": { "sectionId": "hero", "tag": "H1" }, "use": ["headingXL"], "mode": "append" },
    { "match": { "component": "TravelPackages", "part": "CTAButton" }, "use": ["buttonPrimary"], "add": "text-base", "mode": "append" }
  ]
}
```

- `classes`: reusable class sets. Keys are names. Values can include `base`, `mobile`, `tablet`, `desktop` and optional `extends: string[]` for composition.
- `classRules`: ordered rules. Each rule defines `match` criteria and which named sets to `use`. `add` allows extra utilities. `mode` is `append` or `replace`.

### Match keys (any subset)
- `sectionId` – pulled from nearest `data-section-id`
- `component` – from `data-component` (e.g., `HeroSection`)
- `part` – from `data-part` (e.g., `Wrapper`, `Title`, `CTAButton`)
- `tag` – DOM tag (`H1`, `DIV`, `BUTTON`)
- `elementId` – optional `data-element-id` for precise targets
- `index` – optional positional targeting
- `dataTypography` – reuse existing attribute when present

### Resolver API (single file)
Add to `src/lib/tokenResolver.ts` (or create `src/lib/designResolver.ts`).

```
export type Viewport = 'mobile' | 'tablet' | 'desktop';

type ClassSet = { base?: string; mobile?: string; tablet?: string; desktop?: string; extends?: string[] };
type ClassRule = {
  match: {
    sectionId?: string | null;
    component?: string | null;
    part?: string | null;
    tag?: string | null;
    elementId?: string | null;
    index?: number;
    dataTypography?: string | null;
  };
  use?: string[];
  add?: string;
  mode?: 'append' | 'replace';
  priority?: number;
};

function dedupeByOrder(parts: string[]): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const token of parts.join(' ').split(/\s+/).filter(Boolean)) {
    if (seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }
  return out.join(' ');
}

function expandClassSet(name: string, registry: Record<string, ClassSet>, viewport: Viewport, acc: string[]) {
  const set = registry[name];
  if (!set) return;
  for (const baseName of set.extends || []) expandClassSet(baseName, registry, viewport, acc);
  if (set.base) acc.push(set.base);
  if (viewport === 'mobile' && set.mobile) acc.push(set.mobile);
  if (viewport === 'tablet' && set.tablet) acc.push(set.tablet);
  if (viewport === 'desktop' && set.desktop) acc.push(set.desktop);
}

export function resolveClassOverrides(
  design: any,
  meta: { sectionId?: string | null; component?: string | null; part?: string | null; tag: string; elementId?: string | null; index?: number; dataTypography?: string | null },
  viewport: Viewport
): { className: string; mode: 'append' | 'replace' } {
  const registry: Record<string, ClassSet> = design?.classes || {};
  const rules: ClassRule[] = (design?.classRules || []).slice().sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  const collected: string[] = [];
  let mode: 'append' | 'replace' = 'append';

  for (const r of rules) {
    const m = r.match || {};
    const ok =
      (m.sectionId == null || m.sectionId === meta.sectionId) &&
      (m.component == null || m.component === meta.component) &&
      (m.part == null || m.part === meta.part) &&
      (m.tag == null || m.tag.toUpperCase() === (meta.tag || '').toUpperCase()) &&
      (m.elementId == null || m.elementId === meta.elementId) &&
      (m.index == null || m.index === meta.index) &&
      (m.dataTypography == null || m.dataTypography === meta.dataTypography);

    if (!ok) continue;

    for (const name of r.use || []) expandClassSet(name, registry, viewport, collected);
    if (r.add) collected.push(r.add);
    if (r.mode === 'replace') mode = 'replace';
  }

  return { className: dedupeByOrder(collected), mode };
}
```

### Component usage (minimal)

```
import { resolveClassOverrides } from '@/lib/tokenResolver';
import { useDesign } from '@/contexts/DesignContext';
import { useEditorOverlay } from '@/contexts/EditorOverlayContext';
import clsx from 'clsx';

const { design } = useDesign();
const { viewport } = useEditorOverlay();

const { className, mode } = resolveClassOverrides(
  design,
  { sectionId, component: 'HeroSection', part: 'Wrapper', tag: 'DIV' },
  viewport
);

const final = mode === 'append' ? clsx(baseClass, className) : className;

return <div data-section-id={sectionId} data-component="HeroSection" data-part="Wrapper" className={final} />;
```

### Refactor scope
- Add `data-component` on section roots and `data-part` on key subparts (typography, wrappers, buttons, cards).
- Keep using `data-section-id` and `data-typography` (already present where applicable).
- No visual change until `classRules` are added to JSON; resolver is inert otherwise.

### Editor integration (optional)
- Inspector panel can surface a "Local classes" editor bound to the selected element's match tuple, writing to `design.classRules`.
- Encourage creating named sets in `design.classes` for reusability; the editor can auto‑create a set from ad‑hoc input and substitute it into rules.

### Guarantees
- Single source of truth in the same design JSON.
- Reusable and composable via named sets + extends.
- Deterministic, viewport‑aware application via the centralized resolver.


