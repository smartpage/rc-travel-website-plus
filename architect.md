# 🏗️ Architect - Hugo Ramos Travel Website

## 📋 Análise Arquitetural Completa - Hierarquia de Componentes Internos

Esta seção documenta a análise minuciosa da arquitetura de componentes do sistema, com foco especial na refatorização do componente TravelPackages e sua estrutura modular interna.

### Visão Geral da Arquitetura de Componentes

O sistema segue uma **arquitetura orientada por manifesto** onde o `siteIndex.json` atua como configurador central, definindo não apenas quais componentes são renderizados, mas também quais **componentes internos** cada seção contém.

### 🚀 Processo de Carregamento de Conteúdo (Seeding)

Para manter a consistência entre o código-fonte e a base de dados Firebase, o projeto utiliza um script de "seeding" para carregar ou atualizar o conteúdo do site.

**Script Responsável**: `scripts/upload-content-to-firebase.js`

**Funcionalidade**:
Este script permite carregar seletivamente ficheiros de conteúdo JSON (localizados em `src/data/`) para o Firestore. Ele garante que o `siteIndex.json` e o conteúdo de um componente específico sejam atualizados na base de dados.

**Uso**:
```bash
node scripts/upload-content-to-firebase.js [nomeDoArquivoDeConteudo]
```
**Exemplo**:
```bash
node scripts/upload-content-to-firebase.js heroVariationContent
```

---

**⚠️ REGRA DE NOMENCLATURA CRÍTICA ⚠️**

O ponto mais importante da arquitetura de conteúdo é a **correspondência exata entre o manifesto `siteIndex.json` e os documentos no Firestore**.

1.  **Fonte da Verdade**: O campo `name` dentro de cada objeto de secção no `siteIndex.json` é a **fonte da verdade** para o ID do documento de conteúdo no Firestore.
2.  **Lógica do Script**: O script `upload-content-to-firebase.js` foi desenhado para reforçar esta regra. Ele usa o nome do ficheiro (ex: `heroVariationContent`) apenas para encontrar a entrada correspondente no `siteIndex.json`. Depois, extrai o valor do campo `name` (ex: `heroVariation`) e usa-o como o ID do documento no Firestore.
3.  **Consistência Garantida**: Esta abordagem garante que o `ContentContext` (que lê o `siteIndex` para saber que conteúdo pedir) peça sempre o ID de documento correto. O erro anterior ocorreu porque o script usava o nome do ficheiro diretamente, criando uma inconsistência (`heroVariationContent` na base de dados vs. `heroVariation` esperado pelo `siteIndex`).

---

### Fluxo Arquitetural - Componentes Internos

```
siteIndex.json (manifesto)
    ↓
ContentContext (carregamento dinâmico)
    ↓
TravelPackages (componente contentor)
    ↓
TabGrid (lógica de negócio)
    ├─→ TabNav (navegação)
    └─→ CardGrid (grade)
        └─→ TravelPackageCard (cartão individual)
```

### Arquitetura de Componentes de Base Reutilizáveis

Para garantir a máxima consistência visual, centralizar a lógica de layout e simplificar a manutenção, o projeto implementa um conjunto de componentes de base obrigatórios.

#### **1. Componente `Section.tsx` (Obrigatório)**

O componente `<Section>` é o alicerce fundamental para a construção de todas as secções visíveis na página. **O seu uso é absolutamente obrigatório** para qualquer contentor que represente uma secção principal do site (e.g., Hero, Sobre, Pacotes de Viagem, Contacto).

**Responsabilidades**:

*   **Estrutura de Layout Unificada**: Implementa uma estrutura de *wrapper* duplo (um `<section>` exterior e um `<div>` interior) que controla o layout, o espaçamento e o alinhamento de forma consistente em todo o site.
*   **Estilização Dinâmica via `DesignContext`**: Obtém **toda** a sua configuração de estilo (cores de fundo, *paddings* responsivos, *overlays*, cantos arredondados, etc.) diretamente do `DesignContext`. A configuração é centralizada no objeto `design.sections` dentro de `src/config.ts`.
*   **Injeção de CSS Responsivo**: Gera e injeta dinamicamente uma tag `<style>` para aplicar *media queries* e pseudo-elementos (`::before` para *overlays*), garantindo um design responsivo e complexo sem a necessidade de bibliotecas externas como `styled-components`.
*   **Isolamento de Estilo**: Garante que os estilos de uma secção não afetam outras, utilizando IDs únicos para escopar o CSS gerado.

**Como Utilizar**:

O componente é invocado com duas *props* principais:

1.  `sectionId`: (Obrigatória) Uma `string` que corresponde a uma chave no objeto `design.sections` em `config.ts`. Esta *prop* determina qual configuração de design será aplicada à secção.
2.  `backgroundImageUrl`: (Opcional) Uma `string` com uma URL de imagem. Esta *prop* permite **fazer o *override*** da imagem de fundo definida na configuração. É crucial para secções cujo conteúdo, incluindo imagens, é gerido dinamicamente (e.g., via `ContentContext`).

**Exemplo de Configuração (em `src/config.ts`)**:

```typescript
// Em src/config.ts
export const design = {
  // ...
  sections: {
    hero: {
      layout: {
        maxWidth: '100%',
        backgroundColor: 'white',
        padding: { /* ... */ },
        inner: {
          maxWidth: '100%',
          overflow: 'hidden',
          rounded: true,
          background: {
            type: 'image',
            value: '', // Pode ser um fallback, mas será substituído se `backgroundImageUrl` for passada
            overlay: {
              color: 'linear-gradient(...)',
              opacity: 1,
            },
          },
        },
      },
    },
    // ... outras secções
  }
} as const;
```

**Exemplo de Utilização (em `HeroSection.tsx`)**:

```jsx
import Section from '@/components/ui/Section';
import { useContent } from '@/contexts/ContentContext';

const HeroSection = () => {
  const { getContentForComponent } = useContent();
  const hero = getContentForComponent<any>('HeroSection');

  return (
    <Section 
      sectionId="hero"
      backgroundImageUrl={hero.backgroundImageUrl}
    >
      {/* Todo o conteúdo da secção vem aqui dentro */}
    </Section>
  );
};
```

**Regras de Ouro**:
- **NUNCA** criar uma secção de página sem a envolver no componente `<Section>`.
- **NUNCA** aplicar classes de utilitário de layout (padding, margin, background) diretamente no componente de secção (e.g. `HeroSection`). Essa lógica pertence **exclusivamente** à configuração em `config.ts`.

#### **2. Componente `SectionTitle.tsx`**

**Responsabilidades**:
- **Renderização Unificada**: Renderiza um pré-título (`subtitle`), um título principal (`title`), e uma descrição (`description`).
- **Estilização Dinâmica via `DesignContext`**: Obtém todas as suas propriedades de estilo (família da fonte, tamanho, cor, etc.) diretamente do `DesignContext`.
- **Variantes de Estilo**: Suporta uma prop `variant` (ex: `headings`, `hero_headings`) para aplicar diferentes conjuntos de estilos definidos no `config.ts`.
- **Injeção de CSS Responsivo**: Gera e injeta dinamicamente media queries para ajustar os tamanhos de fonte em diferentes breakpoints (md, lg), garantindo responsividade sem classes de utilitário CSS.
- **Overrides de Cor**: Permite a sobreposição de cores para `title`, `subtitle`, e `description` através de props, útil para secções com fundos escuros (ex: `AboutSectionGallery`).

#### **2. Integração com `config.ts` e `DesignContext`**

O `SectionTitle` depende de um conjunto específico de tokens de design definidos em `config.ts` e disponibilizados através do `DesignContext`. A estrutura de configuração é a seguinte:

```typescript
// Em src/config.ts
const config = {
  // ... outras configurações
  headings: {
    fontFamily: "'General Sans', sans-serif",
    fontSize: '5rem',      // Base (mobile)
    fontSizeMd: '7rem',    // Tablet
    fontSizeLg: '9rem',    // Desktop
    fontWeight: '300',
    letterSpacing: '-0.05em',
    color: '#1a1a1a',
    // ...
  },
  preTitle: {
    fontFamily: "'General Sans', sans-serif",
    fontSize: '1.125rem', // 18px
    fontWeight: '400',
    color: '#666666',
    marginBottom: '0.5rem',
  },
  titleDescription: {
    fontFamily: "'General Sans', sans-serif",
    fontSize: '1.125rem', // 18px
    fontWeight: '400',
    color: '#555555',
    lineHeight: '1.6',
    marginTop: '1.5rem',
  }
};
```

- `headings` e `hero_headings`: Definem o estilo do título principal.
- `preTitle`: Define o estilo do subtítulo (o texto que aparece acima do título principal).
- `titleDescription`: Define o estilo do parágrafo de descrição abaixo do título.

#### **3. Processo de Refatoração**

Todos os componentes de secção foram refatorados para utilizar o `SectionTitle`. O markup anterior, que consistia em elementos `<h2>` e `<p>` com estilos inline ou classes, foi substituído por uma única chamada ao `SectionTitle`.

**Componentes Afetados**:
- `HeroSection`
- `TravelPackages`
- `WhyFeatureCards`
- `TestimonialsSection`
- `TravelDesigner`
- `AboutSectionGallery`
- `ContactSection`

**Exemplo de Refatoração (em `ContactSection.tsx`)**:

**Antes**:
```jsx
<div class="text-center mb-12 md:mb-16">
    <p class="text-lg text-gray-600" style={{ fontFamily: design.fonts.body }}>{contact.preTitle}</p>
    <h2 
        class="text-7xl md:text-9xl font-light tracking-tighter text-gray-900 mt-2"
        style={{ fontFamily: design.fonts.title }}
    >
        {contact.title}
    </h2>
    <p class="text-lg text-gray-500 mt-6 max-w-3xl mx-auto" style={{ fontFamily: design.fonts.body }}>
        {contact.description}
    </p>
</div>
```

**Depois**:
```jsx
<div className="text-center mb-12 md:mb-16">
  <SectionTitle
    subtitle={contact.preTitle}
    title={contact.title}
    description={contact.description}
    variant="headings"
  />
</div>
```

