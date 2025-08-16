import React from 'react';
import { useLocation } from 'react-router-dom';
import { Monitor, Smartphone } from 'lucide-react';

const ViewportToggleOverlay: React.FC = () => {
  const location = useLocation();
  const enabled = React.useMemo(() => {
    const q = new URLSearchParams(location.search);
    return q.get('design') === '1' || q.get('design') === 'true';
  }, [location.search]);

  // When rendering inside the mobile iframe, do not render the overlay again
  const isEmbed = React.useMemo(() => {
    const q = new URLSearchParams(location.search);
    return q.get('embed') === '1' || q.get('embed') === 'true';
  }, [location.search]);

  const [vp, setVp] = React.useState<'desktop' | 'mobile'>(() => {
    return (sessionStorage.getItem('design_vp') as 'desktop' | 'mobile') || 'desktop';
  });

  React.useEffect(() => {
    if (!enabled) return;
    sessionStorage.setItem('design_vp', vp);
  }, [vp, enabled]);

  if (!enabled || isEmbed) return null;

  const targetWidth = vp === 'desktop' ? undefined : 390;
  const iframeUrl = React.useMemo(() => {
    if (vp !== 'mobile') return '';
    const url = new URL(window.location.href);
    // ensure the embedded page does NOT render overlays
    url.searchParams.delete('design');
    url.searchParams.set('embed', '1');
    return url.toString();
  }, [vp]);

  return (
    <>
      {/* Mobile true responsive preview via iframe at fixed width */}
      {vp === 'mobile' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            background: 'transparent',
            zIndex: 998,
            pointerEvents: 'none',
          }}
        >
          <iframe
            src={iframeUrl}
            style={{
              width: targetWidth,
              height: '100vh',
              border: 'none',
              pointerEvents: 'auto',
              background: '#000',
            }}
            title="Mobile preview"
          />
        </div>
      )}

      {/* Centered pill controls (does not alter layout) */}
      <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
        <div style={{ display: 'flex', gap: 4, background: '#0f0f0f', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 9999, padding: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <button
            onClick={() => setVp('desktop')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              background: vp === 'desktop' ? '#1a1a1a' : 'transparent',
              border: '1px solid #2a2a2a',
              borderRadius: 9999,
              color: '#fff',
            }}
            aria-label="Desktop viewport"
          >
            <Monitor size={16} />
            <span style={{ fontSize: 12 }}>Desktop</span>
          </button>
          <button
            onClick={() => setVp('mobile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              background: vp === 'mobile' ? '#1a1a1a' : 'transparent',
              border: '1px solid #2a2a2a',
              borderRadius: 9999,
              color: '#fff',
            }}
            aria-label="Mobile viewport"
          >
            <Smartphone size={16} />
            <span style={{ fontSize: 12 }}>Mobile</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ViewportToggleOverlay;


