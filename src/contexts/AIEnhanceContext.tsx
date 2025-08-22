import React from 'react';

type ModelRef = { provider: string; id: string; name?: string };

// 2-stage manual workflow state machine
type AIState = 'idle' | 'planning' | 'plan_ready' | 'executing' | 'results_ready' | 'applied' | 'error';

type JobState = {
  index: number;
  path: string;
  status: 'pending' | 'running' | 'ok' | 'error';
  ms?: number;
  error?: string;
  startedAt?: number;
  systemMsg?: string;
  userMsg?: string;
};

// Enhanced error types with recovery actions
type AIError = {
  type: 'network' | 'auth' | 'planner' | 'executor' | 'validation';
  message: string;
  details?: string;
  retryable: boolean;
  suggestion?: string;
};

interface AIEnhanceContextShape {
  // New simplified state machine
  state: AIState;
  setState: (state: AIState) => void;
  
  // Enhanced error handling
  error: AIError | null;
  setError: (error: AIError | null) => void;
  retry: () => Promise<void>;
  
  // Core data
  planTimeMs: number | null;
  plan: any | null;
  jobs: JobState[];
  result: any | null;
  metadata: any | null;
  lastRun: {
    planner?: { endpoint: string; modelId?: string; ms?: number; plan?: any };
    executor?: { endpoint: string; totalMs?: number; chunksPlanned?: number; chunksSucceeded?: number; chunksFailed?: number; chunks?: JobState[] };
  } | null;
  
  // Configuration
  executorMode: 'single' | 'multipart';
  setExecutorMode: (m: 'single' | 'multipart') => void;
  plannerModel: ModelRef;
  setPlannerModel: (m: ModelRef) => void;
  
  // State access
  previewBackup: any;
  
  // Actions - 2-stage manual workflow
  runPlanner: (args: {
    prompt: string;
    modelPlan?: ModelRef;
    currentDesign: any;
    selectionHint?: any;
    scopeMode?: 'auto' | 'selection' | 'global';
  }) => Promise<void>;
  
  runExecutor: (args: {
    modelExec: ModelRef;
    currentDesign: any;
  }) => Promise<void>;
  
  // Legacy compatibility
  runPlanAndExecute: (args: {
    prompt: string;
    modelPlan?: ModelRef;
    modelExec: ModelRef;
    currentDesign: any;
    selectionHint?: any;
    scopeMode?: 'auto' | 'selection' | 'global';
  }) => Promise<void>;
  
  // Preview management
  applyPreview: () => void;
  applyPreviewWithBackup: (backup: any) => void;
  rejectPreview: () => void;
  commitChanges: () => Promise<void>;
  
  reset: () => void;
}

const AIEnhanceContext = React.createContext<AIEnhanceContextShape | undefined>(undefined);

const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const AI_API_BASE = isLocalhost ? 'http://localhost:5001' : 'https://login.intuitiva.pt';

