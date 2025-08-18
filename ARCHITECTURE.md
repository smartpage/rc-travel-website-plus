# Arquitetura do Projeto

Este documento consolida toda a arquitetura do RC Travel Website, incluindo histórico de refatorações, migrações, decisões técnicas e fluxos de trabalho para manutenção e evolução do projeto.

---

## 1. Token Resolver & Design Parser System

### 1.1 Overview
The **Token Resolver** (located in `src/lib/tokenResolver.ts`) is a heuristic-based system that maps DOM element computed styles to design tokens in the overlay editor. It enables automatic detection and live editing of design tokens through the UI.

### 1.2 Core Components
- **`resolveGlobalTokens()`**: Main function that analyzes element styles and context to determine matching design tokens
- **`EditorOverlayContext`**: React context managing the overlay editor state and token synchronization  
- **`DesignInspectorContent`**: UI component that renders token editing controls based on resolved matches
- **`ColorSwatch`**: Component providing color picker + brand palette integration for all color tokens

### 1.3 Token Resolution Heuristics
The resolver uses several strategies to map elements to tokens:
- **Data Attributes**: Elements with `data-typography` hints (preTitle, hero_headings, etc.)
- **Element Type Detection**: Automatic mapping for H1-H6, paragraphs, buttons, links
- **Background Context**: Detects light/dark backgrounds to suggest appropriate text colors
- **Section Context**: Uses `data-section-id` to resolve section-specific tokens
- **Computed Style Analysis**: Examines font properties, colors, spacing to match token patterns

### 1.4 Live Synchronization
The system includes performance-optimized live sync:
- **RAF Throttling**: Prevents excessive re-computation during rapid changes
- **Stable References**: Memoized comparisons to avoid unnecessary re-renders  
- **Effect-Based Updates**: React effect recomputes `activeElement.tokenMatches` when design changes
- **Session Storage**: Persists viewport state and panel collapsed states

### 1.5 Token Categories Supported
- **Typography**: `hero_headings`, `headings`, `body`, `preTitle` with font properties and colors
- **Button Tokens**: `bg`, `textColor`, `hover` states for interactive elements
- **Section Layout**: Padding, spacing tokens scoped to section contexts
- **Travel Card Layout**: Specialized tokens for travel package components (`minHeight`, `maxHeight`, `imageHeight`)

---

## 2. Refatoração do Componente Travel Packages

Esta secção documenta o processo de refatorização da componente de pacotes de viagem, que foi executado para aumentar a flexibilidade e escalabilidade da gestão de dados, sem impactar o design visual da interface.

### 2.1 Objetivo da Refatorização
O objetivo principal era modificar a estrutura de dados para que um único pacote de viagem pudesse ser associado a múltiplas categorias. Adicionalmente, cada pacote deveria ter um ID único para facilitar futuras operações de CRUD (Create, Read, Update, Delete). Tudo isto, mantendo a fonte de dados no ficheiro `travelPackages.json`.

### 2.2 Análise e Diagnóstico Inicial
- **Identificação do Componente**: O trabalho começou com a identificação do componente responsável pela renderização da secção, o `TravelPackages.tsx`.
- **Análise da Fonte de Dados**: Confirmou-se que os dados eram importados estaticamente do ficheiro `src/data/travelPackages.json`.
- **Estrutura de Dados Original**: A análise do JSON revelou uma estrutura rígida onde a lista de pacotes estava aninhada (nested) dentro de cada objeto de categoria. Isto impedia que um pacote pertencesse a mais do que uma categoria.

### 2.3 Refatoração da Estrutura de Dados (`travelPackages.json`)
O ficheiro JSON foi completamente reestruturado para separar as entidades e criar uma relação mais flexível entre elas:
- **Separação de Entidades**: Foram criadas duas listas principais ao nível da raiz do JSON: `categories` e `packages`.
- **Lista de Categorias (`categories`)**: Uma lista simples contendo objetos de categoria com `id` e `name`.
- **Lista de Pacotes (`packages`)**: Uma lista única e "flat" contendo todos os pacotes de viagem, independentemente da sua categoria.
- **Relacionamento Multi-Categoria**: A cada objeto de pacote foi adicionado um novo campo: `categoryIds`. Este campo é um array de strings que contém os `id`s de todas as categorias às quais o pacote pertence (ex: `"categoryIds": ["tropical", "aventura"]`).
- **IDs Únicos**: Cada pacote recebeu um `id` único e aleatório para identificação inequívoca.

