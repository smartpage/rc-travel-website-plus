import React from 'react';
import { useLocation } from 'react-router-dom';
import { useDesign } from '@/contexts/DesignContext';

const PanelRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label style={{ display: 'grid', gap: 4 }}>
    <span style={{ fontSize: 12, opacity: 0.8 }}>{label}</span>
    {children}
  </label>
);

const DesignInspectorOverlay: React.FC = () => {
  const location = useLocation();
  const query = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const enabled = query.get('design') === '1' || query.get('design') === 'true';

  const { design, updateDesignLocal, saveDesignToAPI, refreshDesign } = useDesign() as any;

  const [primary, setPrimary] = React.useState<string>(design?.colors?.primary || '');
  const [activeSectionId, setActiveSectionId] = React.useState<string>('hero');
  const [padMobile, setPadMobile] = React.useState<string>(
    design?.sections?.hero?.layout?.padding?.mobile || ''
  );
  const [padDesktop, setPadDesktop] = React.useState<string>(
    design?.sections?.hero?.layout?.padding?.desktop || ''
  );
  const [innerWidth, setInnerWidth] = React.useState<string>(
    (design?.sections?.hero?.layout?.inner as any)?.width || ''
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    setPrimary(design?.colors?.primary || '');
    setPadMobile(design?.sections?.[activeSectionId]?.layout?.padding?.mobile || '');
    setPadDesktop(design?.sections?.[activeSectionId]?.layout?.padding?.desktop || '');
    setInnerWidth((design?.sections?.[activeSectionId]?.layout?.inner as any)?.width || '');
  }, [design, activeSectionId]);

  // Receive selection from embed iframe via BroadcastChannel
  React.useEffect(() => {
    if (!enabled) return;
    const channel = new BroadcastChannel('rc_editor');
    const onMsg = (ev: MessageEvent) => {
      const msg = ev.data as any;
      if (msg?.type === 'select-section' && typeof msg.sectionId === 'string') {
        setActiveSectionId(msg.sectionId);
      }
    };
    channel.addEventListener('message', onMsg);
    return () => {
      channel.removeEventListener('message', onMsg as any);
      channel.close();
    };
  }, [enabled]);

  // Listen for hover/click on sections to set scope (data-section-id from Section component)
  React.useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const sectionEl = target.closest('[data-section-id]') as HTMLElement | null;
      if (sectionEl) {
        const sid = sectionEl.getAttribute('data-section-id');
        if (sid && sid !== activeSectionId) {
          setActiveSectionId(sid);
        }
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [enabled, activeSectionId]);

  if (!enabled) return null;

  const applyPreview = () => {
    setSaved(false);
    setError(null);
    const updatedDesign = ((prev: any) => {
      const next = { ...prev };
      next.colors = { ...next.colors, primary };
      next.sections = next.sections || {};
      const sid = activeSectionId || 'hero';
      next.sections[sid] = next.sections[sid] || { layout: { padding: { mobile: '', tablet: '', desktop: '' }, inner: { maxWidth: '100%', margin: '0 auto', padding: { mobile: '0', tablet: '0', desktop: '0' }, rounded: false, backgroundColor: 'transparent', overflow: 'visible', background: { type: 'color', value: 'transparent' } } } };
      next.sections[sid].layout = {
        ...next.sections[sid].layout,
        padding: {
          ...next.sections[sid].layout.padding,
          mobile: padMobile,
          desktop: padDesktop,
        },
      };
      // optional inner width token
      (next.sections[sid].layout.inner as any) = {
        ...next.sections[sid].layout.inner,
        width: innerWidth,
      };
      return next;
    })(design);
    
    updateDesignLocal(() => updatedDesign);
    
    // Send design update to iframe via BroadcastChannel
    try {
      const channel = new BroadcastChannel('rc_editor');
      channel.postMessage({ type: 'design-update', design: updatedDesign });
      channel.close();
    } catch (e) {
      console.warn('Failed to send design update to iframe:', e);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      setSaved(false);
      setError(null);
      await saveDesignToAPI();
      setSaved(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  const revert = async () => {
    setError(null);
    setSaved(false);
    await refreshDesign();
  };

  return (
    <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 1000, width: 340, background: '#0f0f0f', color: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>Design Inspector</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>API-only</div>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Section:</span>
          <code style={{ background: '#161616', padding: '2px 6px', borderRadius: 4 }}>{activeSectionId}</code>
          <span style={{ fontSize: 11, opacity: 0.7 }}>(click a section to focus)</span>
        </div>
        <PanelRow label="colors.primary">
          <input value={primary} onChange={(e) => setPrimary(e.target.value)} style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }} />
        </PanelRow>
        <PanelRow label={`sections.${activeSectionId}.layout.padding.mobile`}>
          <input value={padMobile} onChange={(e) => setPadMobile(e.target.value)} placeholder="e.g. 0.5rem 0" style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }} />
        </PanelRow>
        <PanelRow label={`sections.${activeSectionId}.layout.padding.desktop`}>
          <input value={padDesktop} onChange={(e) => setPadDesktop(e.target.value)} placeholder="e.g. 5rem 2rem" style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }} />
        </PanelRow>
        <PanelRow label={`sections.${activeSectionId}.layout.inner.width`}>
          <input value={innerWidth} onChange={(e) => setInnerWidth(e.target.value)} placeholder="e.g. 98%" style={{ background: '#1b1b1b', color: '#fff', padding: 8, borderRadius: 6, border: '1px solid #2a2a2a' }} />
        </PanelRow>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={applyPreview} style={{ padding: '8px 10px', background: '#2b2b2b', color: '#fff', borderRadius: 6, border: '1px solid #3a3a3a' }}>Preview</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 10px', background: '#2d6a4f', color: '#fff', borderRadius: 6, border: '1px solid #3a7' }}>{saving ? 'Saving…' : 'Save'}</button>
          <button onClick={revert} style={{ padding: '8px 10px', background: '#5c2121', color: '#fff', borderRadius: 6, border: '1px solid #7a3a3a' }}>Revert</button>
        </div>
        {saved && <div style={{ fontSize: 12, color: '#7ee787' }}>Saved</div>}
        {error && <div style={{ fontSize: 12, color: '#ff7b72' }}>{error}</div>}
        <div style={{ fontSize: 11, opacity: 0.7 }}>Tip: append <code>?design=1</code> to any URL to toggle this panel.</div>
      </div>
    </div>
  );
};

export default DesignInspectorOverlay;


