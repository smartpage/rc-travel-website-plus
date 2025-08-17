import React from 'react';
import { useDesign } from '@/contexts/DesignContext';
import { useContent } from '@/contexts/ContentContext';
import EditorPanel from './EditorPanel';
import DesignInspectorContent from './DesignInspectorContent';
import SectionNavigatorContent from './SectionNavigatorContent';
import { useEditorOverlay } from '@/contexts/EditorOverlayContext';
import SelectionOverlay from '@/components/SelectionOverlay';

const EditorPanelsWrapper: React.FC = () => {
  const { design } = useDesign();
  const overlay = useEditorOverlay();
  const { collapsed, enabled } = overlay;
  const { siteIndex } = useContent();

  if (!enabled) return null;
  const navigableCount = React.useMemo(() => {
    if (!siteIndex) return 0;
    return siteIndex.sections.filter((section: any) =>
      section.isActive && !section.component.includes('Navigation') && section.component !== 'Footer'
    ).length;
  }, [siteIndex]);



  return (
    <div style={{
      position: 'fixed',
      top: 12,
      right: 12,
      zIndex: 1000,
      width: 340,
      height: 'auto',
      maxHeight: 'calc(100vh - 24px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      alignItems: 'flex-start',
      background: design?.colors?.background,
      padding: 12,
      borderRadius: 8,
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      overflow: 'auto'
    }} data-overlay-ui="1">
      {/* Selection Overlay */}
      <SelectionOverlay />
      {/* Design Inspector */}
      <div style={{ 
        width: '100%', 
        display: 'flex',
        flexDirection: 'column',
        transition: 'max-height 0.3s ease, opacity 0.2s ease',
        maxHeight: collapsed.inspector ? 60 : 9999,
        opacity: collapsed.inspector ? 0.7 : 1,
        overflow: 'hidden'
      }}>
        <EditorPanel id="inspector" title="Design Inspector" subtitle="API-only">
          <DesignInspectorContent />
        </EditorPanel>
      </div>

      {/* Section Navigator */}
      <div style={{ 
        width: '100%', 
        display: 'flex',
        flexDirection: 'column',
        transition: 'max-height 0.3s ease, opacity 0.2s ease',
        maxHeight: collapsed.navigator ? 60 : 9999,
        opacity: collapsed.navigator ? 0.7 : 1,
        overflow: 'hidden'
      }}>
        <EditorPanel id="navigator" title="Section Navigator" subtitle={`${navigableCount} sections`}>
          <SectionNavigatorContent />
        </EditorPanel>
      </div>
    </div>
  );
};

export default EditorPanelsWrapper;