**Benefícios**:
- **Consistência Absoluta**: Todos os títulos são 100% consistentes.
- **Manutenção Centralizada**: Para alterar o estilo de todos os títulos do site, basta modificar o objeto `headings` em `config.ts`.
- **Código Limpo**: Os componentes de secção ficam mais limpos e focados na sua própria lógica, delegando a apresentação do título.

---

### Análise Ficheiro a Ficheiro

#### **1. `src/data/siteIndex.json` - Manifesto Central**

Define a estrutura completa de componentes e seus componentes internos:

```json
{
  "sections": [
    {
      "id": "c1e1g1c3-5f7j-8c2c-2c5c-3f5h5i5e1g1c",
      "name": "travelPackages",
      "component": "TravelPackages",
      "isActive": true,
      "internalComponents": [
        {
          "type": "TabGrid",
          "name": "mainPackages",
          "contentFile": "travelPackagesTabCards.json",
          "showTabsNavigation": true
        }
      ]
    }
  ]
}
```

**Função**: O manifesto não apenas define componentes de topo, mas também especifica quais componentes internos cada seção contém e como devem ser configurados.

#### **2. `src/contexts/ContentContext.tsx` - Sistema de Carregamento Dinâmico**

**Componentes Internos Principais**:
- `loadContentSection()`: Carrega ficheiros JSON dinamicamente usando `import()`
- `buildComponentToSectionMap()`: Cria mapeamento Component → Section baseado no siteIndex
- `getContentForComponent()`: API principal que componentes usam para obter dados
- **Sistema de Fallback**: API primeiro (Firebase), depois local se API falhar

**Função**: Gere todo o carregamento de conteúdo baseado no `siteIndex.json`, permitindo que componentes obtenham dados sem hardcoding.

#### **3. `src/components/TravelPackages.tsx` - Componente Contentor**

**Responsabilidades**:
- Carrega metadados da seção via `getContentForComponent('TravelPackages')`
- Lê `siteIndex` para descobrir quais componentes internos renderizar
- Delega renderização para componentes internos baseado em configuração

**Lógica de Renderização**:
```typescript
{travelPackagesSection?.internalComponents?.map((component, index) => {
  if (component.type === 'TabGrid') {
    return (
      <TabGrid
        key={`${component.name}-${index}`}
        contentFile={component.contentFile}
        showTabsNavigation={component.showTabsNavigation}
        // ... props
      />
    );
  }
  return null;
})}
```

#### **4. `src/components/TabGrid.tsx` - Componente de Lógica de Negócio**

**Função**: Implementa a lógica de tabs + grid, carregando dados do ficheiro especificado no siteIndex.

**Componentes Internos**:
- `loadTabGridContent()`: Sistema de carregamento duplo (ContentContext → fallback import)
- **Estado Local**: `activeTab`, `content` para controlar UI
- **Filtragem Dinâmica**: `cards.filter(card => activeTabObj.cardIds.includes(card.id))`
- **Delegação**: Renderiza `<TabNav>` + `<CardGrid>` como componentes filhos

#### **5. `src/components/TabNav.tsx` - Componente de Navegação**

**Função**: Renderiza botões de navegação entre categorias/tabs.

**Componentes Internos**:
- **Lógica Condicional**: `!showNavigation || tabs.length <= 1` → não renderiza
- **Estado Controlado**: Recebe `activeTab` e `onTabChange` como props
- **Design System**: Usa `useDesign()` para cores e fontes consistentes

#### **6. `src/components/CardGrid.tsx` - Grid de Cartões**

**Função**: Renderiza grade responsiva de cartões filtrados para categoria ativa.

**Componentes Internos**:
- **Layout Responsivo**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Delegação**: Renderiza `<TravelPackageCard>` para cada item
- **Props Forwarding**: Passa `ctaText`, `moreDetailsText`, `onWhatsAppContact`

#### **7. `src/components/TravelPackageCard.tsx` - Componente de Cartão Individual**

**Função**: Renderiza cartão individual com todos os detalhes do pacote.

**Componentes Internos**:
- **UI Components**: `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardFooter>`
- **Ícones**: `<MapPin>`, `<CheckCircle>`, `<MessageCircle>` (Lucide React)
- **Interatividade**: Hover effects, onClick handler para WhatsApp
- **Design System**: Usa `useDesign()` para consistência visual

### Estrutura de Dados Refatorizada

#### **8. `src/data/travelPackagesTabCardsContent.json` - Dados Estruturados**

**Estrutura Após Refatorização**:
```json
{
  "tabs": [
    {
      "id": "tropical",
      "name": "Tropical",
      "cardIds": ["pkg_a2b3c4d5", "pkg_e6f7g8h9"]
    },
    {
      "id": "aventura",
      "name": "Aventura",
      "cardIds": ["pkg_a2b3c4d5", "pkg_i1j2k3l4"]
    }
  ],
  "cards": [
    {
      "id": "pkg_a2b3c4d5",
      "name": "Paraíso nas Maldivas",
      "categoryIds": ["tropical", "aventura"]
    }
  ]
}
```

**Benefícios da Refatorização**:
- **Multi-categoria**: Pacotes podem aparecer em múltiplas tabs via `cardIds`
- **IDs Únicos**: Cada pacote tem identificador único para CRUD
- **Relacionamento Flexível**: Tabs referenciam cards via arrays de IDs
- **Escalabilidade**: Fácil adição/remoção de categorias e pacotes

#### **9. `src/data/travelPackagesContent.json` - Metadados da Seção**

Contém metadados da seção TravelPackages:
- `preTitle`, `title`, `description`: Conteúdo principal
- `ctaText`, `moreDetailsText`: Textos de interface
- `contactMessageTemplate`: Template para WhatsApp

#### **10. `db_connect.ts` - Configuração de Conexão**

Define configuração Firebase:
- `ORG_ID = 'org_nomad_wise'`: Identificador da organização
- `SITE_ID`: Identificador único do website
- `API_BASE_URL`: URL base da API

### Princípios Arquiteturais dos Componentes Internos

1. **Separação de Responsabilidades**: Cada componente tem função específica e bem definida
2. **Configuração via Manifesto**: `siteIndex.json` determina estrutura e comportamento
3. **Delegação Hierárquica**: Componentes-pai delegam para filhos especializados
4. **Design System Consistente**: Todos usam `useDesign()` para consistência visual
5. **Carregamento Dinâmico**: Dados carregados baseado em configuração, não hardcoding
6. **Fallback Gracioso**: Sistema duplo de carregamento (API → local)

### Vantagens da Arquitetura Modular

---

## 🤖 Arquitetura de Edição com Inteligência Artificial (AI-Powered Editing)

Esta seção detalha a arquitetura do sistema de edição de conteúdo assistido por IA, projetado para ser robusto, modular e integrado de forma transparente ao painel de administração existente.

### Visão Geral da Arquitetura

A arquitetura de edição por IA é dividida em duas partes principais: o **Frontend**, que vive no projeto `intuitiva-client-dashboard`, e o **Backend**, que é um endpoint Express dentro do mesmo projeto (`functions/src/ai-enhance.js`).

O fluxo é o seguinte:
1.  O **Frontend** apresenta um editor de seção (ex: `FAQEditor`).
2.  O editor é envolvido pelo componente `AIEnhancedSection`, que fornece a interface de IA.
3.  O usuário insere um prompt de texto (ex: "Torne as respostas mais amigáveis").
4.  O componente `AIEditor` envia o prompt e o JSON do conteúdo atual para o **Backend**.
5.  O **Backend** constrói um *system prompt* detalhado, combinando as instruções do usuário com regras estritas de preservação de estrutura, e chama a API da OpenAI.
6.  A OpenAI retorna o JSON aprimorado.
7.  O **Backend** encaminha a resposta para o **Frontend**.
8.  O **Frontend** atualiza o estado no `SectionContext` imediatamente, e a UI reflete as alterações.

### Frontend: Componentes e Contextos

A interface de edição é construída sobre uma base de componentes reutilizáveis e gerenciamento de estado centralizado via Contexts do React.

#### **1. `SectionContext` - O Coração do Gerenciamento de Estado**
- **Responsabilidade**: Manter o estado do conteúdo da seção atualmente selecionada (`selectedSectionContent`), carregá-lo do Firebase e fornecer funções para salvá-lo (`saveSectionContent`).
- **Regra Crítica**: Toda a edição, seja manual ou por IA, ocorre em uma cópia do conteúdo no estado do React. Os dados só são persistidos no Firebase quando a função `saveSectionContent` é explicitamente chamada.

#### **2. `SectionEditor.tsx` - O Roteador de Editores**
- **Função**: Atua como um contentor principal que renderiza o editor apropriado com base no tipo de seção selecionada (ex: `faq`, `tabGrid`).
- **Lógica**: Utiliza um `switch` no `editorType` (fornecido pelo `SectionContext`) para montar dinamicamente componentes como `FAQEditor`, `AboutGalleryEditor`, etc.

#### **3. `AIEnhancedSection.tsx` - O Injetor de IA**
- **Função**: Um componente *wrapper* de ordem superior que "super-carrega" qualquer editor de seção com funcionalidades de IA.
- **Como Funciona**: Ele envolve o editor específico (ex: `<FAQEditor />`) e fornece a UI para a interação com a IA, incluindo o botão "Enable AI" e o painel do `AIEditor`.
- **Props Chave**:
    - `data`: Recebe o JSON do conteúdo a ser editado.
    - `onDataChange`: Uma função de *callback* que é chamada com o novo JSON aprimorado pela IA. É assim que o `AIEnhancedSection` comunica as alterações de volta ao componente pai (ex: `FAQEditor`).

