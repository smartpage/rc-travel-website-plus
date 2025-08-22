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
  planValidation: {
    isExecutable: boolean;
    validSteps: number;
    totalSteps: number;
    errors: string[];
    warnings: string[];
  } | null;
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
  sessionBackup: any;
  lastPrompt: string;
  
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

  // 🚀 NEW: Fast PathFinder execution
  runPathFinderExecution: (args: {
    prompt: string;
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
      // Card-specific concepts (distinct from sections)
      "card background": [],
      "cards background": [],
      "card background (elements not section)": [],
      "travel card": [],
      "service card": [],
      "feature card": [],
      "why card": [],
      "card": [],
      
      // Section background concepts
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
      "card title": [],
      "card text": [],
      
      // Layout concepts
      "padding": [],
      "spacing": [],
      "hero section": [],
      "cards section": [],
      
      // FAQ components
      "faq card": [],
      "faq background": [],
      "faq border card": [],
      "faq shadow": [],
      "faq question": [],
      "faq question background": [],
      "faq answer": [],
      "faq answer background": [],
      "faq answer text": [],
      "faq answer align": [],
      "faq body": [],
      "faq body background": [],
      "faq body text": [],
      "faq body align": [],
      "faq chevron": [],
      "faq arrow": [],
      "faq chevron background": [],
      "faq arrow background": [],
      "faq chevron icon": [],
      "faq arrow icon": [],
      "faq border": [],
      "faq line": [],
      "faq inner line": [],
      "faq divider": [],
      "faq separator": [],
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
        
        // Card typography mapping
        if (k.includes('Card') || k.includes('card')) {
          idx.aliases["card title"].push(path);
          idx.aliases["card text"].push(path);
          idx.aliases["card"].push(path);
          
          // Specific card types
          if (k.includes('service')) idx.aliases["service card"].push(path);
          if (k.includes('travel')) idx.aliases["travel card"].push(path);
          if (k.includes('why')) idx.aliases["why card"].push(path);
        }
      });
    }
    
    // Special handling for card background token
    if (design.tokens?.colors?.cardBackground) {
      const cardBgPath = 'designV2.tokens.colors.cardBackground';
      idx.paths.push({ id: 'tokens.colors.cardBackground', path: cardBgPath, category: 'color' });
      idx.aliases["card background"].push(cardBgPath);
      idx.aliases["cards background"].push(cardBgPath);
      idx.aliases["card"].push(cardBgPath);
      idx.aliases["card background (elements not section)"].push(cardBgPath);
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
        
        // Card-specific sections mapping
        if (s === 'whyFeatureCards') {
          idx.aliases["feature card"].push(backgroundPath);
          idx.aliases["why card"].push(backgroundPath);
          idx.aliases["card background"].push(backgroundPath);
          idx.aliases["card background (elements not section)"].push(backgroundPath);
          idx.aliases["cards background"].push(backgroundPath);
          idx.aliases["card"].push(backgroundPath);
          idx.aliases["cards section"].push(layoutPath);
        } else if (s.includes('card') || s.includes('feature')) {
          // Generic card sections (less specific)
          idx.aliases["cards section"].push(layoutPath);
          idx.aliases["card background"].push(backgroundPath);
          idx.aliases["card background (elements not section)"].push(backgroundPath);
          idx.aliases["cards background"].push(backgroundPath);
        }
      });
    }
    
    // Add FAQ Card components to index
    if (design.components?.faqCard) {
      // FAQ Card Container
      if (design.components.faqCard.container) {
        const faqCardPath = 'designV2.components.faqCard.container';
        idx.paths.push({ id: 'components.faqCard.container', path: faqCardPath, category: 'component' });
        idx.aliases["faq card"].push(faqCardPath);
        idx.aliases["faq background"].push('designV2.components.faqCard.container.backgroundColor');
        idx.aliases["faq border card"].push('designV2.components.faqCard.container.borderColor');
        idx.aliases["faq shadow"].push('designV2.components.faqCard.container.shadow');
      }
      
      // FAQ Card Question
      if (design.components.faqCard.question) {
        const faqQuestionPath = 'designV2.components.faqCard.question';
        idx.paths.push({ id: 'components.faqCard.question', path: faqQuestionPath, category: 'component' });
        idx.aliases["faq question"].push(faqQuestionPath);
        idx.aliases["faq question background"].push('designV2.components.faqCard.question.backgroundColor');
      }
      
      // FAQ Card Answer
      if (design.components.faqCard.answer) {
        const faqAnswerPath = 'designV2.components.faqCard.answer';
        idx.paths.push({ id: 'components.faqCard.answer', path: faqAnswerPath, category: 'component' });
        idx.aliases["faq answer"].push(faqAnswerPath);
        idx.aliases["faq answer background"].push('designV2.components.faqCard.answer.backgroundColor');
        idx.aliases["faq body"].push(faqAnswerPath);
        idx.aliases["faq body background"].push('designV2.components.faqCard.answer.backgroundColor');
      }
      
      // FAQ Card Chevron
      if (design.components.faqCard.chevron) {
        const faqChevronPath = 'designV2.components.faqCard.chevron';
        const faqChevronBgPath = 'designV2.components.faqCard.chevron.backgroundColor';
        const faqChevronIconPath = 'designV2.components.faqCard.chevron.iconColor';
        
        idx.paths.push({ id: 'components.faqCard.chevron', path: faqChevronPath, category: 'component' });
        idx.aliases["faq chevron"].push(faqChevronPath);
        idx.aliases["faq arrow"].push(faqChevronPath);
        idx.aliases["faq chevron background"].push(faqChevronBgPath);
        idx.aliases["faq arrow background"].push(faqChevronBgPath);
        idx.aliases["faq chevron icon"].push(faqChevronIconPath);
        idx.aliases["faq arrow icon"].push(faqChevronIconPath);
      }
      
      // FAQ Card Divider
      if (design.components.faqCard.divider) {
        const faqDividerPath = 'designV2.components.faqCard.divider';
        const faqDividerColorPath = 'designV2.components.faqCard.divider.color';
        
        idx.paths.push({ id: 'components.faqCard.divider', path: faqDividerPath, category: 'component' });
        idx.aliases["faq border"].push(faqDividerPath);
        idx.aliases["faq line"].push(faqDividerColorPath);
        idx.aliases["faq inner line"].push(faqDividerColorPath);
        idx.aliases["faq divider"].push(faqDividerColorPath);
        idx.aliases["faq separator"].push(faqDividerColorPath);
      }
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
  const [planValidation, setPlanValidation] = React.useState<{
    isExecutable: boolean;
    validSteps: number;
    totalSteps: number;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [jobs, setJobs] = React.useState<JobState[]>([]);
  const [result, setResult] = React.useState<any | null>(null);
  const [metadata, setMetadata] = React.useState<any | null>(null);
  const [lastRun, setLastRun] = React.useState<any | null>(null);
  
  // Configuration
  const [executorMode, setExecutorMode] = React.useState<'single' | 'multipart'>('single');
  const [plannerModel, setPlannerModel] = React.useState<ModelRef>({ provider: 'openrouter', id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' });
  
  // Preview management
  const [previewBackup, setPreviewBackup] = React.useState<any>(null);
  const [sessionBackup, setSessionBackup] = React.useState<any>(null); // Backup created at start of AI session
  const [lastPrompt, setLastPrompt] = React.useState<string>('');
  const [lastArgs, setLastArgs] = React.useState<any>(null);
  


  const reset = React.useCallback(() => {
    setState('idle');
    setPlanTimeMs(null);
    setPlan(null);
    setPlanValidation(null);
    setJobs([]);
    setResult(null);
    setMetadata(null);
    setError(null);
    setPreviewBackup(null);
    setSessionBackup(null);
    setLastPrompt('');
    setLastArgs(null);
    console.log('🔄 AI context reset');
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

  // 🔍 PathFinder: Validate plan executability
  const validatePlanWithPathFinder = React.useCallback((plan: any, currentDesign: any) => {
    if (!plan?.steps || !Array.isArray(plan.steps)) {
      return {
        isExecutable: false,
        validSteps: 0,
        totalSteps: 0,
        errors: ['Plan has no steps array'],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    let validSteps = 0;

    for (const [index, step] of plan.steps.entries()) {
      if (!step.path) {
        errors.push(`Step ${index + 1}: Missing path property`);
        continue;
      }

      // Check if path exists in design
      const currentValue = getValueAtPath(step.path, currentDesign);
      if (currentValue === undefined) {
        errors.push(`Step ${index + 1}: Invalid path "${step.path}"`);
        continue;
      }

      // Check if we have instruction
      if (!step.instruction && !step.description) {
        warnings.push(`Step ${index + 1}: No clear instruction for path "${step.path}"`);
      }

      validSteps++;
    }

    const isExecutable = validSteps > 0 && errors.length === 0;

    return {
      isExecutable,
      validSteps,
      totalSteps: plan.steps.length,
      errors,
      warnings
    };
  }, []);

  // 🔍 PathFinder: Smart semantic path resolution
  const findPaths = React.useCallback((prompt: string, currentDesign: any) => {
    const idx = buildIndexFromDesign(currentDesign);
    const foundPaths: Array<{
      path: string;
      currentValue: any;
      context: string;
      confidence: number;
    }> = [];

    // Simple keyword matching for now (can be enhanced with AI later)
    const keywords = prompt.toLowerCase().split(' ');
    
    // Check aliases for matches
    for (const [alias, paths] of Object.entries(idx.aliases)) {
      const aliasWords = alias.toLowerCase().split(' ');
      const matchScore = aliasWords.filter(word => keywords.includes(word)).length / aliasWords.length;
      
      if (matchScore > 0.5) { // 50% keyword match threshold
        for (const path of paths) {
          const currentValue = getValueAtPath(path, currentDesign);
          if (currentValue !== undefined) {
            foundPaths.push({
              path,
              currentValue,
              context: alias,
              confidence: matchScore
            });
          }
        }
      }
    }

    // Sort by confidence score
    return foundPaths.sort((a, b) => b.confidence - a.confidence);
  }, []);

  // Helper to get value at a specific path
  const getValueAtPath = (path: string, obj: any): any => {
    try {
      const parts = path.replace('designV2.', '').split('.');
      let current = obj;
      
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return undefined;
        }
      }
      return current;
    } catch {
      return undefined;
    }
  };

  // 🎯 Micro-Executor: Process single property changes
  const runMicroExecutor = React.useCallback(async (args: {
    path: string;
    currentValue: any;
    instruction: string;
    context: string;
    modelExec: ModelRef;
  }) => {
    const { path, currentValue, instruction, context, modelExec } = args;

    console.log(`🎯 Micro-executing: ${path}`);
    
    try {
      const response = await fetch(`${AI_API_BASE}/ai-enhance-single-shot`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designData: { [path]: currentValue }, // Only send the specific property
          prompt: `Change ${context}: ${instruction}. Current value: ${JSON.stringify(currentValue)}. Return only the new value.`,
          aiModel: modelExec.id || 'google/gemini-2.5-flash-lite'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.enhancedData?.[path] || currentValue;
    } catch (error) {
      console.error(`❌ Micro-executor failed for ${path}:`, error);
      throw error;
    }
  }, [AI_API_BASE]);

  // 🔄 Apply path changes to design
  const applyPathChanges = React.useCallback((currentDesign: any, changes: Array<{ path: string; newValue: any }>) => {
    const newDesign = JSON.parse(JSON.stringify(currentDesign)); // Deep clone
    
    for (const { path, newValue } of changes) {
      const parts = path.replace('designV2.', '').split('.');
      let current = newDesign;
      
      // Navigate to parent of target property
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      
      // Set the new value
      current[parts[parts.length - 1]] = newValue;
    }
    
    return newDesign;
  }, []);

  // Pre-validate paths in the plan before sending to executor
  const validatePlanPaths = React.useCallback((plan: any, currentDesign: any) => {
    // Helper to check if a path exists in the design object
    const checkPathExists = (path: string, obj: any): boolean => {
      try {
        const parts = path.replace('designV2.', '').split('.');
        let current = obj;
        
        for (const part of parts) {
          if (current && typeof current === 'object' && part in current) {
            current = current[part];
          } else {
            return false;
          }
        }
        return true;
      } catch {
        return false;
      }
    };

    if (!plan?.steps || !Array.isArray(plan.steps)) {
      return { valid: false, errors: ['Plan has no steps array'] };
    }

    const errors: string[] = [];
    const validatedSteps: any[] = [];

    for (const step of plan.steps) {
      if (!step.path) {
        errors.push(`Step missing path: ${JSON.stringify(step)}`);
        continue;
      }

      // Check if path exists in currentDesign
      const pathExists = checkPathExists(step.path, currentDesign);
      if (!pathExists) {
        errors.push(`Invalid path: ${step.path}`);
        continue;
      }

      validatedSteps.push(step);
    }

    return {
      valid: errors.length === 0,
      errors,
      validatedSteps,
      originalStepCount: plan.steps.length,
      validStepCount: validatedSteps.length
    };
  }, []);
  
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
    
    // Go back to plan_ready if we have a plan, otherwise idle
    if (plan?.plan) {
      setState('plan_ready');
      console.log('❌ Preview rejected, returned to plan ready');
    } else {
      setState('idle');
    }
    
    setResult(null);
    setPreviewBackup(null);
  }, [state, previewBackup, plan]);
  
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
    
    // Create session backup when starting AI process
    if (!sessionBackup) {
      const backup = JSON.parse(JSON.stringify(currentDesign));
      setSessionBackup(backup);
      console.log('💾 Session backup created');
    }
    
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
      
      // 🔍 VALIDATE PLAN WITH PATHFINDER
      console.log('🔍 Validating plan with PathFinder...');
      const validation = validatePlanWithPathFinder(json, currentDesign);
      setPlanValidation(validation);
      
      if (validation.isExecutable) {
        console.log(`✅ Plan is executable: ${validation.validSteps}/${validation.totalSteps} steps valid`);
        if (validation.warnings.length > 0) {
          console.warn('⚠️ Plan warnings:', validation.warnings);
        }
      } else {
        console.error(`❌ Plan is NOT executable: ${validation.errors.length} errors found`);
        console.error('Errors:', validation.errors);
      }
      
      // Move to plan_ready state for user review (regardless of validation)
      setState('plan_ready');
      
    } catch (e: any) {
      const errorType: AIError['type'] = e.message.includes('Authentication') ? 'auth' :
                                         e.message.includes('network') ? 'network' : 'planner';
      setError(createError(errorType, `Planner failed: ${e.message}`, e.stack));
      setState('error');
    }
  }, [createError, plannerModel, AI_API_BASE, validatePlanWithPathFinder]);

  const runExecutor = React.useCallback(async (args: {
    modelExec: ModelRef;
    currentDesign: any;
  }) => {
    const { modelExec, currentDesign } = args;
    
    if (!plan || state !== 'plan_ready') {
      setError(createError('validation', 'No plan available for execution'));
      return;
    }

    // 🔍 NEW PATHFINDER FLOW: Use micro-execution instead of full object processing
    console.log('🔍 Starting PathFinder-powered execution...');
    setState('executing');
    setJobs([]);

    try {
      if (!plan.steps || !Array.isArray(plan.steps)) {
        throw new Error('Plan has no steps array');
      }

      const changes: Array<{ path: string; newValue: any }> = [];
      let processedSteps = 0;

      for (const step of plan.steps) {
        if (!step.path) {
          console.warn(`⚠️ Step missing path, skipping:`, step);
          continue;
        }

        // Validate path exists using PathFinder
        const currentValue = getValueAtPath(step.path, currentDesign);
        if (currentValue === undefined) {
          console.warn(`⚠️ Invalid path ${step.path}, skipping`);
          continue;
        }

        console.log(`🎯 Processing step ${processedSteps + 1}: ${step.path}`);

        // Use micro-executor for this specific path
        try {
          const instruction = step.instruction || step.description || lastPrompt;
          const newValue = await runMicroExecutor({
            path: step.path,
            currentValue,
            instruction,
            context: step.context || 'design property',
            modelExec
          });

          changes.push({ path: step.path, newValue });
          processedSteps++;
          
        } catch (stepError: any) {
          console.error(`❌ Failed to process ${step.path}:`, stepError);
          // Continue with other steps instead of failing entirely
        }
      }

      if (changes.length === 0) {
        throw new Error('No valid changes could be processed');
      }

      // Apply all changes to design
      const updatedDesign = applyPathChanges(currentDesign, changes);

      console.log(`✅ PathFinder execution complete: ${changes.length} changes applied`);
      console.log('📝 Changes:', changes.map(c => ({ path: c.path, newValue: c.newValue })));

      // Update result and move to results_ready state
      setResult({ enhancedData: updatedDesign });
      setState('results_ready');

      // Update metadata
      setMetadata({
        totalTimeMs: Date.now() - (new Date().getTime()),
        chunksPlanned: plan.steps.length,
        chunksSucceeded: changes.length,
        chunksFailed: plan.steps.length - changes.length,
        pathfinderMode: true
      });
      
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
  }, [createError, plan, state, lastPrompt, jobs, AI_API_BASE, validatePlanPaths]);

  // 🚀 NEW: Fast PathFinder-based execution (bypasses traditional planner)
  const runPathFinderExecution = React.useCallback(async (args: {
    prompt: string;
    modelExec: ModelRef;
    currentDesign: any;
  }) => {
    const { prompt, modelExec, currentDesign } = args;

    console.log('🔍 Starting PathFinder execution...');
    setState('executing');
    setError(null);

    try {
      // 1. Find relevant paths using PathFinder
      const foundPaths = findPaths(prompt, currentDesign);
      
      if (foundPaths.length === 0) {
        setError(createError('validation', 'No matching paths found for your request'));
        setState('error');
        return;
      }

      console.log(`🎯 Found ${foundPaths.length} potential paths:`, foundPaths.map(p => ({ path: p.path, confidence: p.confidence })));

      // 2. Process changes using micro-executor (for now, just take top match)
      const topPath = foundPaths[0];
      console.log(`🎯 Processing top match: ${topPath.path} (confidence: ${topPath.confidence})`);

      const newValue = await runMicroExecutor({
        path: topPath.path,
        currentValue: topPath.currentValue,
        instruction: prompt,
        context: topPath.context,
        modelExec
      });

      // 3. Apply changes to design
      const updatedDesign = applyPathChanges(currentDesign, [{ 
        path: topPath.path, 
        newValue 
      }]);

      console.log(`✅ PathFinder execution complete: ${topPath.path} = ${JSON.stringify(newValue)}`);

      // Update result and move to results_ready state
      setResult({ enhancedData: updatedDesign });
      setState('results_ready');

    } catch (error: any) {
      console.error('❌ PathFinder execution failed:', error);
      setError(createError('executor', `PathFinder execution failed: ${error.message}`));
      setState('error');
    }
  }, [findPaths, runMicroExecutor, applyPathChanges, createError]);

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
    planValidation,
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
    sessionBackup,
    lastPrompt,
    
    // Actions - 2-stage manual workflow
    runPlanner,
    runExecutor,
    runPathFinderExecution, // 🚀 NEW: Fast PathFinder execution
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


