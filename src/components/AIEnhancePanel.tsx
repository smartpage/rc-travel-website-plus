import React from 'react';
import { useDesign } from '../contexts/DesignContext';

// Available AI models
const AI_MODELS = [
  { provider: 'openai', id: 'gpt-4o-mini', name: 'GPT-4o mini (Fast)' },
  { provider: 'openai', id: 'gpt-4o', name: 'GPT-4o (Better)' },
  { provider: 'google', id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  { provider: 'google', id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
];

const AIEnhancePanel: React.FC = () => {
  const { design, updateDesignLocal } = useDesign() as any;
  const [aiPrompt, setAiPrompt] = React.useState<string>('');
  const [selectedModel, setSelectedModel] = React.useState(AI_MODELS[0]);
  const [aiLoading, setAiLoading] = React.useState<boolean>(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [aiResult, setAiResult] = React.useState<any>(null);
  const [showPreview, setShowPreview] = React.useState<boolean>(false);

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

      const res = await fetch('https://login.intuitiva.pt/ai-enhance-content', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: design, // Pass the entire db.json design object
          prompt: aiPrompt || 'Improve readability and consistency. Keep structure identical. Return full JSON.',
          sectionType: 'design',
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
        originalKeys: Object.keys(design || {}),
        enhancedKeys: Object.keys(enhanced || {}),
        originalTypography: design?.typography,
        enhancedTypography: enhanced?.typography,
        changes: enhanced !== design ? 'DETECTED' : 'NONE'
      });
      
      setAiResult(enhanced);
      setShowPreview(true);
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
        after: aiResult?.typography,
        fullResult: aiResult
      });
      
      updateDesignLocal(() => aiResult);
      setShowPreview(false);
      setAiResult(null);
      setAiPrompt('');
      
      console.log('✅ AI Changes Applied - Check design context');
    }
  };

  const rejectChanges = () => {
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