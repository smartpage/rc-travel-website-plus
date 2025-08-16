import React from 'react';
import { useLocation } from 'react-router-dom';
import DesignInspectorOverlay from './DesignInspectorOverlay';
import SectionNavigator from './SectionNavigator';

const EditorPanelsWrapper: React.FC = () => {
  const location = useLocation();
  const query = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const enabled = query.get('design') === '1' || query.get('design') === 'true';

  if (!enabled) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 12,
      right: 12,
      zIndex: 1000,
      width: 340,
      maxHeight: 'calc(100vh - 24px)', // Max 100vh minus top/bottom margins
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      alignItems: 'flex-start', // Align to top
    }}>
      {/* Design Inspector - flex-shrink allows it to get smaller when needed */}
      <div style={{ 
        width: '100%', 
        minHeight: 0, // Allow shrinking
        display: 'flex',
        flexDirection: 'column'
      }}>
        <DesignInspectorOverlay />
      </div>

      {/* Section Navigator - flex-shrink allows it to get smaller when needed */}
      <div style={{ 
        width: '100%', 
        minHeight: 0, // Allow shrinking
        flex: '1 1 auto', // Take remaining space but can shrink
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden' // Prevent overflow, let internal scrolling handle it
      }}>
        <SectionNavigator />
      </div>
    </div>
  );
};

export default EditorPanelsWrapper;
