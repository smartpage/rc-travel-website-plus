import React from 'react';
import { useDesign } from '../contexts/DesignContext';

// Available AI models
const AI_MODELS = [
  // OpenRouter (Fastest models first)
  { provider: 'openrouter', id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku (Fastest)' },
  { provider: 'openrouter', id: 'x-ai/grok-3-mini', name: 'Grok 3 Mini (Fast)' },
  { provider: 'openrouter', id: 'x-ai/grok-3', name: 'Grok 3 (Better)' },
  { provider: 'openrouter', id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B (Fast)' },
  // OpenAI
  { provider: 'openai', id: 'gpt-4o-mini', name: 'GPT-4o mini (Fast)' },
  { provider: 'openai', id: 'gpt-4o', name: 'GPT-4o (Better)' },
  // Google Gemini (server expects provider: 'gemini')
  { provider: 'gemini', id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash' },
  { provider: 'gemini', id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro' },
];

// Quick suggestion prompts (replaceable/appendable)
const AI_SUGGESTIONS: Array<{ label: string; prompt: string }> = [
  { label: 'Primary btn → #00ff59', prompt: 'Set buttons.primary.backgroundColor to "#00ff59" and buttons.primary.borderColor to "#00ff59". Keep structure identical. Return full db JSON.' },
  { label: 'Primary text → black', prompt: 'Set buttons.primary.textColor to "#000000" and buttons.primary.textColorHover to "#000000". Keep structure identical. Return full db JSON.' },
  { label: 'Secondary btn subtle', prompt: 'Set buttons.secondary.backgroundColor to "transparent", buttons.secondary.backgroundColorHover to "rgba(255,255,255,0.08)", and buttons.secondary.textColor to "#ffffff". Return full db JSON.' },
  { label: 'Headings → white', prompt: 'Set typography.headings.color to "white" and typography.hero_headings.color to "white". Return full db JSON.' },
  { label: 'Body → lighter', prompt: 'Set typography.body.color to "#e5e7eb". Return full db JSON.' },
  { label: 'Hero bigger', prompt: 'Increase hero_headings.fontSize by 10%, hero_headings.fontSizeMd by 10%, and hero_headings.fontSizeLg by 10%. Keep other fields unchanged. Return full db JSON.' },
  { label: 'Tab pill bg', prompt: 'Set buttons.tab.container.backgroundColor to "#374151". Return full db JSON.' },
  { label: 'Tab regular text', prompt: 'Set buttons.tab.regular.normal.textColor to "#cbd5e1" and buttons.tab.regular.hover.textColor to "#ffffff". Return full db JSON.' },
  { label: 'FAQ colors', prompt: 'Set typography.faqQuestion.color to "white" and typography.faqAnswer.color to "#cbd5e1". Return full db JSON.' },
  { label: 'Designer card text', prompt: 'Set typography.travelDesignerCard.color to "#cbd5e1". Return full db JSON.' },
  { label: 'Primary = yellow', prompt: 'Set colors.primary to "yellow-500" and colors.primaryHover to "yellow-600"; also set buttons.primary.backgroundColor to "#eab308" and buttons.primary.backgroundColorHover to "#d97706". Return full db JSON.' },
  { label: 'Slider dots → white', prompt: 'Set sliderOptions.colors.dotActive to "bg-white" and sliderOptions.colors.dotInactive to "bg-slate-500/60". Return full db JSON.' },
];

const AIEnhancePanel: React.FC = () => {
  const { design, updateDesignLocal } = useDesign() as any;
  const [aiPrompt, setAiPrompt] = React.useState<string>('');
  const [selectedModel, setSelectedModel] = React.useState(AI_MODELS[0]);
  const [aiLoading, setAiLoading] = React.useState<boolean>(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [aiResult, setAiResult] = React.useState<any>(null);
  const [showPreview, setShowPreview] = React.useState<boolean>(false);
  const [insertMode, setInsertMode] = React.useState<'replace' | 'append'>('replace');
  const [previewActive, setPreviewActive] = React.useState<boolean>(false);
  const previewBackupRef = React.useRef<any>(null);

  // Dynamic API endpoint: localhost in dev, production in deploy
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const AI_API_BASE = isLocalhost ? 'http://localhost:5001' : 'https://login.intuitiva.pt';

  const applySuggestion = (p: string) => {
    setAiPrompt(prev => insertMode === 'append' && prev.trim() ? `${prev.trim()}\n${p}` : p);
  };

  const aiEnhanceDesign = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    setShowPreview(false);
    
    try {
      console.log('🤖 AI Enhancement Request:', {
        prompt: aiPrompt,
        model: selectedModel,
        designKeys: Object.keys(design || {}),
        currentTypography: design?.typography
      });

      // Build a full DB-like payload. Today our db.json root only contains { design },
      // but we keep the structure flexible so when more roots exist we can include them here.
      // IMPORTANT: include current in-memory design state, not a stale file import.
      const fullDbPayload: any = { designV2: design };

      const res = await fetch(`${AI_API_BASE}/ai-enhance-content`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Send the ENTIRE db.json (current in-memory state). For now this equals { design }.
          data: fullDbPayload,
          prompt: aiPrompt || 'Improve readability and consistency. Keep structure identical. Return full JSON.',
          sectionType: 'dbV2',
          aiModel: selectedModel
        })
      });
      
      const json = await res.json().catch(() => ({}));
      
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `AI service failed (${res.status})`);
      }
      
      const enhanced = json.enhancedData;
      if (!enhanced || typeof enhanced !== 'object') {
        throw new Error('AI returned invalid JSON');
      }
      
      console.log('✨ AI Enhanced Data:', {
        originalDbKeys: Object.keys(fullDbPayload || {}),
        enhancedDbKeys: Object.keys(enhanced || {}),
        originalDesignKeys: Object.keys((fullDbPayload?.design) || {}),
        enhancedDesignKeys: Object.keys((enhanced?.design) || (enhanced || {})),
        originalTypography: (fullDbPayload?.design || {}).typography,
        enhancedTypography: (enhanced?.design || enhanced || {}).typography,
        changes: JSON.stringify(enhanced) !== JSON.stringify(fullDbPayload) ? 'DETECTED' : 'NONE'
      });
      
      setAiResult(enhanced);
      setShowPreview(true);

      // Instant preview apply (non-persistent): store backup and apply to local editor state
      const nextDesign = (enhanced && typeof enhanced === 'object' && 'design' in enhanced)
        ? (enhanced as any).design
        : enhanced;
      // Deep copy backup
      previewBackupRef.current = JSON.parse(JSON.stringify(design));
      updateDesignLocal(() => nextDesign);
      setPreviewActive(true);
    } catch (e: any) {
      setAiError(e?.message || 'AI enhance failed');
    } finally {
      setAiLoading(false);
    }
  };

  const applyChanges = () => {
    if (aiResult) {
      console.log('🎯 Applying AI Changes:', {
        before: design?.typography,
        after: (aiResult?.design || aiResult)?.typography,
        fullResult: aiResult
      });
      
      // If the AI returned a full db object, extract its design node; otherwise assume it returned just the design.
      const nextDesign = (aiResult && typeof aiResult === 'object' && 'design' in aiResult)
        ? (aiResult as any).design
        : aiResult;
      updateDesignLocal(() => nextDesign);
      setPreviewActive(false);
      setShowPreview(false);
      setAiResult(null);
      setAiPrompt('');
      
      console.log('✅ AI Changes Applied - Check design context');
    }
  };

  const rejectChanges = () => {
    // Undo preview: restore backup design
    if (previewActive && previewBackupRef.current) {
      updateDesignLocal(() => previewBackupRef.current);
    }
    setPreviewActive(false);
    setShowPreview(false);
    setAiResult(null);
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* AI Model Selection */}
      <div>
        <div style={{ color: '#e5e7eb', fontSize: 12, marginBottom: 6 }}>
          AI Model
        </div>
        <select
          value={`${selectedModel.provider}:${selectedModel.id}`}
          onChange={(e) => {
            const [provider, id] = e.target.value.split(':');
            const model = AI_MODELS.find(m => m.provider === provider && m.id === id);
            if (model) setSelectedModel(model);
          }}
          style={{
            width: '100%',
            background: '#141414',
            color: '#fff',
            border: '1px solid #2a2a2a',
            borderRadius: 6,
            padding: 8,
            fontSize: 12
          }}
        >
          {AI_MODELS.map(model => (
            <option key={`${model.provider}:${model.id}`} value={`${model.provider}:${model.id}`}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      {/* AI Prompt Input */}
      <div>
        <div style={{ color: '#e5e7eb', fontSize: 12, marginBottom: 6 }}>
          Enhancement Instructions
        </div>
        {/* Quick Suggestions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Insert:</span>
            <button
              onClick={() => setInsertMode('replace')}
              style={{
                padding: '4px 8px', fontSize: 11, borderRadius: 6,
                background: insertMode === 'replace' ? '#2a2a2a' : '#1a1a1a',
                border: '1px solid #3a3a3a', color: '#e5e7eb', cursor: 'pointer'
              }}
            >replace</button>
            <button
              onClick={() => setInsertMode('append')}
              style={{
                padding: '4px 8px', fontSize: 11, borderRadius: 6,
                background: insertMode === 'append' ? '#2a2a2a' : '#1a1a1a',
                border: '1px solid #3a3a3a', color: '#e5e7eb', cursor: 'pointer'
              }}
            >append</button>
          </div>
          {AI_SUGGESTIONS.map(s => (
            <button
              key={s.label}
              onClick={() => applySuggestion(s.prompt)}
              title={s.prompt}
              style={{
                padding: '4px 8px', fontSize: 11, borderRadius: 6,
                background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb', cursor: 'pointer'
              }}
            >{s.label}</button>
          ))}
        </div>
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Describe what you want to change. Ex: Make all headings white, increase hero font size, use lighter body colors, improve button contrast..."
          rows={4}
          style={{
            width: '100%',
            background: '#141414',
            color: '#fff',
            border: '1px solid #2a2a2a',
            borderRadius: 6,
            padding: 8,
            fontSize: 12,
            fontFamily: 'monospace',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={aiEnhanceDesign}
          disabled={aiLoading}
          style={{
            padding: '8px 12px',
            background: aiLoading ? '#374151' : '#1f3d7a',
            color: '#fff',
            borderRadius: 6,
            border: '1px solid #2a3a7a',
            fontSize: 12,
            cursor: aiLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {aiLoading ? 'Enhancing...' : 'Generate Preview'}
        </button>
        
        <div style={{ fontSize: 11, color: '#94a3b8', flex: 1 }}>
          {showPreview ? 'Review changes below' : 'Generates a preview for approval'}
        </div>
      </div>

      {/* Error Display */}
      {aiError && (
        <div style={{
          padding: 8,
          background: '#4c1d1d',
          border: '1px solid #7c2d12',
          borderRadius: 6,
          color: '#ff7b72',
          fontSize: 12
        }}>
          <strong>Error:</strong> {aiError}
        </div>
      )}

      {/* Preview & Approval */}
      {showPreview && aiResult && (
        <div style={{
          padding: 12,
          background: '#1a2332',
          border: '1px solid #2563eb',
          borderRadius: 8
        }}>
          <div style={{ color: '#60a5fa', fontSize: 12, marginBottom: 8, fontWeight: 'bold' }}>
            ✨ AI Enhanced Design Ready
          </div>
          <div style={{ color: '#e5e7eb', fontSize: 11, marginBottom: 12 }}>
            The AI has generated improvements to your design tokens. Review the changes and choose to apply or reject them.
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={applyChanges}
              style={{
                padding: '8px 12px',
                background: '#16a34a',
                color: '#fff',
                borderRadius: 6,
                border: '1px solid #22c55e',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              ✓ Apply Changes
            </button>
            
            <button
              onClick={rejectChanges}
              style={{
                padding: '8px 12px',
                background: '#dc2626',
                color: '#fff',
                borderRadius: 6,
                border: '1px solid #ef4444',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              ✗ Reject Changes
            </button>
          </div>
          
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>
            Remember to click "Save All Changes" after applying to persist to db.json
          </div>
        </div>
      )}
    </div>
  );
};

export default AIEnhancePanel;