#### **4. `AIEditor.tsx` - A Interface de Prompt**
- **Função**: O componente final na hierarquia, responsável por renderizar a `textarea` para o prompt do usuário e o botão "Enhance Content".
- **Lógica de Comunicação**: 
    1.  Captura o prompt do usuário.
    2.  Ao clicar no botão, faz uma chamada `fetch` para o endpoint `/ai-enhance-content` no backend.
    3.  Envia o JSON atual (`data`) e o `prompt` do usuário no corpo da requisição.
    4.  Ao receber uma resposta bem-sucedida, chama a função `onEdit` (passada como *prop*), que por sua vez aciona o `onDataChange` no `AIEnhancedSection`, completando o ciclo de atualização do estado.

### Backend: O Endpoint `/ai-enhance-content`

O cérebro da operação de IA reside em um único endpoint Express, localizado em `functions/src/ai-enhance.js`.

- **Método**: `POST`
- **Corpo da Requisição (Request Body)**:
    ```json
    {
      "data": { ... }, // O objeto JSON do conteúdo atual
      "prompt": "...",   // A instrução de texto do usuário
      "sectionType": "..." // Opcional, para logging
    }
    ```
- **Lógica Principal**:
    1.  **Validação**: Garante que `data`, `prompt` e a chave da API da OpenAI (`OPENAI_API_KEY`) estão presentes.
    2.  **Construção do System Prompt**: Este é o passo mais crítico. O backend não envia apenas o prompt do usuário para a OpenAI. Ele constrói um *system prompt* robusto que inclui:
        - **Regras Estritas**: Instruções para preservar a estrutura do JSON, tipos de dados e nunca alterar campos protegidos (IDs, URLs, etc.).
        - **Operações Permitidas**: Define explicitamente o que a IA pode fazer (editar texto, adicionar/remover/reordenar itens em arrays).
        - **Formato de Saída**: Exige que a resposta seja apenas o JSON aprimorado, sem texto adicional ou *markdown*.
        - **Injeção de Contexto**: O JSON original e o prompt do usuário são injetados neste *template*.
    3.  **Chamada à API da OpenAI**: Envia o *system prompt* completo para o modelo `gpt-4-turbo-preview`.
    4.  **Parsing da Resposta**: Analisa a resposta da IA para extrair o JSON.
    5.  **Resposta ao Frontend**: Envia o objeto JSON aprimorado de volta para o cliente.

### Fluxo de Dados Completo (End-to-End)

1.  **Seleção e Carregamento**: O usuário seleciona uma seção (ex: FAQ). O `SectionContext` carrega o conteúdo JSON correspondente do Firebase para a variável de estado `selectedSectionContent`.

2.  **Renderização e Estado Local**: O `FAQEditor` é renderizado. Ele copia o `selectedSectionContent` para seu próprio estado local, `faqData`, para permitir a edição.

3.  **Requisição da IA**: O usuário insere um `prompt` no `AIEditor` e clica em "Enhance". O `AIEditor` envia o `faqData` atual e o `prompt` para o endpoint do backend (`/ai-enhance-content`), que agora usa a API Gemini.

4.  **Resposta da IA e Atualização de Contexto (O Passo Chave)**: O backend retorna o JSON aprimorado pela Gemini. A função `handleAIDataChange` no `FAQEditor` é acionada e executa duas ações críticas em sequência:
    - **a) Atualiza o Estado Local**: Chama `setFaqData(newJson)` para que a UI do editor (a lista de perguntas e respostas) seja atualizada instantaneamente.
    - **b) Sincroniza o Contexto Compartilhado**: Chama `setSelectedSectionContent(dataToSync)`, onde `dataToSync` é o objeto de conteúdo completo com os itens atualizados pela IA. **Esta é a ação que garante que a mudança seja refletida em toda a aplicação, não apenas no editor.**

5.  **Revisão do Usuário**: Neste ponto, as alterações são visíveis na tela, mas **existem apenas na memória do navegador** (no estado do React e no Context). O banco de dados ainda não foi modificado.

6.  **Persistência no Banco de Dados (Ação Manual)**: O usuário revisa as alterações feitas pela IA. Se estiver satisfeito, ele clica no botão "Salvar" principal da seção. Esta ação final chama a função `saveSectionContent()`, que pega o estado mais recente de `selectedSectionContent` (que foi atualizado no passo 4b) e o salva permanentemente no Firebase.

Esta arquitetura garante que a funcionalidade de IA seja poderosa, segura e desacoplada dos componentes de edição principais, permitindo fácil manutenção e expansão futura.

- **Reutilização**: `TabGrid` pode ser usado por outras seções
- **Configurabilidade**: Comportamento controlado via JSON
- **Testabilidade**: Componentes pequenos e focados
- **Manutenibilidade**: Mudanças isoladas em componentes específicos
- **Escalabilidade**: Fácil adição de novos tipos de componentes internos

### <span style="color:#2E86C1">🧩 Componentes UI Essenciais (Nova Arquitetura)</span>

<span style="color:#2E86C1">
Esta seção descreve os novos componentes essenciais de UI que foram adicionados ao projeto para aumentar a consistência, reusabilidade e manutenção do código.
</span>

#### <span style="color:#2E86C1">**1. Componente `Section`**</span>

<span style="color:#2E86C1">
O componente `Section` é um wrapper genérico que encapsula a lógica comum a todas as seções do site:

**Responsabilidades**:
- Aplicar layout e estilos consistentes às seções (padding, background, width, etc)
- Controlar o layout responsivo através do `DesignContext`
- Prover estrutura interna consistente com camadas para overlay e conteúdo
- Servir como fonte única da verdade para os estilos de seção

**Regras de Uso**:
1. **Autoridade do Section**: O componente `Section` é o único que deve definir o layout externo (padding, background, container). Componentes filhos não devem sobrescrever estas definições.
2. **Configuração via Context**: O componente deve obter seus estilos do `DesignContext`, nunca por hard-coding.
3. **Wrapper Obrigatório**: Todos os componentes que representam seções completas de página devem usar `Section` como wrapper.
</span>

#### <span style="color:#2E86C1">**2. Componente `SectionTitle`**</span>

<span style="color:#2E86C1">
O componente `SectionTitle` fornece uma forma padronizada para renderizar títulos, subtítulos e descrições de seções:

**Responsabilidades**:
- Renderizar títulos de seção usando tipografia do design system
- Aplicar estilos responsivos (tamanho de fonte, margens, etc)
- Manter consistência visual entre diferentes seções

**Regras de Uso**:
1. **Variantes de Título**: Utilizar as variantes disponíveis ('headings', 'hero_headings') conforme o contexto da seção
2. **Context-Driven**: Usar `useDesign()` para obter valores de tipografia, nunca hardcoding
3. **Responsividade Consistente**: Os tamanhos e estilos devem vir do design system para manter consistência
</span>

#### <span style="color:#2E86C1">**3. Padrões Proibidos**</span>

<span style="color:#2E86C1">
- **Hard-coding de Estilos**: Não adicionar classes Tailwind ou estilos CSS que entrem em conflito com `Section` ou `SectionTitle`
- **CSS Duplicado**: Evitar duplicação de estilos já controlados pelos componentes essenciais
- **Contornar a Hierarquia**: Não pular a hierarquia criando seções sem o componente `Section`
</span>

<span style="color:#1E8449">

### Variantes de Título e Design Dinâmico

Para suportar diferentes estilos de título em várias seções (por exemplo, um título dramático no `HeroSection` vs. um título padrão nas outras seções), o `SectionTitle` implementa um sistema de **variantes**.

**Como Funciona:**

1.  **Configuração Centralizada em `config.ts`**: O ficheiro `src/config.ts` define múltiplos objetos de estilo de título dentro do `export const design`.
    -   `headings`: A configuração padrão para a maioria dos títulos de seção.
    -   `hero_headings`: Uma configuração especial com estilos mais proeminentes, usada especificamente para o `HeroSection`.

    ```typescript
    // Em src/config.ts
    export const design = {
      // ... outras configurações
      hero_headings: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '5.5rem',
        // ... outros estilos
      },
      headings: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '2.5rem',
        // ... outros estilos
      },
      // ...
    };
    ```

2.  **Carregamento via `DesignContext`**: O `DesignContext` carrega este objeto `design` e o disponibiliza para toda a aplicação. A interface `DesignConfig` foi atualizada para incluir a propriedade opcional `hero_headings`.

3.  **Seleção da Variante no Componente**: O componente `SectionTitle` aceita uma prop `variant`. Com base nesta prop, ele seleciona o objeto de configuração apropriado (`design.headings` ou `design.hero_headings`).

    ```typescript
    // Lógica dentro de SectionTitle.tsx
    const headingConfig = (variant === 'hero_headings' && design.hero_headings)
      ? design.hero_headings
      : design.headings;
    ```

**Exemplo de Uso:**

Para usar a variante padrão:
```jsx
<SectionTitle title="Sobre Nós" />
```

Para usar a variante do `HeroSection`:
```jsx
<SectionTitle title="Bem-vindo" variant="hero_headings" />
```

Este sistema garante que o design permanece consistente e centralizado, ao mesmo tempo que oferece a flexibilidade necessária para estilos de seção únicos.
</span>

## 🔄 Refatorização Multi-Tipo: Extensão da Arquitetura Modular

### Visão Geral da Extensão Multi-Tipo

A arquitetura modular foi desenhada para suportar **múltiplos tipos de cards** através do mesmo sistema `TabGrid` → `CardGrid`. Esta extensibilidade permite reutilizar toda a lógica de tabs, filtragem e layout para diferentes tipos de conteúdo.

### Exemplo Prático: Transformação da Secção de Testemunhos

#### **Estado Atual vs. Modelo Modular**

**Antes (Monolítico)**:
```
TestimonialsSection → Renderização directa de cards
```

**Depois (Modular)**:
```
TestimonialsSection (contentor)
    ↓
TabGrid (lógica reutilizável)
    ↓
CardGrid (multi-tipo: travel|testimonial)
    ↓
TestimonialCard (específico)
```

### Arquitectura Multi-Tipo Detalhada

#### **1. Extensão do `siteIndex.json` - Configuração Multi-Tipo**