### 2.4 Adaptação do Componente React (`TravelPackages.tsx`)
Com a nova estrutura de dados, o componente React foi modificado para a interpretar corretamente:
- **Atualização da Interface TypeScript**: A interface `Package` dentro do componente foi atualizada para incluir o novo campo `categoryIds: string[]`.
- **Renderização dos Separadores (Tabs)**: A lógica para renderizar os separadores de categoria continuou a usar a lista `travelPackages.categories`, não sofrendo alterações.
- **Lógica de Filtragem Dinâmica**: A alteração mais significativa foi na renderização dos pacotes. A lógica anterior, que iterava sobre pacotes aninhados, foi substituída por um processo de filtragem dinâmica:
  - Para cada categoria apresentada num separador, o componente agora filtra a lista principal `travelPackages.packages`.
  - O método `.filter()` é usado para selecionar apenas os pacotes cujo array `categoryIds` contém o `id` da categoria ativa.
  - O resultado deste filtro é então mapeado para renderizar os cartões dos pacotes.

### 2.5 Validação
A refatorização foi validada atribuindo um pacote de teste a duas categorias em simultâneo. O sucesso foi confirmado quando o cartão do respetivo pacote apareceu corretamente em ambos os separadores na interface, provando que a nova estrutura de dados e a lógica do componente estavam a funcionar como esperado.

---

## 3. Migração para Firebase e Arquitetura Modular

### 3.1 Objetivo da Migração
Após a refatorização inicial dos Travel Packages, foi decidido migrar todo o sistema de dados locais (ficheiros JSON) para Firebase, criando uma arquitetura totalmente modular orientada por manifesto.

### 3.2 Componentes da Nova Arquitetura
#### 3.2.1 Manifest-Driven Architecture (`siteIndex.json`)
- **Manifesto Central**: O `siteIndex.json` define todas as secções e componentes do site
- **Componentes Internos**: Cada secção pode ter `internalComponents` que especificam:
  - `type`: Tipo de componente (ex: "TabGrid")
  - `contentFile`: Nome do ficheiro de dados (sem extensão)
  - `cardType`: Tipo de card para renderização ("travel", "testimonial")
  - `gridLayout`: Layout CSS grid específico

#### 3.2.2 Componentes Modulares
- **TabGrid**: Componente reutilizável para múltiplos tipos de conteúdo
- **CardGrid**: Grid flexível que aceita diferentes tipos de card
- **TestimonialCard**: Card específico para testemunhos
- **TravelCard**: Card específico para pacotes de viagem

#### 3.2.3 Context API
- **ContentContext**: Gestão global de estados de loading, dados e erros
- **DesignContext**: Gestão de configurações de design e estilo

### 3.3 Migração dos Dados para Firebase
#### 3.3.1 Script de Migração
- **Localização**: `/scripts/migrate-to-firebase.cjs`
- **Funcionalidade**: Migra automaticamente todos os ficheiros `*Content.json`
- **Resultado**: 11 secções de conteúdo + siteIndex + 3 configurações de design migradas

#### 3.3.2 Estrutura no Firebase
```
organizations/org_nomad_wise/sites/site_nomad_wise/content/
├── siteIndex
├── travelPackagesTabCards
├── testimonialsTabCards
├── heroContent
└── ... (outras secções)
```

### 3.4 Problema Crítico: Dev vs Production API Endpoints
#### 3.4.1 Origem do Problema
**Por que surgiu agora:**
- **Antes**: Dados eram importados estaticamente dos ficheiros JSON locais
- **Depois**: Migração para Firebase introduziu chamadas de API dinâmicas
- **Desenvolvimento**: Vite proxy configurado para `/api/*` → Firebase
- **Produção**: Proxy não existe no deploy Railway

#### 3.4.2 Sintomas do Erro
```
❌ Firebase fetch failed: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

#### 3.4.3 Diagnóstico
```
✅ Development (localhost:8080):
/api/organizations/... → Vite Proxy → Firebase API → JSON ✅

❌ Production (Railway deploy):
/api/organizations/... → 404 HTML page → HTML ❌
```

#### 3.4.4 Solução Implementada
**ContentContext.tsx** foi atualizado para detectar ambiente:
```typescript
const isDev = import.meta.env.DEV;
const API_URL = isDev 
  ? `/api/organizations/${ORG_ID}/sites/${SITE_ID}/content` // Dev: proxy
  : `${API_BASE_URL}/organizations/${ORG_ID}/sites/${SITE_ID}/content`; // Prod: direto
