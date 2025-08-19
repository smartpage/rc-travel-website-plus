import React from 'react';
import { useLocation } from 'react-router-dom';
import { useDesign } from '@/contexts/DesignContext';
import { resolveGlobalTokens, takeComputedSnapshot } from '@/lib/tokenResolver';

type PanelId = 'inspector' | 'navigator' | 'ai-enhance';

type OverlayRect = { top: number; left: number; width: number; height: number } | null;

// Docking position for the floating editor panels wrapper
type PanelCorner = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export type TokenMatch = {
  scope: 'global' | 'section';
  tokenPath: string; // e.g., "headings.fontSize" or "sections.hero.layout.padding.mobile"
  label: string;
  responsive?: boolean;
};

export interface ActiveElementInfo {
  label: string;
  sectionId: string | null;
  tokenMatches: TokenMatch[];
}

interface EditorOverlayState {
  collapsed: Record<PanelId, boolean>;
  overlayRect: OverlayRect;
  activeElement: ActiveElementInfo | null;
  viewport: 'desktop' | 'mobile';
  selectedElement: Element | null;
  scrollContainer: HTMLElement | null;
  enabled: boolean;
  panelCorner: PanelCorner;
  colorPalette: string[]; // 8 slots for brand colors, empty string = empty slot
}

interface EditorOverlayContextValue extends EditorOverlayState {
  toggleCollapse: (panel: PanelId) => void;
  setCollapsed: (panel: PanelId, value: boolean) => void;
  setOverlayRect: (rect: OverlayRect) => void;
  setActiveElement: (info: ActiveElementInfo | null) => void;
  setViewport: (vp: 'desktop' | 'mobile') => void;
  setSelectedElement: (el: Element | null) => void;
  setScrollContainer: (el: HTMLElement | null) => void;
  setPanelCorner: (corner: PanelCorner) => void;
  togglePanelHorizontal: () => void; // swap left/right
  togglePanelVertical: () => void;   // swap top/bottom
  saveColorToSlot: (color: string, slotIndex: number) => void;
  deleteColorFromSlot: (slotIndex: number) => void;
}

const EditorOverlayContext = React.createContext<EditorOverlayContextValue | undefined>(undefined);

