# AI Enhancement System - Planner → Executor Architecture (2025)

**Complete refactored documentation reflecting current implementation**

## 🎯 Executive Summary

The AI Enhancement system uses a **2-stage manual workflow** with full user control:

1. **Plan Stage**: LLM analyzes prompt + design → generates execution plan with steps
2. **Review Stage**: User reviews plan details, can re-plan with different models  
3. **Execute Stage**: Parallel processing applies planned changes with live progress
4. **Apply Stage**: User manually applies, rejects, or discards results

**Key Features**: Manual control at each stage, real backup/restore, dual model selection, semantic understanding.

---

## 🏗️ Architecture Overview

### **2-Stage Manual Workflow**
```
🧠 Generate Plan → 📋 Plan Review → ⚡ Execute Plan → ✅ Apply / ✗ Reject / 🗑️ Discard
```

### **Frontend Components**
- **AIEnhancePanel**: Main UI with dual model selection and 2-stage controls
- **AIEnhanceContext**: State management with backup/restore functionality  
- **DesignContext**: Design state management with `refreshDesign()` capability

### **Backend Endpoints**
- **`POST /ai-plan-scope`**: Planning phase (generates execution plan)
- **`POST /ai-enhance-multipart-stream`**: Execution phase (applies changes)
- **`POST /ai-enhance-single-shot`**: Alternative single-shot executor

---

## 🤖 Model Selection System

### **Dual Model Selection (Current Implementation)**

**Planner Models** (User Selectable):
- **Gemini 2.5 Flash** *(default)* - Google's latest fast model
- **Gemini 2.5 Flash Lite** - Lighter version for speed
- **Claude 3.7 Sonnet** - Latest Claude with superior reasoning
- **Claude 3.5 Sonnet** - Previous generation Claude
- **DeepSeek V3** - High-performance coding model
- **Qwen 3 Coder** - Specialized coding model
- **Kimi K2** - Moonshot AI model
- **Plus other OpenRouter models**

**Executor Models** (User Selectable):
- **Gemini 2.5 Flash** *(default)* - Same options as planner
- **Full model flexibility** - Can use different model than planner
- **Dynamic selection** - Passed via `req.body.aiModel`

### **Model Selection UI**
```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
  <div>Planner: [Gemini 2.5 Flash ▼]</div>
  <div>Executor: [Gemini 2.5 Flash ▼]</div>
</div>
```

---

## 🔄 Complete Data Flow

### **1. Planning Phase**
```javascript
// User clicks "Generate Plan"
const response = await fetch('/ai-plan-scope', {
  method: 'POST',
  body: JSON.stringify({
    prompt: "change hero title to neon pink",
    index: designIndex,           // Semantic aliases
    selectionHint: activeElement, // Current selection
    scopeMode: "auto",
    aiModelPlan: selectedPlannerModel
  })
});

// Response includes steps for user review
{
  "plan": {
    "goal": { "user_goal": "...", "enhanced_goal": "..." },
    "steps": ["1. Change main headings color...", "2. Update hero..."],
    "primary": [{"path": "designV2.tokens.typography.headings", "allowedFields": ["color"]}],
    "budgets": {"maxChunks": 3, "maxFieldsPerChunk": 2}
  },
  "planTimeMs": 1200
}
```

### **2. Execution Phase**
```javascript
// User reviews plan, clicks "Execute Plan"
const response = await fetch('/ai-enhance-content-multipart-stream', {
  method: 'POST',
  body: JSON.stringify({
    data: { designV2: currentDesign },
    prompt: originalPrompt,
    aiModel: selectedExecutorModel,    // Can be different from planner
    plannerOutput: plan.plan
  })
});

// Streams NDJSON events:
// { type: "chunk_start", index: 0, path: "designV2.tokens.typography.headings" }
// { type: "chunk_complete", index: 0, ok: true, ms: 800 }
// { type: "result", success: true, enhancedData: newDesignV2 }
```

