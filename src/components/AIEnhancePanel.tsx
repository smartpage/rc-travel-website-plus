import React from 'react';
import { useDesign } from '../contexts/DesignContext';
import { useEditorOverlay } from '../contexts/EditorOverlayContext';
import { useAIEnhance } from '../contexts/AIEnhanceContext';

// Fixed models: planner (Sonnet), executor (OpenRouter Gemini 2.5 Flash Lite)
const FIXED_MODELS = {
  plan: { provider: 'openrouter', id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  exec: { provider: 'openrouter', id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
};

// Quick suggestion prompts (general, outcome-focused)
const AI_SUGGESTIONS: Array<{ label: string; prompt: string }> = [
  { label: 'Hero title white + breathing room', prompt: 'Make the hero title white and increase the hero section breathing room (padding/line-height) while keeping structure.' },
  { label: 'Bright green theme', prompt: 'Make primary buttons bright green (#00ff59) with good contrast. Update related colors and hover states.' },
  { label: 'High contrast text', prompt: 'Improve text contrast for better readability. Make headings white and body text lighter.' },
  { label: 'Subtle secondary buttons', prompt: 'Make secondary buttons more subtle with transparent backgrounds and soft hover effects.' },
  { label: 'Modern yellow theme', prompt: 'Change the color scheme to modern yellow tones. Update primary colors, buttons, and accents consistently.' },
  { label: 'Larger hero text', prompt: 'Increase hero heading sizes by 10-15% across all breakpoints for more impact.' },
  { label: 'Darker UI elements', prompt: 'Make tab containers and UI backgrounds darker for better visual hierarchy.' },
  { label: 'Improved FAQ styling', prompt: 'Enhance FAQ question and answer colors for better readability and visual distinction.' },
  { label: 'Lighter body copy', prompt: 'Make all body text and descriptions lighter for improved readability on dark backgrounds.' },
  { label: 'Clean white accents', prompt: 'Update slider dots, navigation elements, and small UI accents to clean white tones.' },
  { label: 'Better font weights', prompt: 'Optimize font weights across typography for improved hierarchy and readability.' },
  { label: 'Consistent spacing', prompt: 'Improve spacing and padding across sections for better visual rhythm.' },
  { label: 'Enhanced hover states', prompt: 'Improve button and interactive element hover states for better user feedback.' },
];

const AIEnhancePanel: React.FC = () => {
  const { design, updateDesignLocal, saveDesignToAPI } = useDesign() as any;
  const { aiTiming, startAiGeneration, endAiGeneration, activeElement } = useEditorOverlay() as any;
  const { planning, executing, planTimeMs, jobs, runPlanAndExecute, error: planExecError, result: streamedResult, metadata: streamedMeta, lastRun, executorMode, setExecutorMode } = useAIEnhance();
  const [showAllLastJobs, setShowAllLastJobs] = React.useState(false);
  const [showFailedOnly, setShowFailedOnly] = React.useState(false);
  const [showPlan, setShowPlan] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState<string>('');
  const [showSuggestions, setShowSuggestions] = React.useState<boolean>(false);
  // Fixed executor model
  const selectedModel = React.useMemo(() => FIXED_MODELS.exec, []);
  const [aiLoading, setAiLoading] = React.useState<boolean>(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [aiResult, setAiResult] = React.useState<any>(null);
  const [showPreview, setShowPreview] = React.useState<boolean>(false);
  const [insertMode, setInsertMode] = React.useState<'replace' | 'append'>('replace');
  const [previewActive, setPreviewActive] = React.useState<boolean>(false);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [saved, setSaved] = React.useState<boolean>(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const previewBackupRef = React.useRef<any>(null);

  // Dynamic API endpoint: localhost in dev, production in deploy
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const AI_API_BASE = isLocalhost ? 'http://localhost:5001' : 'https://login.intuitiva.pt';
  // Use duplicated endpoint with same behavior (server must provide it)

  const applySuggestion = (p: string) => {
    setAiPrompt(prev => insertMode === 'append' && prev.trim() ? `${prev.trim()}\n${p}` : p);
  };

  // Auto-apply streaming results for immediate preview
  React.useEffect(() => {
    if (streamedResult?.enhancedData && !previewActive) {
      try {
        console.log('🎨 Auto-applying AI result for preview');
        
        // Store backup for potential revert
        previewBackupRef.current = JSON.parse(JSON.stringify(design));
        
        const enhanced = streamedResult.enhancedData;
        const nextDesign = (enhanced && typeof enhanced === 'object' && 'designV2' in enhanced)
          ? (enhanced as any).designV2
          : (enhanced && typeof enhanced === 'object' && 'design' in enhanced)
          ? (enhanced as any).design
          : enhanced;
        
        // Apply preview immediately for visual feedback
        updateDesignLocal(() => nextDesign);
        setPreviewActive(true);
      } catch (e: any) {
        console.error('❌ Failed to auto-apply AI result:', e);
      }
    }
  }, [streamedResult, previewActive, design, updateDesignLocal]);

  const aiEnhanceDesign = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    setShowPreview(false);

    const startTime = Date.now();
    startAiGeneration();

    try {
      // Planner + streaming executor (single source of truth)
      const selectionHint = activeElement ? {
        sectionId: activeElement.sectionId,
        tokenPaths: Array.isArray(activeElement.tokenMatches) ? activeElement.tokenMatches.map((m:any)=>m.tokenPath) : []
      } : undefined;

      await runPlanAndExecute({
        prompt: aiPrompt || 'Improve readability and consistency. Keep structure identical.',
        modelPlan: FIXED_MODELS.plan,
        modelExec: selectedModel,
        currentDesign: design,
        scopeMode: 'auto',
        selectionHint
      });
    } catch (e: any) {
      setAiError(e?.message || 'Planner/Executor failed');
    } finally {
      setAiLoading(false);
      endAiGeneration(Date.now() - startTime);
    }
  };

  const applyChanges = () => {
    if (aiResult && previewActive) {
      console.log('🎯 Committing AI Changes to working copy:', {
        metadata: (aiResult as any)?.metadata
      });
      
      // Changes are already applied as preview - just commit them to working copy
      setSaved(false); // Mark as unsaved in working copy
      setSaveError(null);
      setShowPreview(false); // Hide preview UI
      setAiResult(null); // Clear AI result
      setAiPrompt(''); // Clear prompt
      // Keep previewActive true to indicate working copy has uncommitted changes
      
      console.log('✅ AI Changes committed to working copy - Click Save to persist to database');
    }
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      await saveDesignToAPI();
      setSaved(true);
      // Clear AI result after successful save
      setShowPreview(false);
      setAiResult(null);
      setAiPrompt('');
      setPreviewActive(false);
      console.log('💾 Design saved to API');
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to save design';
      setSaveError(errorMsg);
      console.error('❌ Save failed:', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const rejectChanges = () => {
    // Robust revert of preview to the backed-up design
    try {
      if (previewBackupRef.current) {
        console.log('🔄 Reverting AI preview to original state');
        const snapshot = JSON.parse(JSON.stringify(previewBackupRef.current));
        updateDesignLocal(() => snapshot);
      }
    } finally {
      setPreviewActive(false);
      setShowPreview(false);
      setAiResult(null);
      setAiPrompt('');
      console.log('❌ AI changes rejected - design reverted to original state');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* AI Model Selection */}
      <div>
        <div style={{ color: '#e5e7eb', fontSize: 12, marginBottom: 6 }}>
          AI Models
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          Planner: {FIXED_MODELS.plan.name} • Executor: {FIXED_MODELS.exec.name}
        </div>
        <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Mode:</span>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#cbd5e1' }}>
            <input type="radio" name="execMode" checked={executorMode === 'single'} onChange={() => setExecutorMode('single')} /> single-shot
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#cbd5e1' }}>
            <input type="radio" name="execMode" checked={executorMode === 'multipart'} onChange={() => setExecutorMode('multipart')} /> multipart
          </label>
        </div>
      </div>

      {/* AI Prompt Input */}
      <div>
        <div style={{ color: '#e5e7eb', fontSize: 12, marginBottom: 6 }}>
          Enhancement Instructions
        </div>
        {/* Quick Suggestions */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Insert:</span>
            <button
              onClick={() => setInsertMode('replace')}
              style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6, background: insertMode === 'replace' ? '#2a2a2a' : '#1a1a1a', border: '1px solid #3a3a3a', color: '#e5e7eb', cursor: 'pointer' }}
            >replace</button>
            <button
              onClick={() => setInsertMode('append')}
              style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6, background: insertMode === 'append' ? '#2a2a2a' : '#1a1a1a', border: '1px solid #3a3a3a', color: '#e5e7eb', cursor: 'pointer' }}
            >append</button>
          </div>
          <button onClick={() => setShowSuggestions(s=>!s)} style={{ padding:'4px 8px', fontSize:11, borderRadius:6, background:'#0f172a', border:'1px solid #1e293b', color:'#e5e7eb', cursor:'pointer' }}>
            {showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
          </button>
        </div>
        {showSuggestions && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {AI_SUGGESTIONS.map(s => (
              <button
                key={s.label}
                onClick={() => applySuggestion(s.prompt)}
                title={s.prompt}
                style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6, background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb', cursor: 'pointer' }}
              >{s.label}</button>
            ))}
          </div>
        )}
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
          disabled={aiLoading || planning || executing}
          style={{
            padding: '8px 12px',
            background: (aiLoading || planning || executing) ? '#374151' : '#1f3d7a',
            color: '#fff',
            borderRadius: 6,
            border: '1px solid #2a3a7a',
            fontSize: 12,
            cursor: (aiLoading || planning || executing) ? 'not-allowed' : 'pointer'
          }}
        >
          {planning ? 'Planning…' : executing ? 'Enhancing…' : aiLoading ? 'Enhancing…' : 'Generate Preview'}
        </button>
        
        {/* Last Generation Time */}
        {aiTiming.lastGenerationTime && (
          <div style={{ 
            fontSize: 10, 
            color: '#94a3b8',
            padding: '4px 8px',
            background: '#0f172a',
            borderRadius: 4,
            border: '1px solid #1e293b'
          }}>
            ⏱️ Last: {(aiTiming.lastGenerationTime / 1000).toFixed(1)}s
            {aiTiming.lastGenerationDate && (
              <span style={{ marginLeft: 6, color: '#64748b' }}>
                ({new Date(aiTiming.lastGenerationDate).toLocaleTimeString()})
              </span>
            )}
          </div>
        )}
        
        <div style={{ fontSize: 11, color: '#94a3b8', flex: 1 }}>
          {showPreview ? 'Review changes below' : 'Generates a preview for approval'}
        </div>
      </div>

      {/* Live Feedback */}
      <div style={{ marginTop: 8, padding: 8, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {/* Planner pill */}
          <div style={{ padding:'4px 8px', borderRadius:999, border:'1px solid #1e293b', background:'#0b1220', fontSize:10, color:'#cbd5e1' }}>
            Planner: {planning ? 'running…' : (typeof planTimeMs==='number' ? `${(planTimeMs/1000).toFixed(1)}s` : 'idle')}
          </div>
          {/* Executor pill */}
          <div style={{ padding:'4px 8px', borderRadius:999, border:'1px solid #1e293b', background:'#0b1220', fontSize:10, color:'#cbd5e1' }}>
            Executor: {executing ? 'running…' : (lastRun?.executor ? `${lastRun.executor.chunksSucceeded}/${lastRun.executor.chunksPlanned} chunks` : 'idle')}
          </div>
          {/* Changed count */}
          {lastRun?.executor && (
            <div style={{ padding:'4px 8px', borderRadius:999, border:'1px solid #1e293b', background:'#0b1220', fontSize:10, color:'#cbd5e1' }}>
              Changed: {Array.isArray(lastRun.executor.chunks) ? lastRun.executor.chunks.filter((c:any)=>c.status==='ok').length : 0}
            </div>
          )}
        </div>
        {/* Streaming list */}
        {(planning || executing) && (
          <div style={{ marginTop: 8 }}>
            {(jobs || []).slice(0, 6).map(j => (
              <div key={j.index} style={{ display: 'flex', justifyContent: 'space-between', color: j.status==='error' ? '#f87171' : j.status==='ok' ? '#22c55e' : (j.error && String(j.error).startsWith('skip:')) ? '#e5e7eb' : '#e5e7eb', fontSize: 11 }}>
                <span>{j.status === 'running' ? '⏳' : j.status === 'ok' ? '✅' : (j.error && String(j.error).startsWith('skip:')) ? '⚪' : '❌'} {j.path}</span>
                <span>{typeof j.ms === 'number' ? `${(j.ms/1000).toFixed(1)}s` : ''}</span>
              </div>
            ))}
            {jobs.length > 6 && (
              <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 4 }}>+{jobs.length - 6} more…</div>
            )}
          </div>
        )}
        {/* Full prompts & replies (from lastRun) */}
        {lastRun?.executor && (
          <div style={{ marginTop:8 }}>
            <div style={{ color:'#94a3b8', fontSize:11, fontWeight:'bold', marginBottom:4 }}>Executor Prompts</div>
            <div style={{ maxHeight:160, overflow:'auto', border:'1px solid #1e293b', borderRadius:6 }}>
              {(lastRun.executor.chunks || []).slice(0, 6).map((j:any, i:number)=> (
                <div key={i} style={{ padding:8, borderBottom:'1px solid #0f172a' }}>
                  <div style={{ fontSize:10, color:'#cbd5e1', marginBottom:4 }}>{j.path}</div>
                  {j.systemMsg && (
                    <pre style={{ whiteSpace:'pre-wrap', fontSize:10, color:'#94a3b8', margin:0 }}>SYSTEM: {j.systemMsg}</pre>
                  )}
                  {j.userMsg && (
                    <pre style={{ whiteSpace:'pre-wrap', fontSize:10, color:'#e2e8f0', margin:0 }}>USER: {j.userMsg}</pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Persistent Last Run Summary */}
      {lastRun && (
        <div style={{ marginTop: 8, padding: 8, background: '#0b1220', border: '1px solid #1e293b', borderRadius: 6 }}>
          <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6, fontWeight: 'bold' }}>Last Run</div>
          {lastRun.planner && (
            <div style={{ color: '#e2e8f0', fontSize: 11 }}>
              Planner: {(lastRun.planner.ms/1000).toFixed(1)}s • {lastRun.planner.modelId}
              <div style={{ marginTop:6 }}>
                <button onClick={()=>setShowPlan(s=>!s)} style={{ padding:'4px 8px', background:'#0f172a', border:'1px solid #1e293b', color:'#e2e8f0', borderRadius:4, fontSize:10, cursor:'pointer' }}>
                  {showPlan ? 'Hide Plan JSON' : 'Show Plan JSON'}
                </button>
                {showPlan && (
                  <pre style={{ marginTop:6, maxHeight:160, overflow:'auto', background:'#0a0f1a', padding:8, borderRadius:6, border:'1px solid #1e293b', fontSize:10, color:'#cbd5e1' }}>
                    {JSON.stringify(lastRun.planner.plan, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
          {lastRun.executor && (
            <div style={{ color: '#e2e8f0', fontSize: 11, marginTop: 4 }}>
              <div>Executor: {(lastRun.executor.totalMs/1000).toFixed(1)}s • {lastRun.executor.chunksSucceeded}/{lastRun.executor.chunksPlanned} chunks</div>
              <div style={{ marginTop: 6 }}>
                <div style={{ display:'flex', gap: 12, marginBottom: 6 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:10, color:'#94a3b8' }}>
                    <input type="checkbox" checked={showFailedOnly} onChange={(e)=>setShowFailedOnly(e.target.checked)} />
                    show failed only
                  </label>
                </div>
                {((lastRun.executor.chunks || []) as any[])
                  .filter((j:any)=> showFailedOnly ? (j.status==='error' && !(j.error && String(j.error).startsWith('skip:'))) : true)
                  .slice(0, showAllLastJobs ? undefined : 6)
                  .map((j: any) => (
                    <div key={j.index} style={{ color: '#e2e8f0', fontSize: 11, padding: 6, border: '1px solid #1e293b', borderRadius: 4, marginBottom: 4 }}>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span title={j.error || ''}>{j.status === 'error' ? (j.error && String(j.error).startsWith('skip:') ? '⚪' : '❌') : '✅'} {j.path}</span>
                        <span>{typeof j.ms === 'number' ? `${(j.ms/1000).toFixed(1)}s` : ''}</span>
                      </div>
                      {j.systemMsg && j.userMsg && (
                        <details style={{ marginTop: 4 }}>
                          <summary style={{ cursor:'pointer', color:'#94a3b8' }}>Show full prompt</summary>
                          <pre style={{ whiteSpace:'pre-wrap', background:'#0a0f1a', border:'1px solid #1e293b', borderRadius: 4, padding: 6, color:'#cbd5e1', fontSize:10 }}>
SYSTEM:\n{j.systemMsg}\n\nUSER:\n{j.userMsg}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                {(lastRun.executor.chunks?.length || 0) > 6 && (
                  <div onClick={() => setShowAllLastJobs(s => !s)} style={{ color: '#94a3b8', fontSize: 10, marginTop: 4, cursor: 'pointer' }}>
                    {showAllLastJobs ? 'show less' : `+${(lastRun.executor.chunks.length - 6)} more...`}
                  </div>
                )}
              </div>
              {/* Re-Apply preview and Save controls */}
              <div style={{ display:'flex', gap:8, marginTop:10 }}>
                <button
                  onClick={() => {
                    const enhanced = (streamedResult as any)?.enhancedData;
                    if (!enhanced) return;
                    // store backup and apply
                    previewBackupRef.current = JSON.parse(JSON.stringify(design));
                    const nextDesign = (enhanced && typeof enhanced === 'object' && 'designV2' in enhanced)
                      ? (enhanced as any).designV2
                      : (enhanced && typeof enhanced === 'object' && 'design' in enhanced)
                      ? (enhanced as any).design
                      : enhanced;
                    updateDesignLocal(() => nextDesign);
                    setPreviewActive(true);
                  }}
                  style={{ padding:'6px 10px', background:'#1f3d7a', color:'#fff', border:'1px solid #2a3a7a', borderRadius:6, fontSize:12, cursor:'pointer' }}
                >
                  Re‑apply Preview
                </button>
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  style={{ padding:'6px 10px', background:'#0f766e', color:'#fff', border:'1px solid #0ea5a4', borderRadius:6, fontSize:12, cursor:saving?'not-allowed':'pointer' }}
                >
                  {saving ? 'Saving…' : 'Save All Changes'}
                </button>
                <button
                  onClick={rejectChanges}
                  disabled={!previewActive}
                  style={{ padding:'6px 10px', background:'#dc2626', color:'#fff', border:'1px solid #ef4444', borderRadius:6, fontSize:12, cursor: !previewActive ? 'not-allowed' : 'pointer' }}
                >
                  Discard Changes
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
          
          {/* Parallel Processing Stats */}
          {(aiResult as any)?.metadata && (
            <div style={{ 
              marginBottom: 12, 
              padding: 8, 
              background: '#0f172a', 
              borderRadius: 4,
              border: '1px solid #1e293b'
            }}>
              <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6, fontWeight: 'bold' }}>
                ⚡ Parallel Processing Stats
              </div>
              {(() => {
                const m = (aiResult as any).metadata;
                return (
                  <div style={{ color: '#e2e8f0', fontSize: 10, lineHeight: 1.4 }}>
                    <div>⏱️ Total: {(m.totalTimeMs / 1000).toFixed(1)}s | 🧩 Chunks: {m.chunksSucceeded}/{m.chunksPlanned}</div>
                    {m.chunksFailed > 0 && (
                      <div style={{ color: '#fbbf24' }}>⚠️ {m.chunksFailed} chunks failed</div>
                    )}
                    <div style={{ marginTop: 4, color: '#94a3b8' }}>
                      🔗 Concurrent processing with {new Set(m.successes?.map((s: any) => s.keyIndex) || []).size} API keys
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
              ✓ Apply to Working Copy
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
              ✗ Reject & Revert
            </button>
          </div>
          
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>
            🔍 <strong>Preview Mode:</strong> Changes are visible but not saved. Apply to commit to working copy.
          </div>
        </div>
      )}
    </div>
  );
};

export default AIEnhancePanel;