import React from 'react';
import { Brain, Zap, Check, X, Save, RotateCcw, FileText, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useDesign } from '../contexts/DesignContext';
import { useEditorOverlay } from '../contexts/EditorOverlayContext';
import { useAIEnhance } from '../contexts/AIEnhanceContext';

// Available AI models for both planner and executor
const AI_MODELS = [
  { provider: 'openrouter', id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { provider: 'openrouter', id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
  { provider: 'openrouter', id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { provider: 'openrouter', id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { provider: 'openrouter', id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet' },
  { provider: 'openrouter', id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { provider: 'openrouter', id: 'deepseek/deepseek-v3-0324', name: 'DeepSeek V3' },
  { provider: 'openrouter', id: 'deepseek/deepseek-v3-0324-free', name: 'DeepSeek V3 (free)' },
  { provider: 'openrouter', id: 'deepseek/r1-0528-free', name: 'DeepSeek R1 (free)' },
  { provider: 'openrouter', id: 'qwen/qwen3-coder', name: 'Qwen 3 Coder' },
  { provider: 'openrouter', id: 'moonshotai/kimi-k2', name: 'Kimi K2' },
];

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
  const { design, updateDesignLocal, saveDesignToAPI, refreshDesign } = useDesign() as any;
  const { aiTiming, startAiGeneration, endAiGeneration, activeElement } = useEditorOverlay() as any;
  const { 
    state, 
    error, 
    retry,
    planTimeMs, 
    plan,
    jobs, 
    runPlanner,
    runExecutor,
    result: streamedResult, 
    metadata: streamedMeta, 
    lastRun, 
    plannerModel, 
    setPlannerModel,
    applyPreview,
    applyPreviewWithBackup,
    rejectPreview,
    commitChanges,
    previewBackup,
    setState,
    setError
  } = useAIEnhance();
  
  // Simplified local state
  const [showAllLastJobs, setShowAllLastJobs] = React.useState(false);
  const [showFailedOnly, setShowFailedOnly] = React.useState(false);
  const [showPlan, setShowPlan] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState<string>('');
  const [showPlanJson, setShowPlanJson] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState<boolean>(false);
  const [insertMode, setInsertMode] = React.useState<'replace' | 'append'>('replace');
  
  // Executor model state - default to Gemini 2.5 Flash
  const [executorModel, setExecutorModel] = React.useState({ 
    provider: 'openrouter', 
    id: 'google/gemini-2.5-flash', 
    name: 'Gemini 2.5 Flash' 
  });

  // Dynamic API endpoint: localhost in dev, production in deploy
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const AI_API_BASE = isLocalhost ? 'http://localhost:5001' : 'https://login.intuitiva.pt';
  // Use duplicated endpoint with same behavior (server must provide it)

  const applySuggestion = (p: string) => {
    setAiPrompt(prev => insertMode === 'append' && prev.trim() ? `${prev.trim()}\n${p}` : p);
  };

  // Stage 1: Generate Plan
  const generatePlan = async () => {
    const startTime = Date.now();
    startAiGeneration();

    try {
      // Build selection hint from active element
      const selectionHint = activeElement ? {
        sectionId: activeElement.sectionId,
        tokenPaths: Array.isArray(activeElement.tokenMatches) ? activeElement.tokenMatches.map((m:any)=>m.tokenPath) : []
      } : undefined;

      // Only run planner - manual control
      await runPlanner({
        prompt: aiPrompt || 'Improve readability and consistency. Keep structure identical.',
        modelPlan: plannerModel,
        currentDesign: design,
        scopeMode: 'auto',
        selectionHint
      });
    } finally {
      endAiGeneration(Date.now() - startTime);
    }
  };

  // Stage 2: Execute Plan
  const executePlan = async () => {
    const startTime = Date.now();
    startAiGeneration();

    try {
      await runExecutor({
        modelExec: executorModel,
        currentDesign: design
      });
    } finally {
      endAiGeneration(Date.now() - startTime);
    }
  };

  const handleApplyPreview = async () => {
    try {
      // Apply preview to the design
      if (streamedResult?.enhancedData) {
        const enhanced = streamedResult.enhancedData;
        const nextDesign = (enhanced && typeof enhanced === 'object' && 'designV2' in enhanced)
          ? (enhanced as any).designV2
          : (enhanced && typeof enhanced === 'object' && 'design' in enhanced)
          ? (enhanced as any).design
          : enhanced;
        
        // Create backup before applying changes
        const currentDesignBackup = JSON.parse(JSON.stringify(design));
        
        updateDesignLocal(() => nextDesign);
        
        // Store backup for potential revert
        applyPreviewWithBackup(currentDesignBackup);
      }
      
      setAiPrompt(''); // Clear prompt after successful apply
    } catch (e: any) {
      console.error('❌ Failed to apply preview:', e);
    }
  };

  const handleCommitChanges = async () => {
    try {
      await saveDesignToAPI();
      await commitChanges();
      console.log('💾 Changes saved to API');
    } catch (e: any) {
      console.error('❌ Failed to save changes:', e);
    }
  };

  const handleRejectChanges = () => {
    // Get backup from AI context and restore it if available
    const backupAvailable = state === 'results_ready' && previewBackup;
    
    if (backupAvailable) {
      // Restore the backup design
      updateDesignLocal(() => previewBackup);
      console.log('🔄 Design reverted to backup');
    }
    
    rejectPreview();
    setAiPrompt(''); // Clear prompt after reject
  };

  const handleDiscard = async () => {
    try {
      // Smart discard based on current state
      if (state === 'results_ready' || state === 'applied') {
        // If we have results/applied changes, go back to plan_ready to allow re-execution
        if (plan?.plan) {
          setState('plan_ready');
          setError(null);
          console.log('🗑️ Discarded results, returned to plan ready state');
          return;
        }
      }
      
      // For other states or if no plan exists, reload design and go to idle
      await refreshDesign();
      setState('idle');
      setError(null);
      
      console.log('🗑️ Discarded AI session and reloaded original design');
    } catch (e: any) {
      console.error('❌ Failed to refresh design:', e);
      // Fallback to just clearing state
      setState('idle');
      setError(null);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Model Selection - Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Planner Model */}
        <div>
          <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}>Planner:</div>
          <select
            value={plannerModel.id}
            onChange={(e) => {
              const selected = AI_MODELS.find(m => m.id === e.target.value);
              if (selected) setPlannerModel(selected);
            }}
            disabled={state === 'planning' || state === 'executing'}
            style={{
              width: '100%',
              background: '#141414',
              color: '#fff',
              border: '1px solid #2a2a2a',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 11,
              cursor: (state === 'planning' || state === 'executing') ? 'not-allowed' : 'pointer'
            }}
          >
            {AI_MODELS.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        </div>

        {/* Executor Model */}
        <div>
          <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}>Executor:</div>
          <select
            value={executorModel.id}
            onChange={(e) => {
              const selected = AI_MODELS.find(m => m.id === e.target.value);
              if (selected) setExecutorModel(selected);
            }}
            disabled={state === 'planning' || state === 'executing'}
            style={{
              width: '100%',
              background: '#141414',
              color: '#fff',
              border: '1px solid #2a2a2a',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 11,
              cursor: (state === 'planning' || state === 'executing') ? 'not-allowed' : 'pointer'
            }}
          >
            {AI_MODELS.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
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

      {/* 2-Stage Manual Actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Stage 1: Planning */}
        {(state === 'idle' || state === 'error') && (
        <button
            onClick={generatePlan}
            disabled={state === 'planning'}
          style={{
            padding: '8px 12px',
              background: state === 'planning' ? '#374151' : '#1f3d7a',
            color: '#fff',
            borderRadius: 6,
            border: '1px solid #2a3a7a',
            fontSize: 12,
              cursor: state === 'planning' ? 'not-allowed' : 'pointer'
            }}
          >
            {state === 'planning' ? 'Planning…' : (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Brain size={14} style={{ marginRight: 6 }} />
                Generate Plan
              </div>
            )}
          </button>
        )}
        
        {/* Stage 2: Execution & Re-planning */}
        {state === 'plan_ready' && (
          <>
            <button
              onClick={generatePlan}
              style={{
                padding: '8px 12px',
                background: '#7c3aed',
                color: '#fff',
                borderRadius: 6,
                border: '1px solid #8b5cf6',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Brain size={14} style={{ marginRight: 6 }} />
                Re-plan
              </div>
            </button>
            <button
              onClick={executePlan}
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
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Zap size={14} style={{ marginRight: 6 }} />
                Execute Plan
              </div>
            </button>
            <button
              onClick={handleDiscard}
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
              <Trash2 size={14} />
            </button>
          </>
        )}
        
        {state === 'executing' && (
          <button
            disabled
            style={{
              padding: '8px 12px',
              background: '#374151',
              color: '#fff',
              borderRadius: 6,
              border: '1px solid #4b5563',
              fontSize: 12,
              cursor: 'not-allowed'
            }}
          >
            Executing…
          </button>
        )}
        
        {/* Results Actions */}
        {state === 'results_ready' && (
          <>
            <button
              onClick={handleApplyPreview}
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
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Check size={14} style={{ marginRight: 6 }} />
                Apply
              </div>
            </button>
            <button
              onClick={handleRejectChanges}
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
<><X size={14} style={{ marginRight: 6 }} />Reject</>
            </button>
            <button
              onClick={handleDiscard}
              style={{
                padding: '8px 12px',
                background: '#6b7280',
                color: '#fff',
                borderRadius: 6,
                border: '1px solid #9ca3af',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
        
        {state === 'applied' && (
          <>
            <button
              onClick={handleCommitChanges}
              style={{
                padding: '8px 12px',
                background: '#0f766e',
                color: '#fff',
                borderRadius: 6,
                border: '1px solid #0ea5a4',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              <Save size={16} />
            </button>
            <button
              onClick={handleDiscard}
              style={{
                padding: '8px 12px',
                background: '#6b7280',
                color: '#fff',
                borderRadius: 6,
                border: '1px solid #9ca3af',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
        
        {state === 'error' && error?.retryable && (
          <button
            onClick={retry}
            style={{
              padding: '8px 12px',
              background: '#f59e0b',
              color: '#fff',
              borderRadius: 6,
              border: '1px solid #fbbf24',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
<><RotateCcw size={14} style={{ marginRight: 6 }} />Retry</>
        </button>
        )}
        
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
          {state === 'idle' ? '💡 Ready to plan enhancement' :
           state === 'planning' ? '🧠 Analyzing prompt and design...' :
           state === 'plan_ready' ? '📋 Plan ready - review and execute' :
           state === 'executing' ? '⚡ Applying changes to design...' :
           state === 'results_ready' ? '✨ Results ready for review' :
           state === 'applied' ? '💾 Changes applied - ready to save' :
           state === 'error' ? '❌ Error occurred - check details below' : 'Ready'}
        </div>
      </div>

      {/* Live Progress - Only when executing */}
      {state === 'executing' && jobs.length > 0 && (
      <div style={{ marginTop: 8, padding: 8, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6 }}>
          <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>Progress:</div>
          {jobs.slice(0, 4).map(j => (
            <div key={j.index} style={{ display: 'flex', justifyContent: 'space-between', color: j.status==='error' ? '#f87171' : j.status==='ok' ? '#22c55e' : '#e5e7eb', fontSize: 11, marginBottom: 2 }}>
              <span>{j.status === 'running' ? '⏳' : j.status === 'ok' ? '✅' : '❌'} {j.path}</span>
              <span>{typeof j.ms === 'number' ? `${(j.ms/1000).toFixed(1)}s` : ''}</span>
            </div>
          ))}
          {jobs.length > 4 && (
            <div style={{ color: '#94a3b8', fontSize: 10 }}>+{jobs.length - 4} more paths...</div>
          )}
        </div>
      )}

      {/* Plan Review - When plan is ready */}
      {state === 'plan_ready' && plan?.plan && (
        <div style={{ marginTop: 8, padding: 12, background: '#1a2332', border: '1px solid #2563eb', borderRadius: 8 }}>
          <div style={{ color: '#60a5fa', fontSize: 12, marginBottom: 8, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <FileText size={14} style={{ marginRight: 6 }} />
            📋 Execution Plan Ready
          </div>
          
          <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 8 }}>
            ⚡ Execute to apply changes, 🧠 Re-plan to try different model, or 🗑️ Discard to start over
          </div>
          
          {plan.plan.goal && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: '#e5e7eb', fontSize: 11, marginBottom: 4 }}>Goal:</div>
              <div style={{ color: '#cbd5e1', fontSize: 11 }}>{plan.plan.goal.enhanced_goal || plan.plan.goal.user_goal}</div>
          </div>
        )}
          
          {plan.plan.steps && plan.plan.steps.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: '#e5e7eb', fontSize: 11, marginBottom: 4 }}>Steps:</div>
              {plan.plan.steps.slice(0, 3).map((step: string, i: number) => (
                <div key={i} style={{ color: '#cbd5e1', fontSize: 10, marginBottom: 2 }}>
                  {i + 1}. {step}
                </div>
              ))}
              {plan.plan.steps.length > 3 && (
                <div style={{ color: '#94a3b8', fontSize: 10 }}>+{plan.plan.steps.length - 3} more steps</div>
              )}
            </div>
          )}
          
          <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 8 }}>
            Targets: {plan.plan.primary?.length || 0} primary paths | {planTimeMs ? `${(planTimeMs/1000).toFixed(1)}s` : ''}
          </div>
          
          {/* Toggle for full plan JSON */}
          <button
            onClick={() => setShowPlanJson(!showPlanJson)}
            style={{
              padding: '4px 8px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 4,
              color: '#94a3b8',
              fontSize: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {showPlanJson ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showPlanJson ? 'Hide Plan JSON' : 'Show Plan JSON'}
          </button>
          
          {/* Full plan JSON */}
          {showPlanJson && (
            <div style={{ marginTop: 8 }}>
              <pre style={{
                background: '#0a0f1a',
                border: '1px solid #1e293b',
                borderRadius: 6,
                padding: 8,
                fontSize: 9,
                color: '#cbd5e1',
                maxHeight: 200,
                overflow: 'auto',
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {JSON.stringify(plan.plan, null, 2)}
              </pre>
          </div>
        )}
      </div>
      )}

      {/* Last Run Summary */}
      {lastRun && (
        <div style={{ marginTop: 8, padding: 8, background: '#0b1220', border: '1px solid #1e293b', borderRadius: 6 }}>
          <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>Last Run</div>
          {lastRun.planner && (
            <div style={{ color: '#e2e8f0', fontSize: 11, marginBottom: 4 }}>
              Planner: {(lastRun.planner.ms/1000).toFixed(1)}s
            </div>
          )}
          {lastRun.executor && (
            <div style={{ color: '#e2e8f0', fontSize: 11 }}>
              Executor: {(lastRun.executor.totalMs/1000).toFixed(1)}s • {lastRun.executor.chunksSucceeded}/{lastRun.executor.chunksPlanned} chunks
            </div>
          )}
        </div>
      )}

      {/* Enhanced Error Display */}
      {error && (
        <div style={{
          padding: 12,
          background: '#4c1d1d',
          border: '1px solid #7c2d12',
          borderRadius: 6,
          color: '#ff7b72',
          fontSize: 12
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 6 }}>
            {error.type === 'network' ? '🌐 Network Error' :
             error.type === 'auth' ? '🔒 Authentication Error' :
             error.type === 'planner' ? '🧠 Planner Error' :
             error.type === 'executor' ? '⚡ Executor Error' : '❌ Error'}
          </div>
          <div style={{ marginBottom: 6 }}>{error.message}</div>
          {error.suggestion && (
            <div style={{ fontSize: 11, color: '#fbbf24', fontStyle: 'italic' }}>
              💡 {error.suggestion}
            </div>
          )}
          {error.details && (
            <details style={{ marginTop: 6 }}>
              <summary style={{ cursor: 'pointer', fontSize: 11 }}>Technical details</summary>
              <pre style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                {error.details}
              </pre>
            </details>
          )}
        </div>
      )}

            {/* Results status display */}
      {state === 'results_ready' && (
        <div style={{
          padding: 12,
          background: '#1a332a',
          border: '1px solid #16a34a',
          borderRadius: 8
        }}>
          <div style={{ color: '#22c55e', fontSize: 12, fontWeight: 'bold', marginBottom: 6 }}>
            ✨ Enhancement Complete
          </div>
          <div style={{ color: '#e5e7eb', fontSize: 11, marginBottom: 6 }}>
            {streamedMeta && `${streamedMeta.chunksSucceeded}/${streamedMeta.chunksPlanned} design paths updated successfully.`}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 10 }}>
            💡 Apply to see changes, Reject to revert, or Discard to retry execution
          </div>
        </div>
      )}

      {state === 'applied' && (
        <div style={{
          padding: 12,
          background: '#1a332a',
          border: '1px solid #16a34a',
          borderRadius: 8
        }}>
          <div style={{ color: '#22c55e', fontSize: 12, fontWeight: 'bold', marginBottom: 6 }}>
            ✅ Changes Applied Successfully
          </div>
          <div style={{ color: '#e5e7eb', fontSize: 11, marginBottom: 6 }}>
            Design has been updated in your working copy.
          </div>
          <div style={{ color: '#94a3b8', fontSize: 10 }}>
            💾 Save to persist changes, or Discard to go back and try again
          </div>
        </div>
      )}
    </div>
  );
};

export default AIEnhancePanel;