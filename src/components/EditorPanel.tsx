import React from 'react';
import { useEditorOverlay } from '@/contexts/EditorOverlayContext';

interface EditorPanelProps {
  id: 'inspector' | 'navigator';
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ id, title, subtitle, children }) => {
  const { collapsed, toggleCollapse } = useEditorOverlay();
  const isCollapsed = collapsed[id];

  return (
    <>
      <button
        onClick={() => toggleCollapse(id)}
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
          marginBottom: isCollapsed ? 0 : 8
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isCollapsed ? '#2a2a2a' : '#3a3a3a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isCollapsed ? '#1a1a1a' : '#2a2a2a';
        }}
      >
        <span>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>{subtitle}</span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>{isCollapsed ? '↓' : '↑'}</span>
        </div>
      </button>
      
      {!isCollapsed && (
        <div style={{ 
          padding: '0 12px 12px 12px',
          overflow: 'auto',
          flex: '1 1 auto',
          minHeight: 0
        }}>
          {children}
        </div>
      )}
    </>
  );
};

export default EditorPanel;