function buildIndexFromDesign(design: any) {
  const idx: any = { version: 2, paths: [], aliases: {}, relationships: {} };
  try {
    if (!design) return idx;
    
    // Enhanced semantic aliases for visual concepts
    idx.aliases = {
      // Background concepts
      "cards background": [],
      "section background": [],
      "hero background": [],
      "background": [],
      
      // Button concepts  
      "button background": [],
      "button color": [],
      "primary button": [],
      "secondary button": [],
      "button": [],
      
      // Text concepts
      "text color": [],
      "heading color": [],
      "body text": [],
      "title color": [],
      
      // Layout concepts
      "padding": [],
      "spacing": [],
      "hero section": [],
      "cards section": [],
    };
    
    // Build comprehensive path index
    // 1. Tokens
    if (design.tokens?.colors) {
      idx.paths.push({ id: 'tokens.colors', path: 'designV2.tokens.colors', category: 'color' });
      idx.aliases["background"].push('designV2.tokens.colors');
    }
    
    if (design.tokens?.typography) {
      Object.keys(design.tokens.typography).forEach((k) => {
        const path = `designV2.tokens.typography.${k}`;
        idx.paths.push({ id: `tokens.typography.${k}`, path, category: 'typography' });
        
        // Smart aliasing based on typography name
        if (k.includes('heading') || k.includes('title')) {
          idx.aliases["heading color"].push(path);
          idx.aliases["title color"].push(path);
        }
        if (k.includes('body') || k.includes('text')) {
          idx.aliases["body text"].push(path);
          idx.aliases["text color"].push(path);
        }
      });
    }
    
    // 2. Components
    const variants = design.components?.button?.variants;
    if (variants) {
      Object.keys(variants).forEach((v) => {
        const path = `designV2.components.button.variants.${v}`;
        idx.paths.push({ id: `components.button.variants.${v}`, path, category: 'component' });
        
        // Smart button aliasing
        idx.aliases["button"].push(path);
        idx.aliases["button background"].push(path);
        idx.aliases["button color"].push(path);
        
        if (v === 'primary') {
          idx.aliases["primary button"].push(path);
        }
        if (v === 'secondary') {
          idx.aliases["secondary button"].push(path);
        }
      });
    }
    
    // 3. Sections with enhanced background detection
    if (design.sections) {
      Object.keys(design.sections).forEach((s) => {
        const layoutPath = `designV2.sections.${s}.layout`;
        const innerPath = `designV2.sections.${s}.layout.inner`;
        const backgroundPath = `designV2.sections.${s}.layout.inner.background`;
        
        idx.paths.push({ id: `sections.${s}.layout`, path: layoutPath, category: 'layout' });
        
        // Smart section aliasing
        idx.aliases["section background"].push(backgroundPath);
        idx.aliases["background"].push(backgroundPath);
        idx.aliases["padding"].push(`${layoutPath}.padding`);
        idx.aliases["spacing"].push(`${layoutPath}.padding`);
        
        // Section-specific aliases
        if (s.includes('hero')) {
          idx.aliases["hero section"].push(layoutPath);
          idx.aliases["hero background"].push(backgroundPath);
        }
        if (s.includes('card') || s.includes('feature')) {
          idx.aliases["cards background"].push(backgroundPath);
          idx.aliases["cards section"].push(layoutPath);
        }
        if (s.includes('why') && s.includes('feature')) {
          idx.aliases["cards background"].push(backgroundPath);
        }
      });
    }
    
    // Build relationships for smart suggestions
    idx.relationships = {
      "background_affects_text": {
        "designV2.sections.*.layout.inner.background": ["designV2.tokens.typography.*.color"],
        "designV2.tokens.colors.background": ["designV2.tokens.typography.body.color"]
      },
      "button_variants": {
        "designV2.components.button.variants.primary": ["backgroundColor", "textColor", "padding"],
        "designV2.components.button.variants.secondary": ["backgroundColor", "textColor", "borderColor"]
      }
    };
    
  } catch (e) {
    console.warn('Index building failed:', e);
  }
  return idx;
}

function getByPath(root: any, path: string) {
  if (!root || !path) return undefined;
  const parts = path.split('.');
  let cur: any = root;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function buildShapeHints(design: any, index: any) {
  const hints: Record<string, string[]> = {};
  try {
    const rootWrapped = { designV2: design };
    (index?.paths || []).forEach((e: any) => {
      const obj = getByPath(rootWrapped, e.path);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        hints[e.path] = Object.keys(obj);
      }
    });
  } catch {}
  return hints;
}

function ensurePlanCoverage(prompt: string, index: any, plan: any) {
  try {
    const p = (prompt || '').toLowerCase();
    const mentionsButton = /(button|bot[aã]o|bot[oõ]es|btn)/.test(p);
    const mentionsPrimary = /(primary|prim[aá]ri[oa]s?)/.test(p);
    const wantPrimaryButtons = mentionsButton && (mentionsPrimary || /bot[ãa]o.+prim[aá]ri/.test(p));
    const primaryPath = (index?.paths || []).find((x: any) => x.id === 'components.button.variants.primary')?.path;
    if (!primaryPath) return plan;
    const already = Array.isArray(plan?.primary) && plan.primary.some((e: any) => e.path === primaryPath);
    if (wantPrimaryButtons && !already) {
      const allowedFields = [
        'backgroundColor', 'backgroundColorHover',
        'textColor', 'textColorHover',
        'borderColor', 'borderColorHover',
        'padding', 'fontSize', 'fontWeight', 'borderRadius', 'borderWidth'
      ];
      const patch = { path: primaryPath, allowedFields };
      const nextPrimary = [patch, ...(plan?.primary || [])];
      return { ...(plan || {}), primary: nextPrimary };
    }
    return plan;
  } catch {
    return plan;
  }
}

