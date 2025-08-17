import React from 'react';
import { useLocation } from 'react-router-dom';
import { useDesign } from '@/contexts/DesignContext';
import { resolveGlobalTokens, takeComputedSnapshot } from '@/lib/tokenResolver';

type PanelId = 'inspector' | 'navigator';

type OverlayRect = { top: number; left: number; width: number; height: number } | null;

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
}

interface EditorOverlayContextValue extends EditorOverlayState {
  toggleCollapse: (panel: PanelId) => void;
  setCollapsed: (panel: PanelId, value: boolean) => void;
  setOverlayRect: (rect: OverlayRect) => void;
  setActiveElement: (info: ActiveElementInfo | null) => void;
  setViewport: (vp: 'desktop' | 'mobile') => void;
  setSelectedElement: (el: Element | null) => void;
  setScrollContainer: (el: HTMLElement | null) => void;
}

const EditorOverlayContext = React.createContext<EditorOverlayContextValue | undefined>(undefined);

export const EditorOverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { design } = useDesign();
  
  const enabled = React.useMemo(() => {
    const q = new URLSearchParams(location.search);
    return q.get('design') === '1' || q.get('design') === 'true';
  }, [location.search]);

  const [state, setState] = React.useState<EditorOverlayState>({
    collapsed: { inspector: false, navigator: false },
    overlayRect: null,
    activeElement: null,
    viewport: (sessionStorage.getItem('design_vp') as 'desktop' | 'mobile') || 'desktop',
    selectedElement: null,
    scrollContainer: null,
    enabled,
  });

  const toggleCollapse = (panel: PanelId) => {
    setState(prev => ({
      ...prev,
      collapsed: { ...prev.collapsed, [panel]: !prev.collapsed[panel] },
    }));
  };

  const setCollapsed = (panel: PanelId, value: boolean) => {
    setState(prev => ({ ...prev, collapsed: { ...prev.collapsed, [panel]: value } }));
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

  const setSelectedElement = (el: Element | null) => {
    setState(prev => ({ ...prev, selectedElement: el }));
  };

  const setScrollContainer = (el: HTMLElement | null) => {
    setState(prev => ({ ...prev, scrollContainer: el }));
  };

  // Update enabled state when location changes
  React.useEffect(() => {
    setState(prev => ({ ...prev, enabled }));
  }, [enabled]);

  // Main event handling logic - moved from EditorPanelsWrapper
  React.useEffect(() => {
    if (!enabled) return;

    const onMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Ignore overlay UI and anything outside the content container
      if (target.closest('[data-overlay-ui="1"]')) return;
      if (!target.closest('[class~="@container"]')) return;
      // If there is an active selection, do not update hover rect
      if (state.activeElement) return;
      // compute rect relative to viewport
      const rect = target.getBoundingClientRect();
      setState(prev => ({ ...prev, overlayRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height } }));
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-overlay-ui="1"]')) return;
      if (!target.closest('[class~="@container"]')) return;
      // Find closest section id
      const sectionEl = target.closest('[data-section-id]') as HTMLElement | null;
      const sectionId = sectionEl?.getAttribute('data-section-id') || null;
      const snap = takeComputedSnapshot(target);
      const tokenMatches = resolveGlobalTokens(snap, sectionId, design);
      const label = `${snap.tagName.toLowerCase()}${sectionId ? ` · ${sectionId}` : ''}`;
      const activeElement = { label, sectionId, tokenMatches };
      const rect = target.getBoundingClientRect();
      setState(prev => ({
        ...prev,
        activeElement,
        overlayRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        selectedElement: target
      }));
    };

    document.addEventListener('mousemove', onMove, { capture: true, passive: true } as any);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('mousemove', onMove, { capture: true } as any);
      document.removeEventListener('click', onClick, true);
    };
  }, [enabled, state.activeElement, design]);

  // Keep overlay rect in sync with selected element while scrolling/resizing
  React.useEffect(() => {
    if (!enabled) return;

    const updateRect = () => {
      const el = state.selectedElement as HTMLElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setState(prev => ({ ...prev, overlayRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height } }));
    };

    const onScroll = () => updateRect();
    const onResize = () => updateRect();

    // listen on window and the design container for scroll
    window.addEventListener('scroll', onScroll, true);
    const sc = state.scrollContainer;
    if (sc) sc.addEventListener('scroll', onScroll, { capture: true, passive: true } as any);
    window.addEventListener('resize', onResize, { capture: true, passive: true } as any);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      const sc = state.scrollContainer;
      if (sc) sc.removeEventListener('scroll', onScroll, { capture: true } as any);
      window.removeEventListener('resize', onResize, { capture: true } as any);
    };
  }, [enabled, state.selectedElement, state.scrollContainer]);

  const value: EditorOverlayContextValue = React.useMemo(() => ({
    collapsed: state.collapsed,
    overlayRect: state.overlayRect,
    activeElement: state.activeElement,
    viewport: state.viewport,
    selectedElement: state.selectedElement,
    scrollContainer: state.scrollContainer,
    enabled: state.enabled,
    toggleCollapse,
    setCollapsed,
    setOverlayRect,
    setActiveElement,
    setViewport,
    setSelectedElement,
    setScrollContainer,
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