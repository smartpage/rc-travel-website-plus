import React from 'react';
import { Save as SaveIcon } from 'lucide-react';
import { useDesign } from '@/contexts/DesignContext';
import { useEditorOverlay } from '@/contexts/EditorOverlayContext';
import { useAuth } from '@/contexts/AuthContext';

const DesignSaveHeader: React.FC = () => {
  const { isDirty, saving, lastSavedAt, autoSave, setAutoSave, saveDesignToDBV2 } = useDesign();
  const { enabled } = useEditorOverlay();
  const { isAuthorized } = useAuth();

  if (!enabled || !isAuthorized) return null;

  const onSave = async () => {
    if (saving) return;
    try { await saveDesignToDBV2(); } catch {}
  };

  const savedAtText = lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : '';

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
          background: (!isDirty || saving) ? '#1f1f1f' : '#0f172a',
          color: (!isDirty || saving) ? '#6b7280' : '#f8fafc',
          border: '1px solid #2a2a2a',
          cursor: (!isDirty || saving) ? 'default' : 'pointer'
        }}
        data-overlay-ui="1"
      >
        <SaveIcon size={14} />
      </button>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#a1a1aa' }} data-overlay-ui="1">
        <input
          type="checkbox"
          checked={!!autoSave}
          onChange={(e) => setAutoSave && setAutoSave(e.target.checked)}
          data-overlay-ui="1"
        />
        Auto-save
      </label>
      {!!lastSavedAt && (
        <span style={{ fontSize: 11, color: '#71717a' }} data-overlay-ui="1">Saved {savedAtText}</span>
      )}
    </div>
  );
};

export default DesignSaveHeader;


