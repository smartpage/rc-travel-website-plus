import React from 'react';
import { useDesign } from '@/contexts/DesignContext';
import { AlertTriangle, Save, RefreshCw, Download, X } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

type TemplateSummary = {
  id: string;
  name?: string;
  description?: string;
  type?: string;
  tags?: string[];
  version?: string;
  isPublic?: boolean;
  updatedAt?: any;
};

const TemplatesPanel: React.FC = () => {
  const { design, saveDesignToDBV2, applyTemplateById } = useDesign() as any;
  const [templates, setTemplates] = React.useState<TemplateSummary[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>(
    () => (design as any)?.meta?.template?.id || ''
  );

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const API_BASE = isLocalhost ? 'http://localhost:5001' : 'https://login.intuitiva.pt';

  const listTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/templates/list-templates?limit=50`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTemplates(data?.templates || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    listTemplates();
  }, []);

  // Prefill inputs when a template is selected or when meta.template exists
  React.useEffect(() => {
    const metaTpl = (design as any)?.meta?.template;
    const selected = templates.find(t => t.id === selectedTemplateId);
    if (selected) {
      setName(selected.name || '');
      setDescription(selected.description || '');
      setType(selected.type || 'travel');
      setTags(selected.tags && selected.tags.length ? selected.tags.join(',') : '');
      setIsPublic(selected.isPublic !== false);
    } else if (metaTpl) {
      setName(metaTpl.name || '');
      setType('travel');
    }
  }, [selectedTemplateId, templates]);

  const [name, setName] = React.useState<string>(() => (design as any)?.meta?.template?.name || '');
  const [description, setDescription] = React.useState<string>('');
  const [type, setType] = React.useState<string>('travel');
  const [tags, setTags] = React.useState<string>('');
  const [modalFields, setModalFields] = React.useState<{ name: string; description: string; type: string; tags: string } | null>(null);
  const [isPublic, setIsPublic] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState<string | null>(null);
  const [saveOk, setSaveOk] = React.useState<boolean | null>(null);
  const [applying, setApplying] = React.useState(false);
  const [applyMsg, setApplyMsg] = React.useState<string | null>(null);
  const [applyOk, setApplyOk] = React.useState<boolean | null>(null);
  const [showConfirm, setShowConfirm] = React.useState<{
    action: 'save-new' | 'update' | 'apply';
    title: string;
    message?: string;
    onConfirm: () => void;
  } | null>(null);

  const computeUniqueName = React.useCallback((baseInput: string): string => {
    const base = String(baseInput || 'Untitled Template').trim();
    const existing = (templates || [])
      .map(t => (t.name || t.id || '').toLowerCase().trim())
      .filter(Boolean);
    const baseLower = base.toLowerCase();
    if (!existing.includes(baseLower)) return base;
    let i = 2;
    let candidate = `${base} (${i})`;
    while (existing.includes(candidate.toLowerCase())) {
      i += 1;
      candidate = `${base} (${i})`;
    }
    return candidate;
  }, [templates]);

  const executeUpdateTemplate = async (opts: { templateId?: string; override?: { name?: string; description?: string; type?: string; tags?: string } }) => {
    try {
      setSaving(true);
      setSaveMsg(null);
      setSaveOk(null);
      // Safety: only allow updating the template that is currently applied locally
      const appliedId = (design as any)?.meta?.template?.id || '';
      if (opts.templateId && appliedId && opts.templateId !== appliedId) {
        setSaveMsg('Cannot update: selected template does not match the currently applied template');
        setSaveOk(false);
        return;
      }
      // If creating a new template, ensure unique name by suffixing (2), (3), ...
      const useName = (opts.override?.name ?? name);
      const useDescription = (opts.override?.description ?? description);
      const useType = (opts.override?.type ?? type);
      const useTags = (opts.override?.tags ?? tags);
      let finalName = useName || (opts.templateId ? undefined : 'Untitled Template');
      if (!opts.templateId) {
        const base = String(finalName || 'Untitled Template').trim();
        const existing = (templates || [])
          .map(t => (t.name || t.id || '').toLowerCase().trim())
          .filter(Boolean);
        const baseLower = base.toLowerCase();
        if (existing.includes(baseLower)) {
          let i = 2;
          let candidate = `${base} (${i})`;
          while (existing.includes(candidate.toLowerCase())) {
            i += 1;
            candidate = `${base} (${i})`;
          }
          finalName = candidate;
        }
      }

      const payload: any = {
        ...(opts.templateId ? { templateId: opts.templateId } : {}),
        name: finalName,
        description: useDescription || undefined,
        type: useType,
        tags: useTags ? useTags.split(',').map(s => s.trim()).filter(Boolean) : [],
        designConfig: { designV2: design },
        isPublic
      };
      const res = await fetch(`${API_BASE}/api/templates/update-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSaveMsg(data?.message || `Saved${!opts.templateId ? ` as "${finalName}"` : ''}`);
      setSaveOk(true);
      setSelectedTemplateId(data?.templateId || opts.templateId || '');
      if (!opts.templateId) {
        setName(String(finalName));
      }
      await listTemplates();
    } catch (e: any) {
      setSaveMsg(e?.message || 'Save failed');
      setSaveOk(false);
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = (opts: { templateId?: string }) => {
    const selectedTemplate = templates.find(t => t.id === opts.templateId);
    setShowConfirm({
      action: opts.templateId ? 'update' : 'save-new',
      title: opts.templateId ? 'Update Template' : 'Save as New Template',
      message: opts.templateId 
        ? `Update "${selectedTemplate?.name || opts.templateId}" with the current design?\n\nThis will overwrite the existing template.`
        : '',
      onConfirm: () => executeUpdateTemplate(opts)
    });
    if (!opts.templateId) {
      const initialUnique = computeUniqueName(name || 'Untitled Template');
      setModalFields({
        name: initialUnique,
        description: description || '',
        type: type || 'travel',
        tags: tags || ''
      });
    } else {
      setModalFields(null);
    }
  };

  const applySelected = () => {
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    setShowConfirm({
      action: 'apply',
      title: 'Apply Template',
      message: `Apply "${selectedTemplate?.name || selectedTemplateId}" to this site?\n\nThis will replace your current design and save to dbV2.json.`,
      onConfirm: () => executeApplySelected()
    });
  };

  const executeApplySelected = async () => {
    if (!selectedTemplateId) return;
    try {
      setApplying(true);
      setApplyMsg(null);
      setApplyOk(null);
      await applyTemplateById?.(selectedTemplateId);
      setApplyMsg('Template applied and saved to dbV2.json');
      setApplyOk(true);
    } catch (e: any) {
      setApplyMsg(e?.message || 'Failed to apply template');
      setApplyOk(false);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 8, width: '100%', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
      {/* Current Template meta from local dbV2.json */}
      {((design as any)?.meta?.template) && (() => {
        const meta = (design as any).meta.template as any;
        return (
          <div style={{
            background: '#111',
            border: '1px solid #2a2a2a',
            borderRadius: 6,
            padding: '8px 10px',
            color: '#ddd',
            fontSize: 12,
            display: 'grid',
            gap: 4,
            overflowX: 'hidden',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ opacity: 0.7 }}>Current Template</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ opacity: 0.7, flex: '0 0 auto' }}>ID:</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <code style={{ display: 'block', width: '100%', background: '#0f0f0f', padding: '2px 6px', borderRadius: 4, border: '1px solid #2a2a2a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.id}</code>
              </div>
            </div>
            <div><span style={{ opacity: 0.7 }}>Name:</span> {meta.name || '—'}</div>
            {meta.version && (<div><span style={{ opacity: 0.7 }}>Version:</span> {meta.version}</div>)}
            {meta.appliedAt && (<div><span style={{ opacity: 0.7 }}>Applied:</span> {meta.appliedAt}</div>)}
          </div>
        );
      })()}
      <div style={{ display: 'grid', gap: 4 }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Templates</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            style={{ flex: 1, minWidth: 0, maxWidth: '100%', background: '#1b1b1b', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px', boxSizing: 'border-box' }}
          >
            <option value="">Select a template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name || t.id}</option>
            ))}
          </select>
          <button onClick={listTemplates} style={{ flex: '0 0 auto', width: '32px', background: '#2a2a2a', color: '#fff', border: '1px solid #3a3a3a', borderRadius: 6, padding: '6px', cursor: 'pointer', boxSizing: 'border-box' }}>↻</button>
        </div>
        {loading && <div style={{ fontSize: 12, opacity: 0.7 }}>Loading…</div>}
        {error && <div style={{ fontSize: 12, color: '#f88' }}>{error}</div>}
      </div>

      <div style={{ display: 'grid', gap: 4 }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Save as new / Update existing</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button disabled={saving} onClick={() => {
            setShowConfirm({
              action: 'save-new',
              title: 'Save as New Template',
              message: '',
              onConfirm: () => executeUpdateTemplate({ override: modalFields || { name, description, type, tags } })
            });
            const initialUnique = computeUniqueName(name || 'Untitled Template');
            setModalFields({
              name: initialUnique,
              description: description || '',
              type: type || 'travel',
              tags: tags || ''
            });
          }} style={{ flex: 1, minWidth: 0, background: '#2a2a2a', color: '#fff', border: '1px solid #3a3a3a', borderRadius: 6, padding: '8px', cursor: saving ? 'progress' : 'pointer', boxSizing: 'border-box' }}>{saving ? 'Saving…' : 'Save as New'}</button>
          {(() => {
            const appliedId = String(((design as any)?.meta?.template?.id || '')).trim();
            const selectedId = String(selectedTemplateId || '').trim();
            const matches = !!appliedId && !!selectedId && appliedId === selectedId;
            const disabled = !matches || !!saving;
            const style: React.CSSProperties = {
              flex: 1,
              minWidth: 0,
              background: '#2a2a2a',
              color: '#fff',
              border: '1px solid #3a3a3a',
              borderRadius: 6,
              padding: '8px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              boxSizing: 'border-box'
            };
            return (
              <button
                disabled={disabled}
                aria-disabled={disabled}
                title={!matches ? (selectedId ? `Applied template is ${appliedId}` : 'Select a template') : ''}
                onClick={() => {
                  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
                  setShowConfirm({
                    action: 'update',
                    title: 'Update Template',
                    message: `Update "${selectedTemplate?.name || selectedTemplateId}" with the current design?\n\nThis will overwrite the existing template.`,
                    onConfirm: () => executeUpdateTemplate({ templateId: selectedTemplateId })
                  });
                }}
                style={style}
              >
                {saving ? 'Saving…' : 'Update Selected'}
              </button>
            );
          })()}
        </div>
        {saveMsg && <div style={{ fontSize: 12, color: saveOk ? '#9ae6b4' : '#fca5a5' }}>{saveMsg}</div>}
      </div>

      <div style={{ display: 'grid', gap: 4 }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Apply selected template to site</div>
        <button disabled={!selectedTemplateId || applying} onClick={() => {
          const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
          setShowConfirm({
            action: 'apply',
            title: 'Apply Template',
            message: `Apply "${selectedTemplate?.name || selectedTemplateId}" to this site?\n\nThis will replace your current design and save to dbV2.json.`,
            onConfirm: () => executeApplySelected()
          });
        }} style={{ width: '100%', maxWidth: '100%', background: '#2a2a2a', color: '#fff', border: '1px solid #3a3a3a', borderRadius: 6, padding: '8px', cursor: 'pointer', boxSizing: 'border-box' }}>{applying ? 'Applying…' : 'Apply Template'}</button>
        {applyMsg && <div style={{ fontSize: 12, color: applyOk ? '#9ae6b4' : '#fca5a5' }}>{applyMsg}</div>}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <ConfirmModal
          open={!!showConfirm}
          title={showConfirm.title}
          actionStyle={showConfirm.action === 'apply' ? 'danger' : 'primary'}
          confirmText={showConfirm.action === 'save-new' ? 'Save' : showConfirm.action === 'update' ? 'Update' : 'Apply'}
          onClose={() => setShowConfirm(null)}
          onConfirm={() => {
            if (showConfirm.action === 'save-new') {
              const overrides = modalFields || { name, description, type, tags };
              executeUpdateTemplate({ override: overrides });
            } else {
              showConfirm.onConfirm();
            }
          }}
        >
          {showConfirm.action === 'save-new' ? (
            <div style={{ display: 'grid', gap: 6 }}>
              <input placeholder="Name" value={(modalFields?.name) ?? ''} onChange={(e) => setModalFields(prev => ({ ...(prev || { name:'', description:'', type:'travel', tags:'' }), name: e.target.value }))} style={{ width: '100%', background: '#1b1b1b', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px', boxSizing: 'border-box' }} />
              <input placeholder="Description" value={(modalFields?.description) ?? ''} onChange={(e) => setModalFields(prev => ({ ...(prev || { name:'', description:'', type:'travel', tags:'' }), description: e.target.value }))} style={{ width: '100%', background: '#1b1b1b', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px', boxSizing: 'border-box' }} />
              <input placeholder="Type (e.g., travel)" value={(modalFields?.type) ?? 'travel'} onChange={(e) => setModalFields(prev => ({ ...(prev || { name:'', description:'', type:'travel', tags:'' }), type: e.target.value }))} style={{ width: '100%', background: '#1b1b1b', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px', boxSizing: 'border-box' }} />
              <input placeholder="Tags (comma separated)" value={(modalFields?.tags) ?? ''} onChange={(e) => setModalFields(prev => ({ ...(prev || { name:'', description:'', type:'travel', tags:'' }), tags: e.target.value }))} style={{ width: '100%', background: '#1b1b1b', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px', boxSizing: 'border-box' }} />
            </div>
          ) : (
            <p style={{ margin: 0, color: '#ccc', fontSize: '1rem', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{showConfirm.message}</p>
          )}
        </ConfirmModal>
      )}
    </div>
  );
};

export default TemplatesPanel;


