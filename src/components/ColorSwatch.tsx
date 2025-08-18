import React from 'react';
import ColorPalette from './ColorPalette';

interface ColorSwatchProps {
  value: string;
  onChange: (color: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ value, onChange, placeholder, style }) => {
  const [showPalette, setShowPalette] = React.useState(false);
  const colorInputRef = React.useRef<HTMLInputElement>(null);

  const handleSwatchClick = () => {
    setShowPalette(!showPalette);
  };

  const handleColorPickerClick = () => {
    if (colorInputRef.current) {
      colorInputRef.current.click();
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handlePaletteColorSelect = (color: string) => {
    onChange(color);
  };

  return (
    <div style={{ position: 'relative', ...style }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Text input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            background: '#1b1b1b',
            color: '#fff',
            padding: '8px 60px 8px 8px',
            borderRadius: 6,
            border: '1px solid #2a2a2a',
            width: '100%',
          }}
        />
        
        {/* Color picker button */}
        <div
          onClick={handleColorPickerClick}
          style={{
            position: 'absolute',
            right: 36,
            width: 20,
            height: 20,
            borderRadius: 3,
            border: '1px solid #3a3a3a',
            backgroundColor: value || 'transparent',
            backgroundImage: !value ? 'linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)' : 'none',
            backgroundSize: !value ? '4px 4px' : 'auto',
            backgroundPosition: !value ? '0 0, 0 2px, 2px -2px, -2px 0px' : 'auto',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!value && <span style={{ fontSize: 8, color: '#999', mixBlendMode: 'difference' }}>◯</span>}
        </div>
        
        {/* Palette toggle button */}
        <button
          onClick={handleSwatchClick}
          style={{
            position: 'absolute',
            right: 8,
            width: 24,
            height: 24,
            background: showPalette ? '#2a2a2a' : 'transparent',
            border: '1px solid #3a3a3a',
            borderRadius: 3,
            color: '#666',
            cursor: 'pointer',
            fontSize: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Brand colors"
        >
          ⋯
        </button>

        {/* Hidden color picker */}
        <input
          ref={colorInputRef}
          type="color"
          value={value || '#000000'}
          onChange={handleColorChange}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        />
      </div>

      {/* Color palette dropdown */}
      {showPalette && (
        <ColorPalette
          currentColor={value}
          onColorSelect={handlePaletteColorSelect}
          onClose={() => setShowPalette(false)}
        />
      )}
    </div>
  );
};

export default ColorSwatch;