### **3. Apply Phase**
```javascript
// User clicks "Apply" - creates backup first
const backup = JSON.parse(JSON.stringify(currentDesign));
updateDesignLocal(() => enhancedData.designV2);
applyPreviewWithBackup(backup);

// User can "Reject" - restores backup
if (rejectClicked) {
  updateDesignLocal(() => previewBackup);
}

// User can "Discard" - reloads from file
if (discardClicked) {
  await refreshDesign(); // Reloads dbV2.json
}
```

---

## 🧠 Semantic Intelligence System

### **Enhanced Index Building**
The system builds semantic aliases for visual concept understanding:

```typescript
// Generated index.aliases
{
  "cards background": ["designV2.sections.whyFeatureCards.layout.inner.background"],
  "button background": ["designV2.components.button.variants.*.backgroundColor"],
  "hero section": ["designV2.sections.hero.*"],
  "text color": ["designV2.tokens.typography.*.color"]
}
```

### **Smart Planner Integration**
```javascript
// Planner receives semantic context
const userMessage = `
SEMANTIC CONCEPT DETECTION:
Detected visual concepts in prompt:
• "cards background" → designV2.sections.whyFeatureCards.layout.inner.background

USER REQUEST: ${prompt}
`;
```

### **Visual Concept Mapping**
- **Automatic Detection**: Planner identifies visual concepts in prompts
- **Path Resolution**: Maps concepts to specific designV2 paths
- **Relationship Understanding**: Knows background affects text readability
- **Smart Suggestions**: Context-aware field suggestions

---

## 🔒 State Management & Backup System

### **AIState Enum**
```typescript
type AIState = 'idle' | 'planning' | 'plan_ready' | 'executing' | 'results_ready' | 'applied' | 'error';
```

### **Backup & Restore System**
```typescript
// Before applying changes
const handleApplyPreview = async () => {
  const currentDesignBackup = JSON.parse(JSON.stringify(design));
  updateDesignLocal(() => nextDesign);
  applyPreviewWithBackup(currentDesignBackup); // Stores backup
};

// Real revert functionality
const handleRejectChanges = () => {
  if (previewBackup) {
    updateDesignLocal(() => previewBackup); // Restore backup
  }
  rejectPreview();
};

// Complete discard with file reload
const handleDiscard = async () => {
  await refreshDesign(); // Reload from dbV2.json
  setState('idle');
};
```

### **State Transitions**
```
idle → [🧠 Generate Plan] → planning → plan_ready → [⚡ Execute] → executing → results_ready
                ↑                        ↓                                        ↓
            [🗑️ Discard]          [🧠 Re-plan]                      [✅ Apply] [✗ Reject] [🗑️ Discard]
                                                                           ↓         ↓         ↓
                                                                      applied    idle     idle
                                                                          ↓
                                                                    [💾 Save] [🗑️ Discard]
                                                                          ↓         ↓
                                                                        idle      idle
```

---

## 🌐 API Endpoints

### **Authentication**
All endpoints require session cookie via magic link:

```bash
# 1. Request magic link
curl -X POST "http://localhost:5001/sendMagicLink" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'

# 2. Validate and get session
curl -X POST "http://localhost:5001/validateMagicLink" \
  -H "Content-Type: application/json" \
  -d '{"token":"MAGIC_LINK_TOKEN"}' -v

# 3. Use session cookie
-H "Cookie: intuitiva_session=SESSION_VALUE"
```

### **Planning Endpoint**
```bash
curl -X POST "http://localhost:5001/ai-plan-scope" \
  -H "Content-Type: application/json" \
  -H "Cookie: intuitiva_session=SESSION" \
  -d '{
    "prompt": "change hero title to neon pink",
    "index": { "aliases": {...}, "relationships": {...} },
    "selectionHint": { "sectionId": "hero", "tokenPaths": [...] },
    "scopeMode": "auto",
    "aiModelPlan": { "provider": "openrouter", "id": "google/gemini-2.5-flash" }
  }'
```

### **Execution Endpoint**
```bash
curl -N -X POST "http://localhost:5001/ai-enhance-content-multipart-stream" \
  -H "Content-Type: application/json" \
  -H "Cookie: intuitiva_session=SESSION" \
  -d '{
    "data": { "designV2": {...} },
    "prompt": "change hero title to neon pink",
    "aiModel": { "provider": "openrouter", "id": "google/gemini-2.5-flash" },
    "plannerOutput": { "primary": [...], "budgets": {...} }
  }'
```