```

### 3.5 Configuração de Proxy (Desenvolvimento)
**vite.config.ts**:
```typescript
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_API_URL || 'http://localhost:5001',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^/api/, ''),
      secure: true,
    },
  },
}
```

### 3.6 Estado Final da Arquitetura
#### 3.6.1 Fluxo de Dados
1. **ContentContext** carrega dados do Firebase
2. **Componentes** consomem dados via `useContent()`
3. **TabGrid** renderiza componentes modulares baseados no manifesto
4. **Cards** são renderizados dinamicamente baseados no `cardType`

#### 3.6.2 Vantagens da Nova Arquitetura
- **Modularidade**: Componentes reutilizáveis para múltiplos tipos de conteúdo
- **Flexibilidade**: Fácil adição de novos tipos de card e layouts
- **Centralização**: Dados geridos centralmente no Firebase
- **Escalabilidade**: Manifesto permite configuração dinâmica de secções
- **Manutenibilidade**: Separação clara entre dados, configuração e apresentação

#### 3.6.3 Ambientes Suportados
- **✅ Development**: Proxy Vite + Firebase API
- **✅ Production**: Ligação direta Firebase API
- **✅ Loading States**: Skeletons durante carregamento
- **✅ Error Handling**: Gestão de erros de API

---

## 4. Implementação do Slider Embla nos Testemunhos

### 4.1 Objetivo
O objetivo foi integrar um slider de carrossel (usando a biblioteca Embla Carousel) na secção de testemunhos para melhorar a apresentação e a interatividade, especialmente em dispositivos móveis. A implementação deveria ser modular e controlada centralmente.

### 4.2 Arquitetura e Controlo
A implementação seguiu uma abordagem modular e configurável:
- **Ativação via Manifesto**: O slider é ativado ou desativado para o `TabGrid` através de uma propriedade booleana `useSlider` no `siteIndex.json`. Isto permite que qualquer secção que use o `TabGrid` possa, opcionalmente, tornar-se um slider.

```json
// Em siteIndex.json
{
  "id": "testimonials",
  "type": "internalComponent",
  "internalComponent": {
    "type": "TabGrid",
    "contentFile": "testimonialsTabCardsContent",
    "cardType": "testimonial",
    "useSlider": true // Ativa o slider
  }
}
```

- **Configuração Centralizada no Design System**: Todas as opções de comportamento e estilo do slider são geridas através do `DesignContext`.
  - **`DesignContext.tsx`**: A interface `DesignConfig` foi estendida para incluir um objeto `sliderOptions` com todas as configurações, incluindo `loop`, `dragFree`, e um sub-objeto `colors` para os elementos visuais (setas e pontos).
  - **`config.ts`**: O ficheiro de configuração principal fornece os valores padrão para todas as `sliderOptions`, incluindo as classes Tailwind CSS para as cores.

### 4.3 Modificações no Componente `TabGrid.tsx`
O componente `TabGrid` foi o principal ponto de modificação:
- **Renderização Condicional**: O componente agora verifica a prop `useSlider`. Se for `true`, renderiza a estrutura do Embla Carousel; caso contrário, renderiza a grelha de cartões padrão.
- **Integração com `useEmblaCarousel`**: O hook `useEmblaCarousel` é inicializado com as opções vindas diretamente do `design.sliderOptions`.
- **Setas de Navegação (Arrows)**:
  - Foram adicionados botões de "anterior" e "seguinte".
  - O estado de `disabled` é controlado dinamicamente com base no `emblaApi.canScrollPrev()` e `emblaApi.canScrollNext()`.
  - As classes de estilo, incluindo as cores e os efeitos `hover`, são aplicadas a partir de `design.sliderOptions.colors.arrows` e `arrowsHover`.
- **Pontos de Navegação (Dots)**:
  - A visibilidade dos pontos é controlada pela opção `design.sliderOptions.dots`.
  - As cores para o ponto ativo e inativo são definidas por `design.sliderOptions.colors.dotActive` e `dotInactive`.
- **Altura Igual dos Cartões**: Para garantir consistência visual, cada cartão dentro do slider é envolvido por uma `div` com a classe `h-full`. Isto força todos os cartões na mesma visualização a terem a mesma altura do cartão mais alto.

### 4.4 Manutenção e Extensibilidade
Com esta implementação, para alterar ou adicionar novas funcionalidades ao slider:
- **Alterar comportamento**: Modifique os valores no objeto `sliderOptions` dentro de `config.ts`.
- **Alterar cores**: Ajuste as classes Tailwind CSS dentro do sub-objeto `colors`.
- **Adicionar novos sliders**: Use a prop `useSlider: true` em qualquer componente `TabGrid` e configure as opções específicas através do `design.sliderOptions`.

---

## 5. 🚧 TODO: Melhorar Sistema de Section IDs

### 5.1 Problema Atual
O sistema atual de IDs é **inconsistente e propenso a erros**:
```tsx
// ❌ Problema: IDs manuais e desalinhados
<Section sectionId="hero" id="home">           // ID final: "home"
<Section sectionId="travelPackages" id="packages"> // ID final: "packages"
<Section sectionId="travelDesigner" id="about">   // ID final: "about"
```

```json
// ❌ Links devem corresponder manualmente aos IDs
{ "label": "Início", "href": "#home" }     // Tem que saber que hero → home
{ "label": "Viagens", "href": "#packages" } // Tem que saber que travelPackages → packages
```

### 5.2 Solução Proposta
1. **Section IDs Automáticos baseados no sectionId**
```tsx
// ✅ Melhorado: IDs automáticos e consistentes
const Section: React.FC<SectionProps> = ({ children, sectionId }) => {
  // Gerar ID automático baseado no sectionId (sem prop 'id' manual)
  const uniqueId = sectionId;
  
  return (
    <section id={uniqueId} style={outerStyle}>
      {children}
    </section>
  );
};
```

2. **DesignContext com mapeamento de Section Names**
```tsx
// ✅ DesignContext deveria conhecer as secções disponíveis
interface DesignConfig {
  sections: {
    [sectionId: string]: {
      name: string;        // Nome para navegação
      anchor: string;      // ID para anchor (#hero, #travelPackages)
      layout: LayoutConfig;
    }
  }
}
```

3. **Navegação Automática**
```tsx
// ✅ Links gerados automaticamente do DesignContext
const navigation = Object.entries(design.sections).map(([sectionId, config]) => ({
  label: config.name,
  href: `#${config.anchor || sectionId}`
}));
```

#### Benefícios
- **Consistência**: Um só lugar para definir section IDs
- **Automático**: Links navegação gerados automaticamente
- **Sem erros**: Impossível desalinhamento entre IDs e links
- **Centralizado**: DesignContext como fonte única de verdade
- **Flexível**: Pode override anchor se necessário

### 5.3 Implementação
1. **Refatorar componente Section** para não usar prop `id` manual
2. **Estender DesignContext** para incluir section metadata
3. **Gerar navegação automaticamente** do DesignContext
4. **Migrar todos os componentes** para usar apenas `sectionId`

---

## 6. 📍 Section IDs e Navegação por Anchors (Estado Atual)

### 6.1 Como Funcionam os Section IDs
Cada componente de secção usa o componente `Section` que gera IDs únicos para navegação por anchors:
```tsx
// Componente Section - Lógica de ID
const Section: React.FC<SectionProps> = ({ children, sectionId, id }) => {
  // ID final: 'id' tem precedência sobre 'sectionId'
  const uniqueId = id || sectionId;
  
  return (
    <section id={uniqueId} style={outerStyle}>
      {children}
    </section>
  );
};
```

### 6.2 Configuração Atual de IDs
```tsx
// Exemplos de componentes e seus IDs finais
<Section sectionId="hero" id="home">           // → id="home"
<Section sectionId="travelPackages" id="packages"> // → id="packages"  
<Section sectionId="travelDesigner" id="about">   // → id="about"
<Section sectionId="faq">                       // → id="faq"
<Section sectionId="contact">                   // → id="contact"
```

### 6.3 Links de Navegação
Os links na navegação devem corresponder **exatamente** aos IDs finais:
```json
// navigationVariationContent.json
{
  "desktopMenuItems": [
    { "label": "Início", "href": "#home" },      // ✅ Corresponde a id="home"
    { "label": "Viagens", "href": "#packages" }, // ✅ Corresponde a id="packages"
    { "label": "Sobre", "href": "#about" },     // ✅ Corresponde a id="about"
    { "label": "Perguntas", "href": "#faq" },   // ✅ Corresponde a id="faq"
    { "label": "Contacto", "href": "#contact" }  // ✅ Corresponde a id="contact"
  ]
}
```

### 6.4 🔧 Como Corrigir Links Quebrados
- **Problema**: Links de navegação não funcionam  
- **Causa**: Mismatch entre `href` na navegação e `id` no componente

**Opção A**: Corrigir IDs nos componentes
```tsx
// Remover prop 'id' para usar 'sectionId' como ID final
<Section sectionId="hero">           // → id="hero"
<Section sectionId="travelPackages"> // → id="travelPackages"
```

**Opção B**: Corrigir links na navegação (recomendado)
```json
// Atualizar href para corresponder aos IDs existentes
{ "label": "Início", "href": "#home" }     // Corresponde ao ID real
{ "label": "Viagens", "href": "#packages" } // Corresponde ao ID real
```

---

## 7. 📤 Carregamento de Content JSONs para Firebase

### 7.1 Script de Upload
Use o script `upload-content-to-firebase.js` para carregar content JSONs atualizados:
```bash
# Carregar arquivo específico
node scripts/upload-content-to-firebase.js navigationVariationContent

