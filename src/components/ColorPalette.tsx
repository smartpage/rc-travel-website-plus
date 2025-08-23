import React from 'react';
import { Trash2, Save } from 'lucide-react';
import { useEditorOverlay } from '@/contexts/EditorOverlayContext';

interface ColorPaletteProps {
  currentColor: string;
  onColorSelect: (color: string) => void;
  onClose: () => void;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ currentColor, onColorSelect, onClose }) => {
  const { colorPalette, saveColorToSlot, deleteColorFromSlot } = useEditorOverlay();

  const handleSaveToSlot = (slotIndex: number) => {
    if (currentColor) {
      saveColorToSlot(currentColor, slotIndex);
    }
  };

  const handleColorSelect = (color: string) => {
    onColorSelect(color);
    onClose();
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 4,
        background: '#1a1a1a',
        border: '1px solid #3a3a3a',
        borderRadius: 6,
        padding: 8,
        zIndex: 10001,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 4,
      }}
    >
      {colorPalette.map((color, index) => (
        <div
          key={index}
          style={{
            width: 32,
            height: 32,
            borderRadius: 4,
            border: '1px solid #3a3a3a',
            backgroundColor: color || '#1a1a1a',
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {color ? (
            <>
              {/* Color preview - clickable area */}
              <div
                onClick={() => handleColorSelect(color)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 3,
                  backgroundColor: color,
                }}
              />
              {/* Delete button */}
              <button
                onClick={() => deleteColorFromSlot(index)}
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 16,
                  height: 16,
                  background: '#ff4444',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                }}
                title="Delete color"
              >
                <Trash2 size={8} />
              </button>
            </>
          ) : (
            /* Save button for empty slot */
            <button
              onClick={() => handleSaveToSlot(index)}
              disabled={!currentColor}
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                color: currentColor ? '#666' : '#333',
                cursor: currentColor ? 'pointer' : 'not-allowed',
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={currentColor ? 'Save current color' : 'No color to save'}
            >
              <Save size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ColorPalette;
