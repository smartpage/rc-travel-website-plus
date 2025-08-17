import React from 'react';
import { useEditorOverlay } from '@/contexts/EditorOverlayContext';

const SelectionOverlay: React.FC = () => {
  const { overlayRect, activeElement } = useEditorOverlay();

  if (!overlayRect) return null;

  const { top, left, width, height } = overlayRect;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 950,
      }}
    >
      <div
        style={{
          position: 'absolute',
          transform: `translate(${left}px, ${top}px)`,
          width,
          height,
          border: '2px solid #7c3aed',
          borderRadius: 6,
          boxShadow: '0 0 0 2px rgba(124,58,237,0.2)',
        }}
      />
      {activeElement?.label && (
        <div
          style={{
            position: 'absolute',
            transform: `translate(${left}px, ${top - 28}px)`,
            background: '#7c3aed',
            color: '#fff',
            fontSize: 12,
            padding: '4px 8px',
            borderRadius: 6,
            boxShadow: '0 8px 16px rgba(0,0,0,0.35)',
            pointerEvents: 'none',
          }}
        >
          {activeElement.label}
        </div>
      )}
    </div>
  );
};

export default SelectionOverlay;