export const AIEnhanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // New simplified state machine
  const [state, setState] = React.useState<AIState>('idle');
  const [error, setError] = React.useState<AIError | null>(null);
  
  // Core data states
  const [planTimeMs, setPlanTimeMs] = React.useState<number | null>(null);
  const [plan, setPlan] = React.useState<any | null>(null);
  const [jobs, setJobs] = React.useState<JobState[]>([]);
  const [result, setResult] = React.useState<any | null>(null);
  const [metadata, setMetadata] = React.useState<any | null>(null);
  const [lastRun, setLastRun] = React.useState<any | null>(null);
  
  // Configuration
  const [executorMode, setExecutorMode] = React.useState<'single' | 'multipart'>('single');
  const [plannerModel, setPlannerModel] = React.useState<ModelRef>({ provider: 'openrouter', id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' });
  
  // Preview management
  const [previewBackup, setPreviewBackup] = React.useState<any>(null);
  const [lastPrompt, setLastPrompt] = React.useState<string>('');
  const [lastArgs, setLastArgs] = React.useState<any>(null);
  


  const reset = React.useCallback(() => {
    setState('idle');
    setPlanTimeMs(null);
    setPlan(null);
    setJobs([]);
    setResult(null);
    setMetadata(null);
    setError(null);
    setPreviewBackup(null);
    setLastPrompt('');
    setLastArgs(null);
  }, []);
  
  const createError = React.useCallback((type: AIError['type'], message: string, details?: string, retryable = true): AIError => ({
    type,
    message,
    details,
    retryable,
    suggestion: type === 'network' ? 'Check your internet connection and try again' :
               type === 'auth' ? 'Please refresh the page and log in again' :
               type === 'planner' ? 'Try simplifying your prompt or check planner model' :
               type === 'executor' ? 'Try reducing the scope or switching to single-shot mode' :
               'Please try again or contact support'
  }), []);
  
  const retry = React.useCallback(async () => {
    if (!error?.retryable || !lastArgs) return;
    setError(null);
    await runPlanAndExecute(lastArgs);
  }, [error, lastArgs]);
  
  const applyPreview = React.useCallback(() => {
    if (state !== 'results_ready' || !result) return;
    setState('applied');
    console.log('✅ Preview applied to working copy');
  }, [state, result]);
  
  const applyPreviewWithBackup = React.useCallback((backup: any) => {
    if (state !== 'results_ready' || !result) return;
    setPreviewBackup(backup);
    setState('applied');
    console.log('✅ Preview applied to working copy with backup created');
  }, [state, result]);
  
  const rejectPreview = React.useCallback(() => {
    if (state !== 'results_ready') return;
    
    // If we have a backup, restore it
    if (previewBackup) {
      // This would need access to updateDesignLocal from DesignContext
      // For now, we'll handle this in the component level
      console.log('❌ Preview rejected, backup available for restoration');
    }
    
    setState('idle');
    setResult(null);
    setPreviewBackup(null);
    console.log('❌ Preview rejected, state reset');
  }, [state, previewBackup]);
  
  const commitChanges = React.useCallback(async () => {
    if (state !== 'applied') return;
    try {
      // In a real implementation, this would save to API
      console.log('💾 Committing changes to API...');
      setState('idle');
      setResult(null);
      setPreviewBackup(null);
    } catch (e: any) {
      setError(createError('network', 'Failed to save changes', e.message));
    }
  }, [state, createError]);

  // Split into 2 separate functions for manual control
  const runPlanner = React.useCallback(async (args: {
    prompt: string;
    modelPlan?: ModelRef;
    currentDesign: any;
    selectionHint?: any;
    scopeMode?: 'auto' | 'selection' | 'global';
  }) => {
    const { prompt, modelPlan, currentDesign, selectionHint, scopeMode = 'auto' } = args;
    
    // Store for executor phase
    setLastPrompt(prompt);
    setLastArgs(args);
    
    setError(null);
    setResult(null);
    setMetadata(null);

    // Build enhanced index with semantic aliases
    const index = buildIndexFromDesign(currentDesign);
    console.log('🧠 Built enhanced index:', { 
      pathCount: index.paths?.length, 
      aliasCount: Object.keys(index.aliases || {}).length,
      version: index.version 
    });

    // Planning phase only
    setState('planning');
    try {
      const res = await fetch(`${AI_API_BASE}/ai-plan-scope`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          index, 
          selectionHint, 
          scopeMode, 
          shapeHints: buildShapeHints(currentDesign, index), 
          aiModelPlan: modelPlan || plannerModel 
        })
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication required');
        } else if (res.status >= 500) {
          throw new Error('Server error - please try again');
        }
        throw new Error(`Request failed (${res.status})`);
      }
      
      const json = await res.json();
      if (!json?.success) {
        throw new Error(json?.error || 'Planner returned unsuccessful response');
      }
      
      setPlan(json);
      setPlanTimeMs(json.planTimeMs || null);
      setLastRun((prev: any) => ({
        ...(prev || {}),
        planner: { endpoint: `${AI_API_BASE}/ai-plan-scope`, modelId: (json.model?.id), ms: json.planTimeMs, plan: json }
      }));
      
      // Move to plan_ready state for user review
      setState('plan_ready');
      
    } catch (e: any) {
      const errorType: AIError['type'] = e.message.includes('Authentication') ? 'auth' :
                                         e.message.includes('network') ? 'network' : 'planner';
      setError(createError(errorType, `Planner failed: ${e.message}`, e.stack));
      setState('error');
    }
  }, [createError, plannerModel, AI_API_BASE]);

  const runExecutor = React.useCallback(async (args: {
    modelExec: ModelRef;
    currentDesign: any;
  }) => {
    const { modelExec, currentDesign } = args;
    
    if (!plan || state !== 'plan_ready') {
      setError(createError('validation', 'No plan available for execution'));
      return;
    }

    // Executor phase
    setState('executing');
    setJobs([]);
    try {
      const body = {
        data: { designV2: currentDesign },
        prompt: lastPrompt,
        aiModel: modelExec,
        plannerOutput: plan,
        mode: 'single' // Always single-shot
      };
      
      const res = await fetch(`${AI_API_BASE}/ai-enhance-content-multipart-stream`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Executor failed (${res.status}): ${errorText}`);
      }
      
      if (!res.body) throw new Error('No stream body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.type === 'plan') {
              const initial = (evt.chunks || []).map((c: any) => ({ index: c.index, path: c.path, status: 'pending' as const }));
              setJobs(initial);
            } else if (evt.type === 'chunk_start') {
              setJobs(prev => prev.map(j => j.index === evt.index ? { ...j, status: 'running', startedAt: Date.now() } : j));
            } else if (evt.type === 'chunk_complete') {
              setJobs(prev => prev.map(j => j.index === evt.index ? { ...j, status: evt.ok ? 'ok' : 'error', ms: evt.ms, error: evt.error, systemMsg: evt.systemMsg, userMsg: evt.userMsg } : j));
            } else if (evt.type === 'result') {
              if (evt.success) {
                setResult({ enhancedData: evt.enhancedData });
                setState('results_ready'); // Move to results_ready for user review
              } else {
                setError(createError('executor', 'Execution failed', evt.error));
                setState('error');
              }
              setMetadata(evt.metadata || null);
              setLastRun((prev: any) => ({
                ...(prev || {}),
                executor: {
                  endpoint: `${AI_API_BASE}/ai-enhance-content-multipart-stream`,
                  totalMs: evt.metadata?.totalTimeMs,
                  chunksPlanned: evt.metadata?.chunksPlanned,
                  chunksSucceeded: evt.metadata?.chunksSucceeded,
                  chunksFailed: evt.metadata?.chunksFailed,
                  chunks: [...(jobs || [])].map(j => ({...j}))
                }
              }));
            } else if (evt.type === 'error') {
              setError(createError('executor', evt.message || 'Stream error', evt.details));
              setState('error');
            }
          } catch {}
        }
      }
    } catch (e: any) {
      const errorType: AIError['type'] = e.message.includes('fetch') ? 'network' : 'executor';
      setError(createError(errorType, `Executor failed: ${e.message}`, e.stack));
      setState('error');
    }
  }, [createError, plan, state, lastPrompt, jobs, AI_API_BASE]);

  // Legacy function for backward compatibility - now just calls the split functions
  const runPlanAndExecute = React.useCallback(async (args: {
    prompt: string;
    modelPlan?: ModelRef;
    modelExec: ModelRef;
    currentDesign: any;
    selectionHint?: any;
    scopeMode?: 'auto' | 'selection' | 'global';
  }) => {
    const { prompt, modelPlan, modelExec, currentDesign, selectionHint, scopeMode = 'auto' } = args;
    
    // First run planner
    await runPlanner({ prompt, modelPlan, currentDesign, selectionHint, scopeMode });
    
    // If planning succeeded, auto-execute (legacy behavior)
    if (state === 'plan_ready') {
      await runExecutor({ modelExec, currentDesign });
    }
  }, [runPlanner, runExecutor, state]);

  const value: AIEnhanceContextShape = {
    // New state machine
    state,
    setState,
    
    // Enhanced error handling
    error,
    setError,
    retry,
    
    // Core data
    planTimeMs,
    plan,
    jobs,
    result,
    metadata,
    lastRun,
    
    // Configuration
    executorMode,
    setExecutorMode,
    plannerModel,
    setPlannerModel,
    
    // State access
    previewBackup,
    
    // Actions - 2-stage manual workflow
    runPlanner,
    runExecutor,
    runPlanAndExecute, // Legacy compatibility
    
    // Preview management
    applyPreview,
    applyPreviewWithBackup,
    rejectPreview,
    commitChanges,
    
    reset,
  };

  return (
    <AIEnhanceContext.Provider value={value}>{children}</AIEnhanceContext.Provider>
  );
};

export const useAIEnhance = () => {
  const ctx = React.useContext(AIEnhanceContext);
  if (!ctx) throw new Error('useAIEnhance must be used within AIEnhanceProvider');
  return ctx;
};