```json
{
  "sections": [
    {
      "id": "d2f2h2d4-6g8k-9d3d-3d6d-4g6i6j6f2h2d",
      "name": "testimonials",
      "component": "TestimonialsSection",
      "isActive": true,
      "internalComponents": [
        {
          "type": "TabGrid",
          "name": "mainTestimonials",
          "contentFile": "testimonialsTabCards.json",
          "showTabsNavigation": false,
          "cardType": "testimonial",
          "gridLayout": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        }
      ]
    }
  ]
}
```

**Novas Properties**:
- `cardType`: Define que tipo de card renderizar
- `gridLayout`: Layout específico para este tipo de conteúdo
- `showTabsNavigation: false`: Para casos de categoria única

### Benefícios da Refatorização Multi-Tipo

#### **1. Reutilização Máxima**
- **`TabGrid`**: Reutilizado para travel packages, testimonials, portfolios, etc.
- **`CardGrid`**: Suporte nativo para múltiplos tipos de card
- **Lógica de Tabs**: Funciona igual independentemente do tipo de conteúdo

#### **2. Configurabilidade Total**
- **Via siteIndex.json**: Cada secção define seu `cardType` e `gridLayout`
- **Props Condicionais**: Apenas as props necessárias são passadas
- **Layout Flexível**: Grids personalizáveis por tipo de conteúdo

#### **3. Extensibilidade Futura**
- **Novos Tipos**: Adicionar `'portfolio'` ou `'blog'` requer apenas:
  - Novo case no `CardGrid`
  - Novo componente específico (ex: `PortfolioCard`)
  - Configuração no `siteIndex.json`
- **Zero Impacto**: Tipos existentes não são afectados

A secção de testemunhos será o **primeiro caso prático** desta refatorização multi-tipo, servindo como **prova de conceito** da arquitectura extensível.

This document outlines the technical architecture of the Hugo Ramos Travel proposal website, focusing on its modular, context-driven, and API-first design.

## 🚨 CORE ARCHITECTURAL RULES - MANDATORY

### Core Architectural Principles

### 1. Dynamic siteIndex-Driven Content Architecture

**CRITICAL RULE**: All component-to-content mapping and content loading must be fully dynamic and driven by `siteIndex.json` as the single source of truth.

#### **Core Concept**
The `siteIndex.json` file serves as a **manifest** that defines the complete mapping between React components and their content sections. This creates a **plugin architecture** where components automatically resolve their content without hardcoding section names.

#### **siteIndex.json Structure**
```json
{
  "sections": [
    {
      "id": "unique-id",
      "name": "hero",              // Content section name
      "component": "HeroSection",   // React component name
      "isActive": true
    },
    {
      "id": "unique-id-2",
      "name": "travelPackages",
      "component": "TravelPackages",
      "isActive": true
    }
  ]
}
```

#### **How It Works**

**1. Runtime Mapping Generation**
```typescript
// ContentContext builds this mapping at runtime:
const componentToSectionMap = {
  "HeroSection": "hero",
  "TravelPackages": "travelPackages",
  "Navigation": "navigation"
  // ... automatically generated from siteIndex.json
};
```

**2. Dynamic Content Resolution**
```typescript
// Component calls this:
const hero = getContentForComponent('HeroSection');

// ContentContext automatically:
// 1. Looks up 'HeroSection' → 'hero' in the mapping
// 2. Returns contentMap.get('hero')
// 3. No hardcoded section names anywhere!
```

**3. Bidirectional Flexibility**
- **Change section name**: Update `siteIndex.json` → All components adapt automatically
- **Add new component**: Create component + update siteIndex → Content loads automatically
- **Multiple components per section**: Multiple components can share the same content section

#### **Implementation Requirements**

**❌ FORBIDDEN - Hardcoded Section Names:**
```typescript
// NEVER do this:
const hero = getSectionContent('hero');
const packages = getSectionContent('travelPackages');
```

**✅ REQUIRED - Dynamic Component Lookup:**
```typescript
// Always do this:
const hero = getContentForComponent('HeroSection');
const packages = getContentForComponent('TravelPackages');
```

**ContentContext Implementation:**
```typescript
const getContentForComponent = <T,>(componentName: string): T | null => {
  if (!siteIndex) return null;
  
  // Build runtime mapping from siteIndex
  const componentToSectionMap = buildComponentToSectionMap(siteIndex);
  const sectionName = componentToSectionMap.get(componentName);
  
  if (!sectionName) {
    console.warn(`No section mapping found for component: ${componentName}`);
    return null;
  }
  
  return (contentMap.get(sectionName) as T) || null;
};
```

#### **Migration Script Alignment**
Migration scripts must use siteIndex.json section names as the source of truth:
```javascript
// Read siteIndex first
const siteIndex = JSON.parse(fs.readFileSync('siteIndex.json', 'utf8'));

// Use section names from siteIndex, not filenames
siteIndex.sections.forEach(section => {
  const expectedFile = `${section.name}Content.json`;
  // Load content using exact section name from manifest
});
```

#### **Plugin Architecture Benefits**

**1. Zero-Code Content Management**
- Add new sections: Update `siteIndex.json` + create content file
- Rename sections: Change `name` in siteIndex → All components adapt
- Remove sections: Set `isActive: false` in siteIndex

**2. Component Reusability**
```json
// Multiple components can use same content:
{ "name": "hero", "component": "HeroSection" },
{ "name": "hero", "component": "HeroBanner" },
{ "name": "hero", "component": "HeroCarousel" }
```

**3. Content Flexibility**
- Same component can use different content sections
- Content structure evolution without code changes
- A/B testing different content for same components

**4. Developer Experience**
- No naming mismatches between files, Firebase, and components
- Single source of truth for all content mapping
- Automatic content resolution
- Future-proof architecture

#### **Validation Rules**
- ✅ Every content component must use `getContentForComponent()`
- ✅ Zero hardcoded `getSectionContent('sectionName')` calls allowed
- ✅ siteIndex.json defines all component-to-content mappings
- ✅ Migration scripts preserve exact siteIndex section names
- ✅ Adding/removing content requires only siteIndex.json changes

#### **🚧 TODO: DesignContext Firebase Integration**

**IDENTIFIED ISSUE**: DesignContext is not loading design configuration from Firebase, creating inconsistent architecture.

**Current State:**
- ✅ **ContentContext**: Loads content dynamically from Firebase
- ❌ **DesignContext**: Still loads from local `/src/config.ts` file

**Missing Implementation:**
```typescript
// DesignContext.tsx currently has placeholder:
// TODO: Replace with actual API call to Intuitiva server
// const response = await fetch(`/api/getSiteDesign/${currentSiteId}`);
```

**Required Firebase Integration:**
- Load `design` config from `organizations/{orgId}/websites/{siteId}/design/designConfig`
- Load `siteConfig` from `organizations/{orgId}/websites/{siteId}/design/siteConfig`
- Load `agentConfig` from `organizations/{orgId}/websites/{siteId}/design/agentConfig`

**Architecture Inconsistency:**
- Content is dynamic from Firebase ✅
- Design/site/agent configs are hardcoded locally ❌
- Breaks single source of truth principle

**Impact:**
- Design changes require code deployment instead of Firebase updates
- Mixed architecture (some dynamic, some static)
- Cannot manage site appearance through Intuitiva dashboard

**Priority:** Medium - Functional but not following established Firebase-first architecture

### 2. Database Connection Setup Rule
**CRITICAL**: Before any development work begins on a new project, the **FIRST** and **MOST IMPORTANT** step is to configure the correct organization and site identifiers in `db_connect.ts` at the project root. This file controls which Firebase organization and website the application connects to. Failure to configure this correctly will result in the application loading incorrect content or failing entirely.

```typescript
// db_connect.ts - MUST BE CONFIGURED FIRST
export const ORG_ID = 'your-organization-id';  // ← UPDATE THIS
export const SITE_ID = 'your-website-id';     // ← UPDATE THIS
```

### **Rule #2: siteIndex.json as Single Source of Truth**
**🗂️ MANDATORY**: ALL content loading decisions MUST be controlled by `siteIndex.json`. This is the **definitive manifesto** that determines what content loads and what components render.

**✅ REQUIRED IMPLEMENTATION:**
- ContentContext MUST dynamically load content based on `siteIndex.sections`
- Only sections with `isActive: true` are loaded
- NO static imports of content JSON files allowed
- ALL content sections loaded via dynamic `import()` statements

**🚫 STRICTLY FORBIDDEN:**
```typescript
// ❌ NEVER DO THIS - Static imports bypass manifesto control
import heroContent from '@/data/heroContent.json';
import aboutContent from '@/data/aboutContent.json';
```

**✅ CORRECT APPROACH:**
```typescript
// ✅ Dynamic loading controlled by siteIndex.json
const loadContentSection = async (sectionName: string) => {
  const contentModule = await import(`@/data/${sectionName}Content.json`);
  return contentModule.default;
};
```

### **Rule #3: Skeleton Loading Standard**
**💀 MANDATORY**: All components that consume ContentContext data MUST implement skeleton loading using `react-loading-skeleton` styled with the design hook.

**Both rules MUST be completed before any other development tasks, including component development or feature implementation.**

---

## 1. Core Principles

- **Component-Based Architecture**: The UI is built with React and TypeScript, with each visual section encapsulated as a reusable component.
- **Centralized State Management**: React Context is used to manage global state, eliminating prop-drilling and centralizing data and design configurations.
- **🗂️ siteIndex.json as Single Source of Truth**: The `siteIndex.json` file is the **definitive manifest** that controls which content sections load and which components render. The `ContentContext` MUST dynamically import content sections based solely on what is defined in `siteIndex.json`. Static imports for content files are **forbidden** - all content loading must be driven by the site index to maintain architectural integrity.
- **Dynamic Content Loading**: All text, images, and configuration are loaded dynamically, making the site fully manageable without code changes.
- **API-First Approach**: The frontend is decoupled from the data source. It fetches all its content from a dedicated API endpoint, with a local fallback mechanism to ensure high availability.
- **🎨 Skeleton Loading Standards**: All components that consume data from `ContentContext` MUST implement skeleton loading states using `react-loading-skeleton`. Skeletons MUST be customized using the `useDesign()` hook to maintain visual consistency with the site's design system. This ensures a smooth loading experience and prevents broken UI states during data fetching.

