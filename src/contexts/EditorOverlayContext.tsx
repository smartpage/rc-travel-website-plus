import React from 'react';

type PanelId = 'inspector' | 'navigator';

interface EditorOverlayState {
  collapsed: Record<PanelId, boolean>;
}

interface EditorOverlayContextValue extends EditorOverlayState {
  toggleCollapse: (panel: PanelId) => void;
  setCollapsed: (panel: PanelId, value: boolean) => void;
}

const EditorOverlayContext = React.createContext<EditorOverlayContextValue | undefined>(undefined);

export const EditorOverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<EditorOverlayState>({
    collapsed: { inspector: false, navigator: false },
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

  const value: EditorOverlayContextValue = React.useMemo(() => ({
    collapsed: state.collapsed,
    toggleCollapse,
    setCollapsed,
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