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

  // Border radius → rem by default
  if (labelLower.includes('borderradius') || labelLower.includes('border-radius') || labelLower === 'radius') {
    return {
      step: 0.25,
      min: 0,
      max: 20,
      formatter: (val: number) => `${val}rem`,
      parser: (str: string) => parseFloat(str.replace('rem', '')) || 0
    };
  }

  // Border width → 1px steps
  if (labelLower.includes('borderwidth') || labelLower.includes('border-width')) {
    return {
      step: 1,
      min: 0,
      max: 100,
      formatter: (val: number) => `${Math.round(val)}px`,
      parser: (str: string) => parseFloat(str.replace('px', '')) || 0
    };
  }

  // Width/Height family → px by default
  if (
    labelLower.includes('width') ||
    labelLower.includes('height') ||
    labelLower.includes('maxwidth') ||
    labelLower.includes('minwidth') ||
    labelLower.includes('maxheight') ||
    labelLower.includes('minheight')
  ) {
    return {
      step: 10,
      min: 0,
      max: 4000,
      formatter: (val: number) => `${Math.round(val)}px`,
      parser: (str: string) => parseFloat(str.replace('px', '')) || 0
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
  let config = getStepConfig(label);

  // Helper: parse all numeric tokens (with optional units) with positions
  const parseNumericTokens = (input: string) => {
    const tokens: { start: number; end: number; num: number; unit: string }[] = [];
    const re = /(-?\d+(?:\.\d+)?)([a-z%]*)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null) {
      const num = parseFloat(m[1]);
      const unit = m[2] || '';
      if (!isNaN(num)) tokens.push({ start: m.index, end: m.index + m[0].length, num, unit });
    }
    return tokens;
  };

  const stepForUnit = (unit: string) => {
    const u = unit.toLowerCase();
    if (u === 'rem' || u === 'em') return { step: 0.25, min: -100, max: 100, format: (v: number) => `${v}${u}` };
    // Use 1px step for border widths, 10px for other px values
    if (u === 'px') {
      const isBorderWidth = label.toLowerCase().includes('borderwidth') || label.toLowerCase().includes('border-width');
      const step = isBorderWidth ? 1 : 10;
      return { step, min: -10000, max: 10000, format: (v: number) => `${Math.round(v)}px` };
    }
    if (u === '%') return { step: 5, min: -1000, max: 1000, format: (v: number) => `${v}%` };
    if (u === 'vh' || u === 'vw') return { step: 1, min: -1000, max: 1000, format: (v: number) => `${v}${u}` };
    // Unknown/empty unit → fall back to numeric default preserving unit
    return { step: config.step, min: -10000, max: 10000, format: (v: number) => `${v}${u}` };
  };

  // If value already contains a unit, adapt step/formatter to preserve it
  const match = typeof value === 'string' ? value.trim().match(/^(-?\d+(?:\.\d+)?)([a-z%]+)$/) : null;
  if (match) {
    const unit = match[2];
    const u = stepForUnit(unit);
    config = {
      step: u.step,
      min: u.min,
      max: u.max,
      formatter: (val: number) => u.format(val),
      parser: (str: string) => parseFloat(str.replace(unit, '')) || 0
    } as any;
  }
  
  const inputRef = React.useRef<HTMLInputElement>(null);

  const increment = () => {
    const tokens = parseNumericTokens(value);
    if (tokens.length === 0) {
      const currentValue = config.parser(value);
      const newValue = Math.min(currentValue + config.step, config.max);
      onChange(config.formatter(newValue));
      return;
    }
    const caret = inputRef.current ? inputRef.current.selectionStart ?? value.length : value.length;
    let idx = tokens.findIndex(t => caret >= t.start && caret <= t.end);
    if (idx < 0) idx = tokens.length - 1;
    const t = tokens[idx];
    const unitCfg = stepForUnit(t.unit);
    const next = Math.min(t.num + unitCfg.step, unitCfg.max);
    const formatted = unitCfg.format(next);
    const updated = value.slice(0, t.start) + formatted + value.slice(t.end);
    onChange(updated);
  };
  
  const decrement = () => {
    const tokens = parseNumericTokens(value);
    if (tokens.length === 0) {
      const currentValue = config.parser(value);
      const newValue = Math.max(currentValue - config.step, config.min);
      onChange(config.formatter(newValue));
      return;
    }
    const caret = inputRef.current ? inputRef.current.selectionStart ?? value.length : value.length;
    let idx = tokens.findIndex(t => caret >= t.start && caret <= t.end);
    if (idx < 0) idx = tokens.length - 1;
    const t = tokens[idx];
    const unitCfg = stepForUnit(t.unit);
    const next = Math.max(t.num - unitCfg.step, unitCfg.min);
    const formatted = unitCfg.format(next);
    const updated = value.slice(0, t.start) + formatted + value.slice(t.end);
    onChange(updated);
  };
  
  // Show arrows if label suggests numeric OR value contains any numeric token
  const numericLabelRegex = /(font(weight|size)|line(height)|letter(spacing)|padding|margin|border(radius|width|height)?|(^|\.)?(width|max|min|height|gap)|opacity|scale|translate|rotate|zindex)/i;
  const hasNumericTokens = parseNumericTokens(value).length > 0;
  const isNumericField = numericLabelRegex.test(label) || hasNumericTokens;
  
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
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