### Component Architecture Audit

The following table provides a comprehensive audit of all components in the system, their data dependencies, and skeleton loading implementation status:

| Component | Uses ContentContext | Uses DesignContext | Skeleton Loading | Status | Notes |
|-----------|-------------------|------------------|-----------------|--------|---------|
| **Navigation** | ✅ `useContent()` | ✅ `useDesign()` | ✅ Implemented | 🟢 Complete | Logo skeleton with loading state |
| **HeroSection** | ✅ `useContent()` | ✅ `useDesign()` | ✅ Implemented | 🟢 Complete | Full-section skeleton: background, avatar, title, description, buttons, social icons |
| **AboutSectionGallery** | ✅ `useContent()` | ✅ `useDesign()` | ✅ Implemented | 🟢 Complete | Title/description skeletons + masonry grid with per-image skeleton loading |
| **TravelPackages** | ✅ `useContent()` | ✅ `useDesign()` | ✅ Implemented | 🟢 Complete | Comprehensive card-based skeletons: images, titles, descriptions, pricing, buttons |
| **TestimonialsSection** | ✅ `useContent()` | ✅ `useDesign()` | ✅ Implemented | 🟢 Complete | Avatar + name + text skeletons for testimonial cards |
| **ContactSection** | ✅ `useContent()` | ✅ `useDesign()` | ✅ Implemented | 🟢 Complete | Contact cards with icon, title, description, and button skeletons |
| **WhyFeatureCards** | ✅ `useContent()` | ✅ `useDesign()` | ✅ Implemented | 🟢 Complete | Feature cards with icon, title, and description skeletons |
| **Footer** | ✅ `useContent()` | ✅ `useDesign()` | ✅ Implemented | 🟢 Complete | Multi-column layout with text and link skeletons |
| **FloatingWhatsApp** | ❌ No | ✅ `useDesign()` | ❌ N/A | 🟢 Complete | Static floating button, uses only agent config from DesignContext |
| **TravelDesigner** | ✅ `useContent()` | ✅ `useDesign()` | ✅ Implemented | 🟢 Complete | About-agent section with comprehensive skeleton: titles, image, paragraphs, social icons |
| **HamburgerIcon** | ❌ No | ❌ No | ❌ N/A | 🟢 Complete | Pure UI component for navigation toggle, animation only |
| **SkeletonProvider** | ❌ No | ✅ `useDesign()` | ✅ Provider | 🟢 Complete | Wraps app with SkeletonTheme using design system colors |

#### Summary of Audit Findings:
- **Total Components Analyzed**: 12
- **Components Using ContentContext**: 9 (Navigation, HeroSection, AboutSectionGallery, TravelPackages, TestimonialsSection, Footer, ContactSection, WhyFeatureCards, TravelDesigner)
- **Components Using Only DesignContext**: 2 (FloatingWhatsApp, SkeletonProvider)
- **Pure UI Components**: 1 (HamburgerIcon)
- **Components with Skeleton Loading**: 10 (9 content components + SkeletonProvider)
- **Skeleton Loading Coverage**: 100% of content-loading components

**✅ Skeleton Implementation Status**: 
All skeleton loading implementations have been successfully completed across all content-loading components. Every component that consumes ContentContext data implements comprehensive skeleton loading using `react-loading-skeleton` with design system integration. Static components (FloatingWhatsApp, HamburgerIcon) correctly do not implement skeleton loading as they don't load content data.

## 2. siteIndex-Driven Dynamic Content Loading

### 🗂️ Architecture Overview

The application implements a **manifesto-driven architecture** where `siteIndex.json` serves as the **definitive single source of truth** for all content loading decisions. This architecture eliminates static imports and ensures complete control over what content loads.

### 📋 Core Implementation Rules

1. **🚫 NO Static Content Imports**: Static imports of content JSON files are **strictly forbidden**
2. **📜 siteIndex.json Controls Everything**: Only sections marked as `isActive: true` in siteIndex.json will load
3. **🔄 Dynamic Loading**: All content sections are loaded dynamically via `import()` statements
4. **🎯 Single Source of Truth**: Changes to content availability require only siteIndex.json updates

### 🏗️ ContentContext Implementation

**CRITICAL UPDATE**: O ContentContext foi atualizado para carregar **TODO o conteúdo** disponível no Firebase, não apenas as secções principais do siteIndex. Isto inclui ficheiros de conteúdo interno como `travelPackagesTabCards` que são referenciados por componentes internos (ex: TabGrid).

#### **Current Implementation (Fixed)**

```typescript
// ✅ CORRECT: Load ALL content from Firebase
const fetchContent = async () => {
  // ... fetch from API ...
  const remoteContent = data.content;
  const remoteSiteIndex = remoteContent.siteIndex;
  
  const newContentMap = new Map<string, any>();
  // Add siteIndex to the map
  newContentMap.set('siteIndex', remoteSiteIndex);
  
  // 🔑 CRITICAL: Load ALL content from Firebase, not just siteIndex sections
  // This includes internal content like travelPackagesTabCards
  for (const [key, value] of Object.entries(remoteContent)) {
    if (key !== 'siteIndex') { // siteIndex already added above
      newContentMap.set(key, value);
      console.log(`✅ Loaded content: ${key}`);
    }
  }
  
  setContentMap(newContentMap);
};
```

#### **Why This Change Was Critical**

**Problem**: O ContentContext anterior só carregava secções definidas em `siteIndex.sections`:
```typescript
// ❌ OLD (BROKEN): Only loaded siteIndex sections
for (const section of remoteSiteIndex.sections) {
  if (remoteContent[section.name]) {
    newContentMap.set(section.name, remoteContent[section.name]);
  }
}
```

**Issue**: Componentes internos como TabGrid precisam de conteúdo que **não** está em `siteIndex.sections` (ex: `travelPackagesTabCards`), causando:
- `getSectionContent('travelPackagesTabCards')` retorna `null`
- Dynamic import falha para ficheiros inexistentes
- Componentes ficam presos em "Loading content..."

**Solution**: Carregar **todo** o conteúdo disponível no Firebase, incluindo ficheiros internos.

#### **Content Loading Strategy**

**Primary Content (siteIndex sections)**:
- `hero`, `travelPackages`, `contact`, etc.
- Definidos em `siteIndex.sections`
- Carregados para renderização principal

**Internal Content (referenced by components)**:
- `travelPackagesTabCards`, `testimonialsData`, etc.
- Referenciados por `internalComponents` em secções
- Carregados para componentes internos como TabGrid

**getSectionContent Behavior**:
```typescript
// Works for both primary and internal content
const hero = getSectionContent('hero');                    // ✅ Primary
const tabData = getSectionContent('travelPackagesTabCards'); // ✅ Internal
```

#### **Key Benefits**

- **🎯 Complete Content Coverage**: All Firebase content accessible via ContentContext
- **🔧 Internal Component Support**: TabGrid and similar components work seamlessly
- **📦 Unified Access**: Single `getSectionContent` interface for all content types
- **🚀 Performance**: No failed dynamic imports or loading loops
- **🛡️ Consistency**: API and local fallback use identical loading logic
- **🎛️ Flexibility**: Support for complex nested content structures

### ❌ Anti-Patterns to Avoid

```typescript
// 🚫 WRONG: Static imports bypass siteIndex control
{{ ... }}
import heroContent from '@/data/heroContent.json';
import aboutContent from '@/data/aboutContent.json';

// 🚫 WRONG: Manual content manifest
const staticManifest = {
  hero: heroContent,
  about: aboutContent
};
```

## 3. Data Flow Architecture

The application follows a clear, three-tier data flow to ensure security, scalability, and maintainability.

```
+--------------------------+      +---------------------------+      +---------------------+
|                          |      |                           |      |                     |
|  Client (Hugo Ramos)     |----->|  API Server (Intuitiva)   |----->|  Firebase/Firestore |
|  (React/Vite)            |      |  (Firebase Functions)     |      |  (Database)         |
|                          |      |                           |      |                     |
+--------------------------+      +---------------------------+      +---------------------+
```

1.  **Client (Hugo Ramos Website)**:
    *   Built with React, TypeScript, and Vite.
    *   On load, the `ContentContext` initiates a `fetch` request to the API server to get all site content.
    *   **Fallback Mechanism**: If the API call fails (e.g., network error), the `ContentContext` automatically loads content from local JSON files located in `/src/data/`. This ensures the site remains operational at all times.
    *   Components consume data from the context using the `useContent()` hook, making them agnostic to the data source.

2.  **API Server (Intuitiva Client Dashboard)**:
    *   An Express.js server running as a Firebase Cloud Function.
    *   It exposes a public, read-only endpoint: `GET /api/sites/{siteId}/content`.
    *   This endpoint is responsible for fetching the site's content from Firestore. It acts as a secure bridge between the client and the database.
    *   It aggregates all content documents (e.g., `hero`, `footer`, `siteIndex`) into a single JSON object and returns it to the client.

3.  **Database (Firebase/Firestore)**:
    *   Uses a multi-tenant structure under `organizations/{orgId}/websites/{siteId}`.
    *   All site-specific content is stored in a dedicated subcollection: `.../websites/{siteId}/content`.
    *   Each document in this subcollection corresponds to a section on the website (e.g., `heroContent`, `footerContent`).

## 4. Project Overview / Visão Geral

Website React para agente de viagens Hugo Ramos com integração Firebase via Intuitiva backend. Sistema refatorado para usar React Contexts com fallback para dados locais, preparado para carregamento dinâmico de conteúdo.

---

## 🎯 FLEXIBLE CONTENT ARCHITECTURE

### **🏗️ Modular Content System**

Sistema integrado com Intuitiva backend para carregar conteúdo dinâmico do Firebase. Cada site pode ter estruturas de conteúdo completamente diferentes mantendo consistência.