export const EditorOverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { design } = useDesign();
  
  const enabled = React.useMemo(() => {
    const q = new URLSearchParams(location.search);
    return q.get('design') === '1' || q.get('design') === 'true';
  }, [location.search]);

  // Load collapsed states from localStorage
  const getInitialCollapsedState = (): Record<PanelId, boolean> => {
    try {
      const saved = localStorage.getItem('design_panel_collapsed');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Default: inspector open, navigator closed, ai-enhance open
        return {
          inspector: parsed.inspector ?? false,
          navigator: parsed.navigator ?? true,
          'ai-enhance': parsed['ai-enhance'] ?? false,
        };
      }
    } catch {}
    // Default: inspector open, navigator closed, ai-enhance open
    return { inspector: false, navigator: true, 'ai-enhance': false };
  };

  // Load color palette from localStorage
  // TODO: Load brand swatches from db.json.design.brandPalette structure
  const getInitialColorPalette = (): string[] => {
    try {
      const saved = localStorage.getItem('design_color_palette');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 8) {
          return parsed;
        }
      }
    } catch {}
    // Default: 8 empty slots
    return ['', '', '', '', '', '', '', ''];
  };

  const getInitialPanelCorner = (): PanelCorner => {
    try {
      const saved = localStorage.getItem('design_panel_corner');
      if (saved === 'top-right' || saved === 'top-left' || saved === 'bottom-right' || saved === 'bottom-left') {
        return saved;
      }
    } catch {}
    return 'top-right';
  };

  const [state, setState] = React.useState<EditorOverlayState>({
    collapsed: getInitialCollapsedState(),
    overlayRect: null,
    activeElement: null,
    viewport: (sessionStorage.getItem('design_vp') as 'desktop' | 'mobile') || 'desktop',
    selectedElement: null,
    scrollContainer: null,
    enabled,
    panelCorner: getInitialPanelCorner(),
    colorPalette: getInitialColorPalette(),
  });

  const toggleCollapse = (panel: PanelId) => {
    setState(prev => {
      const newCollapsed = { ...prev.collapsed, [panel]: !prev.collapsed[panel] };
      try {
        localStorage.setItem('design_panel_collapsed', JSON.stringify(newCollapsed));
      } catch {}
      return { ...prev, collapsed: newCollapsed };
    });
  };

  const setCollapsed = (panel: PanelId, value: boolean) => {
    setState(prev => {
      const newCollapsed = { ...prev.collapsed, [panel]: value };
      try {
        localStorage.setItem('design_panel_collapsed', JSON.stringify(newCollapsed));
      } catch {}
      return { ...prev, collapsed: newCollapsed };
    });
  };

  const setOverlayRect = (rect: OverlayRect) => {
    setState(prev => ({ ...prev, overlayRect: rect }));
  };

  const setActiveElement = (info: ActiveElementInfo | null) => {
    setState(prev => ({ ...prev, activeElement: info }));
    if (info && prevViewportRef.current) {
      // keep overlay rect locked to selection when one is active
    }
  };

  const setViewport = (vp: 'desktop' | 'mobile') => {
    try { sessionStorage.setItem('design_vp', vp); } catch {}
    setState(prev => ({ ...prev, viewport: vp }));
  };

  const prevViewportRef = React.useRef(state.viewport);
  React.useEffect(() => { prevViewportRef.current = state.viewport; }, [state.viewport]);

  // Refs for stable, low-churn event handlers
  const activeElementRef = React.useRef(state.activeElement);
  const selectedElementRef = React.useRef(state.selectedElement);
  const scrollContainerRef = React.useRef(state.scrollContainer);
  const designRef = React.useRef(design);
  React.useEffect(() => { activeElementRef.current = state.activeElement; }, [state.activeElement]);
  React.useEffect(() => { selectedElementRef.current = state.selectedElement; }, [state.selectedElement]);
  React.useEffect(() => { scrollContainerRef.current = state.scrollContainer; }, [state.scrollContainer]);
  React.useEffect(() => { designRef.current = design; }, [design]);

  const setSelectedElement = (el: Element | null) => {
    setState(prev => ({ ...prev, selectedElement: el }));
  };

  const setScrollContainer = React.useCallback((el: HTMLElement | null) => {
    setState(prev => {
      // Avoid triggering a state update if the value did not actually change
      if (prev.scrollContainer === el) return prev;
      return { ...prev, scrollContainer: el };
    });
  }, []);

  const setPanelCorner = (corner: PanelCorner) => {
    setState(prev => {
      try { localStorage.setItem('design_panel_corner', corner); } catch {}
      return { ...prev, panelCorner: corner };
    });
  };

  const togglePanelHorizontal = () => {
    setState(prev => {
      const next: PanelCorner = prev.panelCorner.includes('left')
        ? (prev.panelCorner.replace('left', 'right') as PanelCorner)
        : (prev.panelCorner.replace('right', 'left') as PanelCorner);
      try { localStorage.setItem('design_panel_corner', next); } catch {}
      return { ...prev, panelCorner: next };
    });
  };

  const togglePanelVertical = () => {
    setState(prev => {
      const next: PanelCorner = prev.panelCorner.includes('top')
        ? (prev.panelCorner.replace('top', 'bottom') as PanelCorner)
        : (prev.panelCorner.replace('bottom', 'top') as PanelCorner);
      try { localStorage.setItem('design_panel_corner', next); } catch {}
      return { ...prev, panelCorner: next };
    });
  };

  const saveColorToSlot = (color: string, slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= 8) return;
    setState(prev => {
      const newPalette = [...prev.colorPalette];
      newPalette[slotIndex] = color;
      try {
        localStorage.setItem('design_color_palette', JSON.stringify(newPalette));
      } catch {}
      return { ...prev, colorPalette: newPalette };
    });
  };

  const deleteColorFromSlot = (slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= 8) return;
    setState(prev => {
      const newPalette = [...prev.colorPalette];
      newPalette[slotIndex] = '';
      try {
        localStorage.setItem('design_color_palette', JSON.stringify(newPalette));
      } catch {}
      return { ...prev, colorPalette: newPalette };
    });
  };

  // Update enabled state when location changes
  React.useEffect(() => {
    setState(prev => ({ ...prev, enabled }));
  }, [enabled]);

  // Main event handling logic - gated by design mode, throttled with rAF
  React.useEffect(() => {
    if (!enabled) return;

    let rafId: number | null = null;
    let lastHoverEl: Element | null = null;

    const updateOverlayRect = (el: Element) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      setState(prev => {
        // Do not update hover rect when an element is selected
        if (prev.activeElement) return prev;
        const same =
          prev.overlayRect &&
          prev.overlayRect.top === rect.top &&
          prev.overlayRect.left === rect.left &&
          prev.overlayRect.width === rect.width &&
          prev.overlayRect.height === rect.height;
        if (same) return prev;
        return { ...prev, overlayRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height } };
      });
    };

    const onMove = (e: MouseEvent) => {
      const raw = e.target as HTMLElement | null;
      if (!raw) return;
      const target =
        (raw.closest('[data-typography]') as HTMLElement) ||
        (raw.closest('h1,h2,h3,h4,h5,h6') as HTMLElement) ||
        (raw.closest('p') as HTMLElement) ||
        (raw.closest('button,a') as HTMLElement) ||
        // Fallback: if container clicked, try to pick a semantic child within
        (raw.querySelector?.('h1,h2,h3,h4,h5,h6') as HTMLElement) ||
        (raw.querySelector?.('p') as HTMLElement) ||
        (raw.querySelector?.('button,a') as HTMLElement) ||
        raw;
      if (target.closest('[data-overlay-ui="1"]')) return;
      if (!target.closest('[class~="@container"]')) return;
      if (activeElementRef.current) return;
      if (lastHoverEl === target) return;
      lastHoverEl = target;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        updateOverlayRect(target);
        rafId = null;
      });
    };

    const onClick = (e: MouseEvent) => {
      const raw = e.target as HTMLElement | null;
      if (!raw) return;
      const target =
        (raw.closest('[data-typography]') as HTMLElement) ||
        (raw.closest('h1,h2,h3,h4,h5,h6') as HTMLElement) ||
        (raw.closest('p') as HTMLElement) ||
        (raw.closest('button,a') as HTMLElement) ||
        // Fallback: if container clicked, drill into first semantic descendant
        (raw.querySelector?.('h1,h2,h3,h4,h5,h6') as HTMLElement) ||
        (raw.querySelector?.('p') as HTMLElement) ||
        (raw.querySelector?.('button,a') as HTMLElement) ||
        raw;
      if (target.closest('[data-overlay-ui="1"]')) return;
      if (!target.closest('[class~="@container"]')) return;
      const sectionEl = target.closest('[data-section-id]') as HTMLElement | null;
      const sectionId = sectionEl?.getAttribute('data-section-id') || null;
      const snap = takeComputedSnapshot(target);
      const tokenMatches = resolveGlobalTokens(snap, sectionId, designRef.current, target);
      const label = `${target.tagName.toLowerCase()}${sectionId ? ` · ${sectionId}` : ''}`;
      const rect = target.getBoundingClientRect();
      setState(prev => ({
        ...prev,
        activeElement: { label, sectionId, tokenMatches },
        overlayRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        selectedElement: target
      }));
    };

    document.addEventListener('mousemove', onMove, { capture: true, passive: true } as any);
    document.addEventListener('click', onClick, true);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onMove, { capture: true } as any);
      document.removeEventListener('click', onClick, true);
    };
  }, [enabled]);

  // Keep overlay rect in sync with selected element while scrolling/resizing (throttled)
  React.useEffect(() => {
    if (!enabled) return;

    let rafId: number | null = null;
    const updateRect = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const el = selectedElementRef.current as HTMLElement | null;
        if (el) {
          const rect = el.getBoundingClientRect();
          setState(prev => {
            const same =
              prev.overlayRect &&
              prev.overlayRect.top === rect.top &&
              prev.overlayRect.left === rect.left &&
              prev.overlayRect.width === rect.width &&
              prev.overlayRect.height === rect.height;
            return same ? prev : { ...prev, overlayRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height } };
          });
        }
        rafId = null;
      });
    };

    const onScroll = () => updateRect();
    const onResize = () => updateRect();

    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize, { passive: true } as any);
    const sc = state.scrollContainer;
    if (sc) sc.addEventListener('scroll', onScroll, { capture: true, passive: true } as any);

    // Prime once in case we mounted with a selected element
    updateRect();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize as any);
      if (sc) sc.removeEventListener('scroll', onScroll, { capture: true } as any);
    };
  }, [enabled, state.scrollContainer]);

  // Keep token matches in sync when the design changes while an element is selected.
  // This ensures the inspector UI reflects the latest token mapping after edits.
  React.useEffect(() => {
    if (!enabled) return;
    const el = selectedElementRef.current as HTMLElement | null;
    if (!el || !state.activeElement) return;
    // Respect same gating rules used on selection
    if (el.closest('[data-overlay-ui="1"]')) return;
    if (!el.closest('[class~="@container"]')) return;
    const sectionEl = el.closest('[data-section-id]') as HTMLElement | null;
    const sectionId = sectionEl?.getAttribute('data-section-id') || null;
    const snap = takeComputedSnapshot(el);
    const nextMatches = resolveGlobalTokens(snap, sectionId, design, el);
    setState(prev => {
      if (!prev.activeElement) return prev;
      const prevMatches = prev.activeElement.tokenMatches;
      const same =
        prevMatches.length === nextMatches.length &&
        prevMatches.every((m, i) =>
          m.scope === nextMatches[i].scope &&
          m.tokenPath === nextMatches[i].tokenPath &&
          m.label === nextMatches[i].label &&
          !!m.responsive === !!nextMatches[i].responsive
        );
      if (same && prev.activeElement.sectionId === sectionId) return prev;
      return {
        ...prev,
        activeElement: {
          ...prev.activeElement,
          sectionId,
          tokenMatches: nextMatches,
        }
      };
    });
  }, [enabled, design, state.selectedElement]);

  const value: EditorOverlayContextValue = React.useMemo(() => ({
    collapsed: state.collapsed,
    overlayRect: state.overlayRect,
    activeElement: state.activeElement,
    viewport: state.viewport,
    selectedElement: state.selectedElement,
    scrollContainer: state.scrollContainer,
    enabled: state.enabled,
    panelCorner: state.panelCorner,
    colorPalette: state.colorPalette,
    toggleCollapse,
    setCollapsed,
    setOverlayRect,
    setActiveElement,
    setViewport,
    setSelectedElement,
    setScrollContainer,
    setPanelCorner,
    togglePanelHorizontal,
    togglePanelVertical,
    saveColorToSlot,
    deleteColorFromSlot,
  }), [state]);

  return (
    <EditorOverlayContext.Provider value={value}>{children}</EditorOverlayContext.Provider>
  );
};

export const useEditorOverlay = (): EditorOverlayContextValue => {
  const ctx = React.useContext(EditorOverlayContext);
  if (!ctx) throw new Error('useEditorOverlay must be used within EditorOverlayProvider');
  return ctx;
};