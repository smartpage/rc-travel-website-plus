import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  style?: React.CSSProperties;
}

// Smart step detection based on CSS property type
const getStepConfig = (label: string) => {
  const labelLower = label.toLowerCase();
  
  if (labelLower.includes('fontweight') || labelLower.includes('font-weight')) {
    return {
      step: 100,
      min: 100,
      max: 900,
      formatter: (val: number) => val.toString(),
      parser: (str: string) => parseInt(str) || 400
    };
  }
  
  if (labelLower.includes('fontsize') || labelLower.includes('font-size')) {
    return {
      step: 0.125,
      min: 0.5,
      max: 10,
      formatter: (val: number) => `${val}rem`,
      parser: (str: string) => parseFloat(str.replace('rem', '')) || 1
    };
  }
  
  if (labelLower.includes('lineheight') || labelLower.includes('line-height')) {
    return {
      step: 0.125,
      min: 0.5,
      max: 3,
      formatter: (val: number) => val.toString(),
      parser: (str: string) => parseFloat(str) || 1.5
    };
  }
  
  if (labelLower.includes('letterspacing') || labelLower.includes('letter-spacing')) {
    return {
      step: 0.025,
      min: -0.1,
      max: 0.2,
      formatter: (val: number) => `${val}em`,
      parser: (str: string) => parseFloat(str.replace('em', '')) || 0
    };
  }
  
  if (labelLower.includes('padding') || labelLower.includes('margin')) {
    return {
      step: 0.25,
      min: 0,
      max: 20,
      formatter: (val: number) => `${val}rem`,
      parser: (str: string) => parseFloat(str.replace('rem', '')) || 0
    };
  }
  
  // Default for other numeric values
  return {
    step: 0.1,
    min: 0,
    max: 100,
    formatter: (val: number) => val.toString(),
    parser: (str: string) => parseFloat(str) || 0
  };
};

const SmartInput: React.FC<SmartInputProps> = ({
  value,
  onChange,
  placeholder,
  label,
  style
}) => {
  const config = getStepConfig(label);
  
  const increment = () => {
    const currentValue = config.parser(value);
    const newValue = Math.min(currentValue + config.step, config.max);
    onChange(config.formatter(newValue));
  };
  
  const decrement = () => {
    const currentValue = config.parser(value);
    const newValue = Math.max(currentValue - config.step, config.min);
    onChange(config.formatter(newValue));
  };
  
  const isNumericField = ['fontweight', 'fontsize', 'lineheight', 'letterspacing', 'padding', 'margin'].some(
    type => label.toLowerCase().includes(type)
  );
  
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          ...style,
          paddingRight: isNumericField ? '40px' : '8px', // Make room for arrows
          width: '100%',
          outline: 'none', // Remove ugly focus outline
          border: '1px solid #2a2a2a'
        }}
        onFocus={(e) => {
          e.target.style.border = '1px solid #3a3a3a';
        }}
        onBlur={(e) => {
          e.target.style.border = '1px solid #2a2a2a';
        }}
      />
      {isNumericField && (
        <div style={{
          position: 'absolute',
          right: '4px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1px'
        }}>
          <button
            onClick={increment}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '2px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
            title={`+${config.step}`}
          >
            <ChevronUp size={12} />
          </button>
          <button
            onClick={decrement}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '2px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
            title={`-${config.step}`}
          >
            <ChevronDown size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SmartInput;