#### **📋 Core Structure (IMPLEMENTADO):**
```
organizations/{orgId}/websites/{siteId}/
├── 📄 Documento Principal (Site Skeleton)
│   ├── id: string                 # ID do site (ex: "site_rc_travel")
│   ├── name: string               # Nome público do site (ex: "RC Travel Website")
│   ├── organizationId: string     # ID da organização a que pertence
│   ├── url: string (opcional)     # URL de produção do site
│   ├── isActive: boolean          # Define se o site está ativo ou não
│   ├── createdAt: Timestamp       # Data de criação do registo
│   └── updatedAt: Timestamp       # Data da última atualização
│
├── 📁 content/ (subcoleção)
│   ├── siteIndex                   # 🔑 SEMPRE EXISTE - Lista secções de conteúdo ativas
│   ├── [contentSection]            # Secções dinâmicas baseadas nas necessidades do site
│   └── [customSection]             # Conteúdo específico do site
│
├── 📁 contentSchemas/ (subcoleção) # (Opcional) Define estrutura para cada secção
│   ├── [section].schema           # Schemas de validação
│   └── common.schema              # Tipos de campo partilhados
│
├── 📁 design/ (subcoleção)        # Configuração e styling do site
│   ├── siteConfig                 # Nome, tagline, secções
│   ├── agentConfig                # Info de contacto, detalhes do agente
│   ├── designConfig               # Cores, fonts, layout
│   └── branding                   # Logos, imagens
│
└── 📁 settings/ (subcoleção)      # (Opcional) Configurações técnicas
    ├── googleAnalyticsId
    ├── enableSsl
    └── customDomain
```

#### **🎯 siteIndex Structure (Exemplo Real):**

O `siteIndex` funciona como o "mapa" do site, controlando a ordem, a renderização e o estado de cada secção.

```json
{
  "sections": [
    {
      "id": "e7a7c7e9-1b3f-4e8e-8e1e-9b1d1e1a7c7e",
      "name": "navigation",
      "component": "Navigation",
      "isActive": true
    },
    {
      "id": "f8b8d8f0-2c4g-5f9f-9f2f-0c2e2f2b8d8f",
      "name": "hero",
      "component": "HeroSection",
      "isActive": true
    }
  ]
}
```

### **🌍 Hugo Ramos Content Structure (Modular)**

O conteúdo do site Hugo Ramos está organizado numa estrutura plana e modular dentro da coleção `content`. Cada documento corresponde a uma secção do site. A ligação entre o `siteIndex.json` e o ficheiro de conteúdo correspondente é feita através de um `id` único e partilhado, garantindo a integridade dos dados e desacoplando a lógica do nome do ficheiro.

```
content/
├── siteIndex.json         # 🔑 OBRIGATÓRIO: O manifesto do conteúdo e da estrutura do site.
├── aboutContent.json      # Conteúdo para a secção "Sobre Mim".
├── contactContent.json    # Textos e configurações para a secção de contacto.
├── footerContent.json     # Textos do rodapé (copyright, RNAVT, etc.).
├── heroContent.json       # Conteúdo principal da secção Hero.
├── navigationContent.json # Itens de menu para desktop e mobile, e URL do logo.
├── testimonialsContent.json # Depoimentos de clientes.
├── travelPackages.json    # Pacotes de viagens, categorias e textos associados.
├── whyChooseContent.json  # Destaques da secção "Porque Escolher-me".
└── whyContent.json        # Conteúdo para a secção "Porque".
```

---

## 🔧 REACT CONTEXT ARCHITECTURE

### **Context Providers**

Sistema de contextos React para centralizar configuração e conteúdo:

#### **DesignContext**
- **Responsabilidade:** Configurações estáticas (design, siteConfig, agentConfig)
- **Source:** Local config.ts files
- **Features:** Loading states, error handling
- **Used by:** Todos os componentes UI

#### **ContentContext**
- **Responsabilidade:** Conteúdo dinâmico (travelPackages, testimonials, etc.)
- **Source:** API Intuitiva → Firebase (com fallback para JSON local)
- **Features:** Loading states, error handling, fallback system
- **Used by:** Componentes de conteúdo

### **Fallback System**
```
1. 🌐 API Call → Intuitiva Backend → Firebase
2. ❌ If API fails → 📁 Local JSON files
3. ⚠️ If local fails → 🎯 Default/empty state
```

### **Component Integration (Pós-Refatoração)**

Todos os componentes foram refatorados para uma clara separação de responsabilidades:

- **`useDesign()` (para design e configuração do agente):**
  - `FloatingWhatsApp`, `TravelDesigner`

- **`useContent()` (para todo o conteúdo textual e de imagem):**
  - `Navigation`, `HeroSection`, `AboutSection`, `AboutSectionGallery`, `WhyFeatureCards`, `WhyChoose`, `TravelPackages`, `TestimonialsSection`, `ContactSection`, `Footer`

---

## 🚀 API INTEGRATION PATTERN

### **Backend Integration**
```
Frontend (Hugo Ramos) → Intuitiva Server → Firebase → Response
                     ↘ Local JSON (fallback)
```

### **API Endpoints**
- **GET** `/getSiteContent/{siteId}` - Fetch all site content
- **GET** `/getSiteDesign/{siteId}` - Fetch site design config

### **Environment Variables**
```bash
# Hugo Ramos .env
JWT_SECRET=intuitiva-magic-link-secret-2024
ELASTIC_EMAIL_API_KEY=cebcf938-8295-4ede-8aa7-d8bfe1fd17ac
FIREBASE_CREDENTIALS='{...service-account-json...}'
```

---

## 🔧 Implementation Benefits

- ✅ **Centralized Content Management** - Update content via Intuitiva dashboard
- ✅ **No Code Changes Required** - Content updates without deployment
- ✅ **Reliable Fallback System** - Local JSON as backup
- ✅ **Consistent Architecture** - Shared with Intuitiva projects
- ✅ **Flexible Content Structure** - Easy to add new sections
- ✅ **Type Safety** - Content schemas ensure data consistency

---

## Arquitetura de Conteúdo (Content Architecture)

O conteúdo do site é gerido através de uma arquitetura modular e centralizada, desenhada para ser flexível, escalável e fácil de manter. O sistema é totalmente orientado por um manifesto (`siteIndex.json`) que define as secções ativas do site.

### Princípios

- **Fonte da Verdade Única**: O ficheiro `siteIndex.json` é o único ponto de controlo que define quais as secções que devem ser renderizadas e que componentes usar.
- **Carregamento Dinâmico**: O `ContentContext` carrega dinamicamente o conteúdo de cada secção com base no que está definido no `siteIndex.json`.
- **Mapeamento Flexível**: Um `contentManifest` interno no `ContentContext` mapeia os nomes lógicos das secções (ex: "hero") para os seus respectivos ficheiros de dados JSON (ex: `heroContent.json`). Isto permite renomear ficheiros de dados sem quebrar a aplicação.
- **Consumo Padronizado**: Os componentes consomem dados de forma uniforme através do hook `getSectionContent<T>('sectionName')`.
- **Fallback**: A arquitetura está preparada para, no futuro, dar prioridade ao carregamento de dados via API (Firebase), usando os ficheiros JSON locais como fallback, garantindo que o site nunca fica sem conteúdo.
- **Tipagem Forte**: Todo o conteúdo é estritamente tipado com TypeScript para garantir a integridade dos dados e facilitar o desenvolvimento.

```
content/
├── siteIndex.json         # 🔑 OBRIGATÓRIO: O manifesto do conteúdo e da estrutura do site.
├── aboutContent.json      # Conteúdo para a secção "Sobre Mim".
{{ ... }}

---

## 🎯 Next Steps

1.  **Implementar Renderização Dinâmica**: Modificar a página principal para renderizar as secções com base na ordem e no estado `isActive` do `siteIndex.json`.
2.  **Implementar Chamada à API no `ContentContext`**: Modificar o `ContentContext` para obter o conteúdo do Firebase através de uma API, usando os ficheiros locais como fallback.
3.  **Integração com API de Design**: Fazer o `DesignContext` carregar as configurações do Firebase, em vez do `config.ts` local.
4.  **Testes e QA**: Testar exaustivamente o sistema de fallback e a integração com o Firebase.
5.  **Otimização de Performance**: Implementar caching e lazy loading para o conteúdo carregado remotamente.

---

## 🎯 Fluxo de Dados

1.  **`ContentProvider`**: No topo da aplicação, o `ContentProvider` inicia o processo de carregamento.
2.  **Leitura do `siteIndex.json`**: O provider lê o `siteIndex.json` para saber quais secções estão ativas (ex: `hero`, `contact`, `testimonials`).
3.  **Mapeamento e Carregamento**: Para cada secção ativa, o `ContentProvider` consulta o `contentManifest` para encontrar o ficheiro JSON correspondente. Em seguida, importa estaticamente o conteúdo desse ficheiro.
4.  **Criação do `contentMap`**: O conteúdo carregado de cada secção é armazenado num `Map` JavaScript, onde a chave é o nome da secção (ex: "hero") e o valor é o objeto de conteúdo importado.
5.  **Consumo pelo Componente**: Um componente, como `HeroSection.tsx`, usa o hook `useContent()` para obter a função `getSectionContent`.
6.  **Obtenção de Dados**: O componente chama `const hero = getSectionContent<HeroContent>('hero');`. Esta função simplesmente consulta o `contentMap` com a chave 'hero' e retorna o conteúdo correspondente, já com a tipagem correta.

```mermaid
graph TD
    A[Componente (ex: HeroSection)] -->|1. chama| B(useContent);
    B -->|2. obtém| C{getSectionContent<T>('hero')};
    C -->|3. consulta| D[ContentContext];
    D -->|4. acede ao| E[contentMap];
    E -->|5. retorna| F[Conteúdo de heroContent.json];
    F -->|6. entregue ao| A;

    subgraph ContentProvider na Inicialização
        G[siteIndex.json] -->|lê secções ativas| H{ContentProvider};
        I[Ficheiros JSON] -->|importados para| J[contentManifest];
        H -->|usa o manifest para criar| E;
    end
