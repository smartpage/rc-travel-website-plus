## Design Storage Strategy: db.json agora, Firebase depois (switch simples)

Este documento define como continuamos a salvar o design em `db.json` (json-server) no modo overlay e como preparamos um “switch” simples para passar a consumir/guardar via API Intuitiva (Firebase) quando quisermos, sem reescrever componentes nem quebrar o site.

### Estado atual (funcional e estável)

- O `DesignContext` lê/grava o design através de um json-server local, montado em `/design-api`.
- O overlay editor (`?design=1`) usa o `DesignInspectorContent` para aplicar preview local e salvar no json-server.
- Fallback seguro: quando falha o fetch, usamos `design-default.json` apenas para pré-visualização.

Arquivos relevantes:
- `src/contexts/DesignContext.tsx` (load/save → `/design-api/design`)
- `src/components/ViewportToggleOverlay.tsx` (modo overlay)
- `src/components/DesignInspectorContent.tsx` (Inspector)
- `src/adapters/designAdapter.ts` (validação + fetch local já isolado)

---

### Objetivo

Preparar um “switch” controlado por ambiente/parâmetro para que o `DesignContext` possa:

- Continuar a usar o json-server local (status quo) no modo overlay (`?design=1`) e em desenvolvimento.
- Alternar, quando quisermos, para os endpoints públicos da Intuitiva: `GET /organizations/:orgId/sites/:siteId/design` (leitura) e `POST /updateSectionContent` com `collection: 'design'` e `name: 'designConfig'` (gravação).

Sem alterar componentes consumidores: tudo continua a usar `useDesign()`.

---

### Estratégia técnica (switch simples)

1) Abstrair I/O via Adapter

- Já existe `fetchDesignFromLocalDB(baseUrl = '/design-api')` em `src/adapters/designAdapter.ts` com validação Zod e fallback.
- Adicionar (futuro) funções paralelas para a API Intuitiva:

```ts
// designAdapter.ts (propostas)
export async function fetchDesignFromIntuitiva(orgId: string, siteId: string, apiBase: string): Promise<DesignData> {}
export async function saveDesignToIntuitiva(orgId: string, siteId: string, apiBase: string, data: DesignData): Promise<void> {}
```

2) Seleção de fonte (só local por agora)

- Importante: neste momento usamos SEMPRE `local` (json-server) tanto para leitura como para escrita.
- O mecanismo de “switch” (designSource) fica apenas documentado para o futuro; não será implementado agora.
- Quando for a altura, poderemos introduzir uma função utilitária (ex.: `getDesignSource()`) e ler/env/query para alternar — mas por agora mantemos 100% `local`.

3) Encapsular no `DesignContext` (futuro)

```ts
// Pseudo-código dentro do DesignContext
// Futuro: quando activarmos o switch, podemos usar algo assim:
// const source = getDesignSource();
// const load = source === 'local' 
//   ? () => fetchDesignFromLocalDB('/design-api')
//   : () => fetchDesignFromIntuitiva(ORG_ID, SITE_ID, API_BASE_URL);
// const save = source === 'local'
//   ? () => saveDesignToLocalDB('/design-api', design)
//   : () => saveDesignToIntuitiva(ORG_ID, SITE_ID, API_BASE_URL, design);

// Nota: manter fallback para default JSON quando load falha
```

4) Segurança e compatibilidade

- Enquanto `source === 'local'`, nenhum tráfego sai para a API; o overlay continua 100% local.
- Quando decidirmos mudar para `remote`, leitura e escrita passam a usar a API Intuitiva com as mesmas regras de CORS/credenciais já usadas para conteúdo.
- Componentes e tokens não mudam; apenas o transporte é trocado pelo switch.

---

### Regras de uso (até à migração)

- Em desenvolvimento e overlay (`?design=1`), manter local-only (json-server) para leitura e escrita.
- Futuro: quando formos ativar Firebase para design, poderemos introduzir `VITE_DESIGN_SOURCE=remote` e/ou `?designSource=remote` para testes controlados.

---

## Roadmap de melhoria (Fases 3 a 6)

As fases abaixo melhoram a experiência e preparam a futura migração para a API, sem tocar em conteúdo nem quebrar o layout.

### Fase 3 — Overlay Editor Context unificado

- Expandir `EditorOverlayContext` para incluir:
  - `activeSectionId: string | null`
  - `viewport: 'desktop' | 'mobile'`
  - `overlay: { show: boolean; rects: DOMRect[] }`
- Ligar `ViewportToggleOverlay` ao contexto (fonte única da verdade para viewport).
- Em `Section.tsx`, emitir `setActiveSection` ao clicar (click‑to‑scope) e opcionalmente calcular rects para highlight.

Benefícios: seleção de secção consistente, highlight visual e sincronização imediata com o Inspector.

### Fase 4 — Anchors declarativos (manifesto/design)

- Adicionar `anchor` por secção no `design.sections[sectionId]` (ou em `siteIndex.sections[*]`).
- Atualizar `SectionNavigatorContent` para ler anchors declarativos, removendo o switch hardcoded.
- Resultado: navegação por anchors resiliente e sem “mismatches”.

### Fase 5 — Criador de Secções (dashboard)

- No Intuitiva Dashboard, um wizard que:
  - Adiciona entrada no `siteIndex` (ordem/ativação);
  - Cria documento de conteúdo “skeleton” apropriado ao tipo (hero/faq/tabGrid/genérico);
  - Cria documento de design mínimo (tokens base + `anchor`);
  - Usa `POST /updateSectionContent` para escrever em `content` e `design`.
- Sem tocar em imports do frontend; o componente React só precisa existir e estar registado quando necessário.

### Fase 6 — Editores genéricos por schema (Zod)

- Consolidar um editor genérico para “array de cards” (título, descrição, imagem, CTA), validado por Zod e com mapeamento para UI.
- Manter editores especializados (Hero/FAQ/TabGrid), mas cobrir 80% dos casos com o genérico.
- Integração com `AIEnhancedSection` para copywriting assistido e operações em massa (bulk) consistentes.

---

## Checklist operacional (switch futuro)

- [x] Manter `designAdapter` como única camada de I/O (local).
- [x] Garantir fallback para `design-default.json` em qualquer falha.
- [x] Não alterar componentes que consomem `useDesign()`.
- [x] Em `?design=1`, usar apenas local (json-server) para evitar chamadas remotas durante design.
- [ ] (Futuro) Introduzir `getDesignSource()` e drivers remotos quando aprovarmos o switch.


