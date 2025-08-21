import React from 'react';

type ModelRef = { provider: string; id: string; name?: string };

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

interface AIEnhanceContextShape {
  planning: boolean;
  executing: boolean;
  planTimeMs: number | null;
  plan: any | null;
  jobs: JobState[];
  result: any | null;
  metadata: any | null;
  lastRun: {
    planner?: { endpoint: string; modelId?: string; ms?: number; plan?: any };
    executor?: { endpoint: string; totalMs?: number; chunksPlanned?: number; chunksSucceeded?: number; chunksFailed?: number; chunks?: JobState[] };
  } | null;
  error: string | null;
  executorMode: 'single' | 'multipart';
  setExecutorMode: (m: 'single' | 'multipart') => void;
  runPlanAndExecute: (args: {
    prompt: string;
    modelPlan?: ModelRef;
    modelExec: ModelRef;
    currentDesign: any;
    selectionHint?: any;
    scopeMode?: 'auto' | 'selection' | 'global';
  }) => Promise<void>;
  reset: () => void;
}

const AIEnhanceContext = React.createContext<AIEnhanceContextShape | undefined>(undefined);

const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const AI_API_BASE = isLocalhost ? 'http://localhost:5001' : 'https://login.intuitiva.pt';

function buildIndexFromDesign(design: any) {
  const idx: any = { version: 1, paths: [], aliases: {} };
  try {
    if (!design) return idx;
    // tokens.colors
    if (design.tokens?.colors) {
      idx.paths.push({ id: 'tokens.colors', path: 'designV2.tokens.colors' });
    }
    // tokens.typography families
    if (design.tokens?.typography) {
      Object.keys(design.tokens.typography).forEach((k) => {
        idx.paths.push({ id: `tokens.typography.${k}`, path: `designV2.tokens.typography.${k}` });
      });
    }
    // components.button variants
    const variants = design.components?.button?.variants;
    if (variants) {
      Object.keys(variants).forEach((v) => {
        idx.paths.push({ id: `components.button.variants.${v}`, path: `designV2.components.button.variants.${v}` });
      });
    }
    // sections.*.layout
    if (design.sections) {
      Object.keys(design.sections).forEach((s) => {
        idx.paths.push({ id: `sections.${s}.layout`, path: `designV2.sections.${s}.layout` });
      });
    }
  } catch {}
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
  const [planning, setPlanning] = React.useState(false);
  const [executing, setExecuting] = React.useState(false);
  const [planTimeMs, setPlanTimeMs] = React.useState<number | null>(null);
  const [plan, setPlan] = React.useState<any | null>(null);
  const [jobs, setJobs] = React.useState<JobState[]>([]);
  const [result, setResult] = React.useState<any | null>(null);
  const [metadata, setMetadata] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [lastRun, setLastRun] = React.useState<any | null>(null);
  const [executorMode, setExecutorMode] = React.useState<'single' | 'multipart'>('single');

  const reset = React.useCallback(() => {
    setPlanning(false);
    setExecuting(false);
    setPlanTimeMs(null);
    setPlan(null);
    setJobs([]);
    setResult(null);
    setMetadata(null);
    setError(null);
  }, []);

  const runPlanAndExecute = React.useCallback(async (args: {
    prompt: string;
    modelPlan?: ModelRef;
    modelExec: ModelRef;
    currentDesign: any;
    selectionHint?: any;
    scopeMode?: 'auto' | 'selection' | 'global';
  }) => {
    const { prompt, modelPlan, modelExec, currentDesign, selectionHint, scopeMode = 'auto' } = args;
    setError(null);
    setResult(null);
    setMetadata(null);

    // Build index
    const index = buildIndexFromDesign(currentDesign);

    // 1) Planner
    setPlanning(true);
    let plannerResponse: any = null;
    try {
      const res = await fetch(`${AI_API_BASE}/ai-plan-scope`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, index, selectionHint, scopeMode, shapeHints: buildShapeHints(currentDesign, index), aiModelPlan: modelPlan || { provider: 'openrouter', id: 'anthropic/claude-3.5-sonnet' } })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || `Planner failed (${res.status})`);
      plannerResponse = json; // Store for executor
      setPlan(json); // Store the entire planner response
      setPlanTimeMs(json.planTimeMs || null);
      setLastRun((prev: any) => ({
        ...(prev || {}),
        planner: { endpoint: `${AI_API_BASE}/ai-plan-scope`, modelId: (json.model?.id), ms: json.planTimeMs, plan: json }
      }));
    } catch (e: any) {
      setPlanning(false);
      setError(e?.message || 'Planner failed');
      return;
    }
    setPlanning(false);

    // 2) Executor (stream NDJSON)
    setExecuting(true);
    setJobs([]);
    try {
      const body = {
        data: { designV2: currentDesign },
        prompt,
        aiModel: modelExec,
        // Pass ENTIRE planner response (not just plan) so backend can extract all fields
        plannerOutput: plannerResponse,
        mode: executorMode
      };
      
      // Debug: log what we're sending to executor
      console.log('🔍 Sending to executor:', {
        promptLength: prompt?.length,
        plannerOutput: plannerResponse,
        hasData: !!currentDesign
      });
      const res = await fetch(`${AI_API_BASE}/ai-enhance-content-multipart-stream`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
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
              setExecuting(false);
            } else if (evt.type === 'error') {
              setError(evt.message || 'Stream error');
              setExecuting(false);
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Executor failed');
      setExecuting(false);
    }
  }, []);

  const value: AIEnhanceContextShape = {
    planning,
    executing,
    planTimeMs,
    plan,
    jobs,
    result,
    metadata,
    lastRun,
    error,
    executorMode,
    setExecutorMode,
    runPlanAndExecute,
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