```

---

## 📦 Guia para Adicionar Novos Componentes

Este guia descreve o processo completo para adicionar um novo componente ao projeto, garantindo que ele se integre corretamente com a arquitetura existente.

### 1. Estrutura de Arquivos Necessária

Para adicionar um novo componente de seção ao site, você precisará criar os seguintes arquivos:

```
src/
├── components/
│   └── NomeDoComponente.tsx       # O componente React principal
├── data/
│   ├── nomeDoComponenteContent.json  # Dados específicos do componente
│   └── siteIndex.json              # Atualizar para incluir o novo componente
└── config.ts                      # Atualizar para incluir configurações de design e conteúdo
```

### 2. Implementação do Componente

1. **Criar o Componente React**: Crie um novo arquivo em `src/components/` seguindo estas regras:

```tsx
import { useState } from 'react';
import { useContent } from '@/contexts/ContentContext';
import Section from '@/components/ui/Section';
import SectionTitle from '@/components/ui/SectionTitle';

const NomeDoComponente = () => {
  // Obter conteúdo do ContentContext
  const { getContentForComponent } = useContent();
  const conteudo = getContentForComponent<TipoDoConteudo>('NomeDoComponente');
  
  // Verificar se o conteúdo existe
  if (!conteudo) {
    return null;
  }

  return (
    <Section sectionId="nomeDoComponente">
      {/* Usar SectionTitle para o título da seção */}
      <SectionTitle 
        variant="headings" 
        useHtmlRendering={true} 
      />
      
      {/* Conteúdo específico do componente */}
      {/* ... */}
    </Section>
  );
};

export default NomeDoComponente;
```

2. **Regras Obrigatórias**:
   - Sempre use o componente `<Section>` como wrapper externo
   - Sempre use `<SectionTitle>` para títulos de seção
   - Obtenha o conteúdo via `useContent()` hook
   - **IMPORTANTE**: Ao usar `getContentForComponent()`, utilize sempre o nome do componente (definido como `component` no siteIndex.json), não o nome da seção. Por exemplo: `getContentForComponent('FAQ')` e não `getContentForComponent('faqContent')`
   - Implemente verificação de conteúdo nulo

### 3. Arquivo de Conteúdo JSON

Crie um arquivo JSON em `src/data/` com o seguinte formato:

```json
{
  "title": "Título da Seção",
  "subtitle": "Subtítulo opcional",
  "description": "Descrição da seção que aparece abaixo do título",
  
  // Dados específicos do componente
  "items": [
    // Array de itens específicos do componente
  ]
}
```

### 4. Atualizar o Manifesto (siteIndex.json)

Adicione o novo componente ao arquivo `src/data/siteIndex.json`:

```json
{
  "sections": [
    // ... componentes existentes
    {
      "id": "id-unico-do-componente",
      "name": "nomeDoComponente",
      "component": "NomeDoComponente",
      "isActive": true
    },
    // ... outros componentes
  ]
}
```

**Importante**: A ordem dos componentes no array `sections` determina a ordem de renderização no site.

### 5. Configuração de Design

Adicione a configuração de design da seção em `src/config.ts`:

```typescript
export const design = {
  // ... configurações existentes
  sections: {
    // ... seções existentes
    nomeDoComponente: {
      layout: {
        maxWidth: '100%',
        backgroundColor: '#FFFFFF', // ou outra cor
        padding: {
          mobile: '4rem 1rem',
          tablet: '6rem 2rem',
          desktop: '6rem 2rem',
        },
        inner: {
          maxWidth: '1280px',
          margin: '0 auto',
          backgroundColor: 'transparent',
          padding: {
            mobile: '0',
            tablet: '0',
            desktop: '0',
          },
          rounded: false,
          overflow: 'visible',
          background: {
            type: 'color',
            value: 'transparent',
          },
        },
      },
    },
  },
}
```

### 6. Configuração de Conteúdo

Adicione a configuração de conteúdo da seção em `src/config.ts`:

```typescript
export const siteConfig = {
  // ... configurações existentes
  sections: {
    // ... seções existentes
    nomeDoComponente: {
      title: "Título da Seção",
      subtitle: "Subtítulo opcional",
      description: "Descrição da seção"
      // Outras configurações específicas do componente
    },
  }
}
```

### 7. Carregando Conteúdo na Base de Dados

#### 7.1 Carregando Componentes Específicos

Para carregar apenas o conteúdo de um novo componente na base de dados sem afetar o conteúdo existente, use o script `upload-content-to-firebase.js`. Este script carrega qualquer arquivo de conteúdo JSON especificado e atualiza o manifesto `siteIndex.json` na base de dados Firebase.

```bash
# Na pasta raiz do projeto

# Carregar o conteúdo do FAQ (padrão se nenhum arquivo for especificado)
node scripts/upload-content-to-firebase.js