# Carregar arquivo + siteIndex
node scripts/upload-content-to-firebase.js navigationVariationContent --with-siteindex

# Usar arquivo padrão (faqContent)
node scripts/upload-content-to-firebase.js
```

### 7.2 Como o Script Funciona
1. **Configuração Automática**:
   - Lê credenciais Firebase do arquivo `.env`
   - Obtém `ORG_ID` e `SITE_ID` do `db_connect.ts`
   - Localiza arquivo em `/src/data/`
2. **Mapeamento Inteligente**:
   - Input: navigationVariationContent.json
   - Remove "Content": navigationVariation  
   - Consulta siteIndex: encontra entrada correspondente
   - Nome do documento: navigationVariation
3. **Upload para Firebase**:
   - Path: organizations/{orgId}/websites/{siteId}/content/{documentName}
   - Data: Conteúdo JSON completo

### 7.3 Arquivos de Content Disponíveis
Principais arquivos de conteúdo:
```bash
src/data/
├── navigationVariationContent.json  # Links de navegação
├── heroContent.json                  # Secção Hero
├── travelPackagesContent.json        # Pacotes de viagem
├── travelDesignerContent.json        # Secção About
├── testimonialsContent.json          # Testemunhos
├── faqContent.json                   # Perguntas frequentes
├── contactContent.json               # Formulário de contacto
└── siteIndex.json                    # Manifesto do site
```

### 7.4 Fluxo de Atualização de Content
1. **Editar JSON local**: Alterar ficheiro em `/src/data/`
2. **Carregar para Firebase**: `node scripts/upload-content-to-firebase.js [filename]`
3. **Verificar no site**: As alterações aparecem imediatamente no site

```bash
# Exemplo prático: Corrigir links de navegação
# 1. Editar navigationVariationContent.json
# 2. Carregar para Firebase
node scripts/upload-content-to-firebase.js navigationVariationContent
# 3. Links corrigidos aparecem no site
```

### 7.5 🎯 Dicas
- **Flag `--with-siteindex`**: Só usar quando alterar estrutura de secções
- **Arquivo padrão**: Script usa `faqContent.json` se nenhum arquivo especificado
- **Nome do documento**: Script deriva automaticamente do nome do arquivo
- **Validação**: Script verifica se entrada existe no `siteIndex.json`

---

## 1. Visão Geral e Princípios

O projeto adota uma arquitetura modular, orientada por manifesto, com separação clara entre dados, configuração e apresentação. O objetivo é garantir flexibilidade, escalabilidade e facilidade de manutenção, suportando atualizações dinâmicas de conteúdo sem necessidade de deploy.

Principais pilares:
- **Manifesto Central (`siteIndex.json`)**: Define a estrutura e ordem das secções do site.
- **Componentização**: Cada secção é um componente React modular e reutilizável.
- **ContentContext**: Gerencia o carregamento e distribuição de dados para os componentes.
- **DesignContext**: Centraliza tokens de design, garantindo identidade visual consistente.
- **Firebase**: Repositório principal de conteúdo, suportando atualizações em tempo real.
- **Scripts utilitários**: Automatizam migração, upload e validação de dados.

---
