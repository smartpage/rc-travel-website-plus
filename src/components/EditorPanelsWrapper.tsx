import React from 'react';
import { useLocation } from 'react-router-dom';
import { useDesign } from '@/contexts/DesignContext';
import { useContent } from '@/contexts/ContentContext';
import EditorPanel from './EditorPanel';
import DesignInspectorContent from './DesignInspectorContent';
import SectionNavigatorContent from './SectionNavigatorContent';
import { EditorOverlayProvider, useEditorOverlay } from '@/contexts/EditorOverlayContext';
import SelectionOverlay from '@/components/SelectionOverlay';
import { resolveGlobalTokens, takeComputedSnapshot } from '@/lib/tokenResolver';

const EditorPanelsWrapper: React.FC = () => {
  const location = useLocation();
  const { design } = useDesign();
  const query = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const enabled = query.get('design') === '1' || query.get('design') === 'true';

  if (!enabled) return null;

  const overlay = useEditorOverlay();
  const { collapsed } = overlay;
  const { siteIndex } = useContent();
  const navigableCount = React.useMemo(() => {
    if (!siteIndex) return 0;
    return siteIndex.sections.filter((section: any) =>
      section.isActive && !section.component.includes('Navigation') && section.component !== 'Footer'
    ).length;
  }, [siteIndex]);

  // Bind hover and click handlers to compute highlight and selection
  React.useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // If there is an active selection, do not update hover rect
      if (overlay.activeElement) return;
      const bounds = target.getBoundingClientRect();
      // Clamp within viewport
      overlay.setOverlayRect({ top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height });
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Find closest section id
      const sectionEl = target.closest('[data-section-id]') as HTMLElement | null;
      const sectionId = sectionEl?.getAttribute('data-section-id') || null;
      const snap = takeComputedSnapshot(target);
      const tokenMatches = resolveGlobalTokens(snap, sectionId, design);
      const label = `${snap.tagName.toLowerCase()}${sectionId ? ` · ${sectionId}` : ''}`;
      overlay.setActiveElement({ label, sectionId, tokenMatches });
      const bounds = target.getBoundingClientRect();
      overlay.setOverlayRect({ top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height });
    };
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('click', onClick, true);
    };
  }, [enabled, overlay.activeElement, design]);

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
    }}>
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

export default function EditorPanelsWrapperWithProvider() {
  return (
    <EditorOverlayProvider>
      <EditorPanelsWrapper />
    </EditorOverlayProvider>
  );
}
