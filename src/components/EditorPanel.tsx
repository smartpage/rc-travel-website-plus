import React from 'react';
import { useEditorOverlay } from '@/contexts/EditorOverlayContext';

interface EditorPanelProps {
  id: 'inspector' | 'navigator' | 'ai-enhance';
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ id, title, subtitle, children }) => {
  const { activePanelId, togglePanel } = useEditorOverlay();
  const isCollapsed = activePanelId !== id;

  return (
    <>
      <button
        onClick={() => togglePanel(id)}
        style={{
          width: '100%',
          background: isCollapsed ? '#1a1a1a' : '#2a2a2a',
          border: '1px solid #3a3a3a',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.2s ease',
          marginBottom: isCollapsed ? 0 : 2,
          position: 'relative',
          zIndex: 2
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isCollapsed ? '#2a2a2a' : '#3a3a3a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isCollapsed ? '#1a1a1a' : '#2a2a2a';
        }}
        aria-expanded={!isCollapsed}
        aria-controls={`panel-${id}`}
      >
        <span>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>{subtitle}</span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>{isCollapsed ? '↓' : '↑'}</span>
        </div>
      </button>
      
      {!isCollapsed && (
        <div id={`panel-${id}`} style={{ 
          padding: '0 2px 12px 2px',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1
        }}>
          {children}
        </div>
      )}
    </>
  );
};

export default EditorPanel;
