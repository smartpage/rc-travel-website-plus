import React from 'react';
import { Save as SaveIcon, Check, X } from 'lucide-react';
import { useDesign } from '@/contexts/DesignContext';
import { useEditorOverlay } from '@/contexts/EditorOverlayContext';
import { useAuth } from '@/contexts/AuthContext';

const DesignSaveHeader: React.FC = () => {
  const { isDirty, saving, lastSavedAt, autoSave, setAutoSave, saveDesignToDBV2, lastSaveOk, lastSaveError } = useDesign();
  const { enabled } = useEditorOverlay();
  const { isAuthorized } = useAuth();

  if (!enabled || !isAuthorized) return null;

  const onSave = async () => {
    if (saving) return;
    try { await saveDesignToDBV2(); } catch {}
  };

  const savedAtText = lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : '';
  const glow = isDirty && !saving;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-overlay-ui="1">
      <button
        type="button"
        onClick={onSave}
        aria-label="Save design"
        disabled={!isDirty || !!saving}
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: (!isDirty || saving) ? '#141414' : '#0b1220',
          color: (!isDirty || saving) ? '#6b7280' : '#f8fafc',
          border: glow ? '1px solid #16a34a' : '1px solid #2a2a2a',
          cursor: (!isDirty || saving) ? 'default' : 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
        data-overlay-ui="1"
      >
        <SaveIcon size={14} />
        {glow && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 6,
              // Marching-ants border using 4 repeating gradients
              background:
                'repeating-linear-gradient(90deg, rgba(22,163,74,1) 0 3px, rgba(22,163,74,0) 3px 6px) top left / 100% 1px no-repeat,\
                 repeating-linear-gradient(90deg, rgba(22,163,74,1) 0 3px, rgba(22,163,74,0) 3px 6px) bottom left / 100% 1px no-repeat,\
                 repeating-linear-gradient(0deg, rgba(22,163,74,1) 0 3px, rgba(22,163,74,0) 3px 6px) top left / 1px 100% no-repeat,\
                 repeating-linear-gradient(0deg, rgba(22,163,74,1) 0 3px, rgba(22,163,74,0) 3px 6px) top right / 1px 100% no-repeat',
              animation: 'ants 1.2s linear infinite'
            }}
          />
        )}
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} data-overlay-ui="1">
        <div
          onClick={() => setAutoSave && setAutoSave(!autoSave)}
          role="switch"
          aria-checked={!!autoSave}
          style={{
            width: 36,
            height: 20,
            borderRadius: 999,
            background: autoSave ? '#16a34a' : '#374151',
            position: 'relative',
            cursor: 'pointer',
            border: '1px solid #2a2a2a'
          }}
          data-overlay-ui="1"
        >
          <div
            style={{
              position: 'absolute',
              top: 1.5,
              left: autoSave ? 18 : 2,
              width: 16,
              height: 16,
              borderRadius: 999,
              background: '#0b0b0b',
              transition: 'left 150ms ease'
            }}
          />
        </div>
        <span style={{ fontSize: 11, color: '#a1a1aa' }}>Auto</span>
      </div>
      {lastSaveOk === true && (
        <span title="Saved" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a', fontSize: 11 }} data-overlay-ui="1"><Check size={12} />Saved</span>
      )}
      {lastSaveOk === false && (
        <span title={lastSaveError || 'Save failed'} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', fontSize: 11 }} data-overlay-ui="1"><X size={12} />Failed</span>
      )}
      {!!lastSavedAt && lastSaveOk === true && (
        <span style={{ fontSize: 11, color: '#71717a' }} data-overlay-ui="1">{savedAtText}</span>
      )}
      <style>{`
        @keyframes ants {
          0%   {background-position: 0 0, 0 100%, 0 0, 100% 0}
          100% {background-position: 6px 0, -6px 100%, 0 6px, 100% -6px}
        }
      `}</style>
    </div>
  );
};

export default DesignSaveHeader;