# Ou especificar um arquivo de conteúdo específico
node scripts/upload-content-to-firebase.js src/data/outroComponenteContent.json
```

Este script carrega apenas o arquivo de conteúdo especificado e o `siteIndex.json` na base de dados Firebase, preservando todo o conteúdo existente.

#### 7.2 Criando Scripts de Seed Personalizados

Você pode criar scripts personalizados para carregar componentes específicos. Um exemplo de estrutura para esses scripts:

```javascript
// scripts/seed-component.js
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração do Firebase
const firebaseConfig = {
  // Suas configurações do Firebase
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Carregar e salvar arquivos JSON específicos
async function seedContent() {
  // Carregar arquivos JSON
  const componentContent = JSON.parse(fs.readFileSync('./src/data/componentContent.json', 'utf8'));
  const siteIndex = JSON.parse(fs.readFileSync('./src/data/siteIndex.json', 'utf8'));
  
  // Salvar no Firestore
  await setDoc(doc(db, 'content', 'componentContent'), componentContent);
  await setDoc(doc(db, 'content', 'siteIndex'), siteIndex);
}

seedContent().catch(console.error);
```

Este padrão permite carregar apenas os arquivos necessários sem afetar o resto do conteúdo na base de dados.

### 8. Checklist Final

- [ ] Componente React criado usando `Section` e `SectionTitle`
- [ ] Arquivo de conteúdo JSON criado
- [ ] Manifesto `siteIndex.json` atualizado
- [ ] Configuração de design adicionada em `config.ts`
- [ ] Configuração de conteúdo adicionada em `config.ts`
- [ ] Conteúdo carregado na base de dados (se aplicável)
- [ ] Componente testado e funcionando corretamente

---

## 🛠️ SettingsContext - Arquitetura de Configuração Centralizada

### Visão Geral

O projeto implementa uma arquitetura de configuração centralizada através do `SettingsContext`, que migra todas as configurações estáticas (`agentConfig` e `siteConfig`) do ficheiro `config.ts` para uma coleção `settings` na base de dados Firestore. Esta abordagem permite atualizações dinâmicas das configurações sem necessidade de redeploy da aplicação.

### Arquitetura e Hierarquia de Providers

```
QueryClientProvider (React Query)
  └── SettingsProvider (Configurações centralizadas)
      └── DesignProvider (Design específico)
          └── ContentProvider (Conteúdo dinâmico)
              └── App Components
```

**Ordem Crítica**: O `SettingsProvider` deve estar **acima** do `DesignProvider` na hierarquia para que as configurações estejam disponíveis antes do design ser carregado.

### Estrutura de Dados

#### 1. Coleção `settings` no Firestore

A coleção `settings` contém dois documentos principais:

- **`agentConfig`**: Informações do agente (nome, contactos, redes sociais)
- **`siteConfig`**: Metadados do site (título, descrição, SEO)

```typescript
// Estrutura do agentConfig
{
  fullName: string,
  email: string,
  phone: string,
  whatsapp: string,
  twitterHandle?: string,
  // ... outras propriedades
}

// Estrutura do siteConfig  
{
  title: string,
  tagline: string,
  description: string,
  keywords: string[],
  // ... outras propriedades
}
```

### Implementação Técnica

#### 1. SettingsContext (`src/contexts/SettingsContext.tsx`)

```typescript
interface SettingsContextType {
  agentConfig: AgentConfig | null;
  siteConfig: SiteConfig | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
```

#### 2. Carregamento de Dados

O `SettingsProvider` utiliza React Query para:
- **Cache**: Armazenar configurações em cache para evitar requests desnecessários
- **Background Refetch**: Atualizar configurações automaticamente
- **Error Handling**: Gerir erros de carregamento com fallbacks
- **Loading States**: Prover estados de carregamento para a UI

```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['settings'],
  queryFn: async () => {
    const [agentResponse, siteResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/settings/agentConfig`),
      fetch(`${API_BASE_URL}/api/settings/siteConfig`)
    ]);
    
    return {
      agentConfig: await agentResponse.json(),
      siteConfig: await siteResponse.json()
    };
  },
  staleTime: 5 * 60 * 1000, // 5 minutos
  refetchOnWindowFocus: false
});
```

### Migração de Arquitetura

#### 1. Script de Migração (`scripts/migrate-settings.cjs`)

Este script migra as configurações estáticas do `config.ts` para a base de dados:

```javascript
// Lê configurações do ficheiro estático
const { agentConfig, siteConfig } = require('../src/config.ts');

// Migra para Firestore usando Firebase Admin SDK
await admin.firestore().collection('settings').doc('agentConfig').set(agentConfig);
await admin.firestore().collection('settings').doc('siteConfig').set(siteConfig);
```

**Execução**:
```bash
node scripts/migrate-settings.cjs
```

#### 2. Refatorização de Componentes

Todos os componentes foram sistematicamente refatorados para usar `useSettings()` em vez de importações estáticas:

**Antes**:
```typescript
import { agentConfig, siteConfig } from '@/config';

const Component = () => {
  return <span>{agentConfig.fullName}</span>;
};
```

**Depois**:
```typescript
import { useSettings } from '@/contexts/SettingsContext';

const Component = () => {
  const { agentConfig, siteConfig } = useSettings();
  
  if (!agentConfig) return null; // Proteção contra null
  
  return <span>{agentConfig.fullName}</span>;
};
```

### SEO Dinâmico

#### Componente `SEOTags` (`src/components/SEOTags.tsx`)

Para resolver o problema de SEO estático, foi criado um componente React que atualiza as meta tags dinamicamente após carregar as configurações:

```typescript
const SEOTags: React.FC = () => {
  const { agentConfig, siteConfig } = useSettings();

  useEffect(() => {
    if (!agentConfig || !siteConfig) return;

    // Atualiza title da página
    document.title = `${agentConfig.fullName} Travel Designer`;
    
    // Atualiza meta tags
    document.querySelector('meta[name="description"]')
      ?.setAttribute('content', `${agentConfig.fullName} Travel Agent`);
    
    // Atualiza Open Graph tags
    document.querySelector('meta[property="og:title"]')
      ?.setAttribute('content', `${agentConfig.fullName} Travel Designer`);
      
    // ... outras meta tags
  }, [agentConfig, siteConfig]);

  return null; // Componente invisible
};
```

**Integração**: O `SEOTags` é renderizado dentro do `SettingsProvider` no `App.tsx` para garantir acesso às configurações.

### Limpeza do DesignContext

Com a introdução do `SettingsContext`, o `DesignContext` foi simplificado:

**Removido**:
- Estado `agentConfig` e `siteConfig`
- Importações estáticas das configurações
- Lógica de carregamento dessas configurações

**Mantido**:
- Configurações específicas de design (`DesignConfig`)
- Lógica de carregamento de design da base de dados

### Benefícios da Arquitetura

1. **Configuração Dinâmica**: Alterações nas configurações não requerem redeploy
2. **Separação de Responsabilidades**: Settings vs Design vs Content bem separados
3. **Performance**: Cache inteligente com React Query
4. **Type Safety**: Tipos TypeScript mantidos para todas as configurações
5. **SEO Dinâmico**: Meta tags atualizadas dinamicamente
6. **Fallback Graceful**: Componentes protegidos contra valores null/undefined

### Padrões de Uso

#### 1. Componente Básico
```typescript
const MyComponent = () => {
  const { agentConfig, loading, error } = useSettings();
  
  if (loading) return <div>A carregar...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!agentConfig) return null;
  
  return <div>{agentConfig.fullName}</div>;
};
```

#### 2. Componente com Fallback
```typescript
const MyComponent = () => {
  const { agentConfig } = useSettings();
  
  return (
    <div>
      {agentConfig?.fullName || 'Nome não disponível'}
    </div>
  );
};
```

### Configuração de Ambiente

O sistema requer configuração adequada do Firebase Admin SDK:

```bash
# .env
FIREBASE_CREDENTIALS='{"type":"service_account",...}'
```

### Componentes Refatorados

Os seguintes componentes foram migrados para usar `SettingsContext`:

- `FloatingWhatsApp.tsx`
- `Navigation.tsx`
- `NavigationVariation.tsx` 
- `Footer.tsx`
- `TravelDesigner.tsx`
- `TravelPackages.tsx`
- `ContactSection.tsx`
- `HeroSection.tsx`
- `HeroVariation.tsx`
- `BkpTravelPackages.tsx`
- `SiteMetadata.tsx` (novo - substitui SEOTags)

---

## 🏷️ Site Metadata - Arquitetura de SEO Dinâmico

### Visão Geral

O projeto implementa uma solução robusta para gestão de metadados SEO através da biblioteca `react-helmet` integrada com o `SettingsContext`. Esta arquitetura permite atualizações dinâmicas de todos os metadados da página (título, descrição, Open Graph, Twitter Cards, dados estruturados) baseadas nas configurações armazenadas na base de dados.

### Arquitetura Técnica

#### 1. Fluxo de Dados para SEO

```
Firestore (settings collection)
  ↓
SettingsContext (React Query cache)
  ↓
SiteMetadata Component (react-helmet)
  ↓
HTML Head (meta tags, title, structured data)
```

#### 2. Componente `SiteMetadata.tsx`

O componente `SiteMetadata` substitui a abordagem anterior de manipulação direta do DOM, utilizando `react-helmet` para gestão profissional de metadados:

```typescript
import { Helmet } from 'react-helmet';
import { useSettings } from '@/contexts/SettingsContext';

const SiteMetadata = () => {
  const { agentConfig, siteConfig } = useSettings();
  
  if (!agentConfig || !siteConfig) return null;
  
  return (
    <Helmet>
      <title>{`${agentConfig.fullName} Travel Designer`}</title>
      <meta name="description" content={siteDescription} />
      {/* ... outros metadados */}
    </Helmet>
  );
};
```

**Características**:
- **Renderização Condicional**: Só renderiza após carregar os dados do SettingsContext
- **Metadados Completos**: Title, description, keywords, author, Open Graph, Twitter Cards
- **Dados Estruturados**: Schema.org JSON-LD para agências de viagem
- **Type Safety**: Tratamento robusto de diferentes tipos de dados (string vs array)

#### 3. Metadados Geridos Dinamicamente

##### Meta Tags Básicos
```html
<title>{agentConfig.fullName} Travel Designer</title>
<meta name="description" content="{agentConfig.fullName} Travel Agent - {siteConfig.tagline}" />
<meta name="keywords" content="travel, vacation, packages, agent, tourism" />
<meta name="author" content="{agentConfig.fullName}" />
```

##### Open Graph (Facebook/LinkedIn)
```html
<meta property="og:type" content="website" />
<meta property="og:title" content="{agentConfig.fullName} Travel Designer" />
<meta property="og:description" content="{siteDescription}" />
<meta property="og:site_name" content="{agentConfig.fullName} Travel" />
```

##### Twitter Cards
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{agentConfig.fullName} Travel Designer" />
<meta name="twitter:description" content="{siteDescription}" />
<meta name="twitter:site" content="{agentConfig.twitterHandle}" />
```

##### Dados Estruturados (Schema.org)
```json
{
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "name": "{agentConfig.fullName} Travel",
  "description": "{siteDescription}",
  "telephone": "{agentConfig.phone}",
  "email": "{agentConfig.email}",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "{agentConfig.phone}",
    "contactType": "customer service"
  }
}
```

### API Endpoint para Metadados

#### Endpoint `/api/metadata.js`

Criado um endpoint dedicado que compila todos os metadados do site numa única resposta estruturada:

```javascript
// GET /api/metadata
{
  "siteName": "Hugo Ramos Travel Designer",
  "siteTitle": "Hugo Ramos Travel Designer",
  "siteDescription": "Hugo Ramos Travel Agent - Professional Travel Planning",
  "agent": {
    "fullName": "Hugo Ramos",
    "email": "hugo@example.com",
    "phone": "+351 912 424 269",
    "whatsapp": "+351 912 424 269"
  },
  "seo": {
    "title": "Hugo Ramos Travel Designer",
    "description": "Professional travel planning services...",
    "keywords": "travel, vacation, packages, agent, tourism"
  },
  "social": {
    "ogTitle": "Hugo Ramos Travel Designer",
    "ogDescription": "Hugo Ramos Travel Agent - Professional Travel Planning"
  },
  "structuredData": { /* Schema.org data */ }
}
```

**Características do Endpoint**:
- **CORS Habilitado**: Acesso direto do frontend
- **Cache Inteligente**: Headers de cache (5 minutos)
- **Dados Compilados**: Todos os metadados pré-processados
- **Formato Padronizado**: Estrutura consistente para consumo frontend

### Integração com a Aplicação

#### Posicionamento no App.tsx
```typescript
const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <SiteMetadata />  {/* Posicionado após SettingsProvider */}
      <DesignProvider>
        {/* resto da app */}
```

**Ordem Crítica**: O `SiteMetadata` deve estar dentro do `SettingsProvider` mas antes dos outros providers para garantir que os metadados são configurados o mais cedo possível.

### Benefícios da Nova Arquitetura

#### 1. **SEO Profissional**
- Metadados completos e estruturados
- Dados Schema.org para rich snippets
- Open Graph e Twitter Cards para partilhas sociais

#### 2. **Performance**
- Cache inteligente com React Query
- Renderização condicional (só após dados carregarem)
- Headers de cache no endpoint API

#### 3. **Manutenibilidade**
- Uso de react-helmet (biblioteca padrão da indústria)
- Separação clara: dados vs apresentação
- API endpoint reutilizável

#### 4. **Flexibilidade**
- Metadados atualizáveis sem redeploy
- Suporte para diferentes tipos de dados (string/array)
- Estrutura extensível para novos metadados

### Padrões de Implementação

#### 1. Tratamento de Dados
```typescript
// Suporte para keywords como string ou array
const siteKeywords = Array.isArray(siteConfig.keywords) 
  ? siteConfig.keywords.join(', ') 
  : siteConfig.keywords || 'travel, vacation, packages';
```

#### 2. Renderização Condicional
```typescript
// Só renderiza após carregar dados
if (!agentConfig || !siteConfig) {
  return null;
}
```

#### 3. Fallbacks Inteligentes
```typescript
// Fallback para descrição
const siteDescription = `${agentConfig.fullName} Travel Agent - ${siteConfig.tagline || siteConfig.description}`;
```

### Configuração de Ambiente

O endpoint de metadados requer configuração adequada:

```bash
# .env
FIREBASE_CREDENTIALS='{"type":"service_account",...}'
SITE_URL=https://hugo-ramos-nomadwise.netlify.app
```

### Estrutura de Dados Esperada

#### AgentConfig
```typescript
{
  fullName: string,
  email: string,
  phone: string,
  whatsapp: string,
  twitterHandle?: string
}
```

#### SiteConfig
```typescript
{
  title: string,
  tagline: string,
  description: string,
  keywords: string | string[]
}
```

### Migração da Implementação Anterior

**Removido**:
- ❌ `SEOTags.tsx` (manipulação direta do DOM)
- ❌ Configuração estática em `main.tsx`
- ❌ Metadados hardcoded

**Adicionado**:
- ✅ `SiteMetadata.tsx` (react-helmet)
- ✅ `/api/metadata.js` (endpoint dedicado)
- ✅ Integração com SettingsContext
- ✅ Dados estruturados Schema.org

---
*📅 Última atualização: 2025-07-19*