---

## 💾 Save System (Current Implementation)

### **Temporary Local Download**
**Location**: `src/contexts/DesignContext.tsx` → `saveDesignToAPI()`

**Current Behavior**:
- Downloads `dbV2.json` file with current design
- No server calls or authentication required
- Temporary solution while external endpoint is developed

**Future**: Will be replaced with external endpoint for proper persistence.

---

## 🎨 UI Components & Controls

### **Main Panel Layout**
```
┌─────────────────────────────────────────┐
│ ┌─────────────┬─────────────┐           │
│ │ Planner:    │ Executor:   │           │  
│ │ [Model ▼]   │ [Model ▼]   │           │
│ └─────────────┴─────────────┘           │
│                                         │
│ [Enhancement Instructions Text Area]    │
│                                         │
│ [🧠 Generate Plan] [Status Info]        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📋 Execution Plan Ready             │ │
│ │ Goal: Change hero title to pink...   │ │
│ │ Steps: 1. Modify headings...        │ │
│ │ [Show Plan JSON ▼]                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [🧠 Re-plan] [⚡ Execute] [🗑️ Discard] │
│                                         │
│ [Live Progress when executing...]       │
│                                         │
│ [✅ Apply] [✗ Reject] [🗑️ Discard]     │
│                                         │
│ [💾 Save] [🗑️ Discard]                 │
└─────────────────────────────────────────┘
```

### **State-Driven Controls**
- **idle**: Show `[🧠 Generate Plan]`
- **plan_ready**: Show `[🧠 Re-plan] [⚡ Execute] [🗑️ Discard]`
- **executing**: Show `[Executing...]` (disabled) + live progress
- **results_ready**: Show `[✅ Apply] [✗ Reject] [🗑️ Discard]`
- **applied**: Show `[💾 Save] [🗑️ Discard]`

---

## 🔧 Validation & Error Handling

### **Execution Validation**
- **JSON Only**: Reject markdown or prose responses
- **Shape Parity**: Objects keep same keys, arrays same length
- **Allowed Fields**: Only modify fields specified by planner
- **Skip Handling**: "Not applicable" responses marked as skipped (not failed)

### **Error Types**
```typescript
type AIError = {
  category: 'network' | 'auth' | 'planner' | 'executor' | 'validation';
  message: string;
  details?: string;
  retryable: boolean;
  suggestion?: string;
};
```

### **Error UX**
- Specific error messages with recovery suggestions
- Retry buttons for retryable errors
- Technical details in collapsible sections
- Graceful fallbacks for all operations

---

## 🔮 Advanced Features

### **Scope Detection**
- **Explicit Global**: "site-wide", "all sections" → global scope
- **Selection-Aware**: Active element + prompt analysis → local scope  
- **Auto Heuristic**: Conservative local scope by default

### **Visual Relationships**
- **Background → Text**: Understands contrast requirements
- **Component Hierarchies**: Button variants, typography scales
- **Section Dependencies**: Layout affects contained elements

### **Smart Re-planning**
- Test different models on same prompt
- Compare plan quality and execution time
- Model-specific optimizations

---

## 📊 Current Status (January 2025)

### **✅ Fully Implemented**
- ✅ Manual 2-stage workflow with full user control
- ✅ Dual model selection (planner + executor) 
- ✅ Real backup & restore system with `refreshDesign()`
- ✅ Semantic index building with visual concept aliases
- ✅ Clean UI with Lucide icons and state-driven controls
- ✅ Enhanced error handling with specific categories
- ✅ Live progress tracking during execution
- ✅ Plan review with JSON toggle for debugging

### **🔄 Pending**
- 🔄 Confirmation dialogs for destructive actions
- 🔄 External save endpoint (currently local download)

### **🎯 Production Ready**
The AI Enhancement system is **production-ready** with all major features implemented and tested. The architecture supports flexible model selection, robust error handling, and complete user control over the enhancement process.

---

*Last Updated: January 2025 - Complete system refactor with current implementation*