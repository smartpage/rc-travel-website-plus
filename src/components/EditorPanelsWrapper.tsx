import React from 'react';
import { useDesign } from '@/contexts/DesignContext';
import { useContent } from '@/contexts/ContentContext';
import EditorPanel from './EditorPanel';
import DesignInspectorContent from './DesignInspectorContent';
import SectionNavigatorContent from './SectionNavigatorContent';
import AIEnhancePanel from './AIEnhancePanel';
import { AIEnhanceProvider } from '@/contexts/AIEnhanceContext';
import { useEditorOverlay } from '@/contexts/EditorOverlayContext';
import DesignSaveHeader from './DesignSaveHeader';

import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

const EditorPanelsWrapper: React.FC = () => {
  const { design } = useDesign();
  const overlay = useEditorOverlay();
  const { collapsed, enabled, panelCorner, togglePanelHorizontal, togglePanelVertical } = overlay;
  const { siteIndex } = useContent();

  if (!enabled) return null;
  const navigableCount = React.useMemo(() => {
    if (!siteIndex) return 0;
    return siteIndex.sections.filter((section: any) =>
      section.isActive && !section.component.includes('Navigation') && section.component !== 'Footer'
    ).length;
  }, [siteIndex]);

  const isTop = panelCorner.startsWith('top');
  const isLeft = panelCorner.endsWith('left');

  const positionStyle: React.CSSProperties = {
    position: 'fixed',
    ...(isTop ? { top: 12 } : { bottom: 12 }),
    ...(isLeft ? { left: 12 } : { right: 12 }),
    zIndex: 1000,
    width: 425,
    height: 'auto',
    maxHeight: 'calc(100vh - 24px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    background: 'rgba(0,0,0,0.90)',
    padding: 12,
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    overflow: 'visible'
  };

  const tinyButtonBase: React.CSSProperties = {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f0f0f',
    color: '#a1a1aa',
    border: '1px solid #2a2a2a',
    boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
    cursor: 'pointer',
    opacity: 0.9,
  };

  // Horizontal toggle chevron: placed on the side we can move towards
  const horizBtnStyle: React.CSSProperties = {
    ...tinyButtonBase,
    top: '50%',
    transform: 'translateY(-50%)',
    ...(isLeft ? { right: -8 } : { left: -8 }),
  };

  // Vertical toggle chevron: placed on the opposite vertical side
  const vertBtnStyle: React.CSSProperties = {
    ...tinyButtonBase,
    left: '50%',
    transform: 'translateX(-50%)',
    ...(isTop ? { bottom: -8 } : { top: -8 }),
  };

  return (
    <div style={positionStyle} data-overlay-ui="1">
      {/* Tiny chevrons to move panel */}
      <button
        type="button"
        onClick={togglePanelHorizontal}
        aria-label={isLeft ? 'Dock to right' : 'Dock to left'}
        style={horizBtnStyle}
        data-overlay-ui="1"
      >
        {isLeft ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
      <button
        type="button"
        onClick={togglePanelVertical}
        aria-label={isTop ? 'Dock to bottom' : 'Dock to top'}
        style={vertBtnStyle}
        data-overlay-ui="1"
      >
        {isTop ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>
      {/* Scrollable content wrapper to preserve scroll while chevrons sit outside */}
      <div style={{ width: '100%', maxHeight: 'calc(100vh - 24px)', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>

        {/* AI Enhancement Panel - First Priority */}
        <div style={{ 
          width: '100%', 
          display: 'flex',
          flexDirection: 'column'
        }}>
          <AIEnhanceProvider>
            <EditorPanel id="ai-enhance" title="AI Enhancement" subtitle="Server-side AI">
              <AIEnhancePanel />
            </EditorPanel>
          </AIEnhanceProvider>
        </div>

        {/* Design */}
        <div style={{ 
          width: '100%', 
          display: 'flex',
          flexDirection: 'column'
        }}>
          <EditorPanel id="inspector" title="Design" subtitle="Tokens & Styles">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <DesignSaveHeader />
            </div>
            <DesignInspectorContent />
          </EditorPanel>
        </div>

        {/* Section Navigator */}
        <div style={{ 
          width: '100%', 
          display: 'flex',
          flexDirection: 'column'
        }}>
          <EditorPanel id="navigator" title="Section Navigator" subtitle={`${navigableCount} sections`}>
            <SectionNavigatorContent />
          </EditorPanel>
        </div>
      </div>
    </div>
  );
};

export default EditorPanelsWrapper;
