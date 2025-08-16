import React from 'react';
import { useLocation } from 'react-router-dom';
import { Monitor, Smartphone } from 'lucide-react';

const ViewportToggleOverlay: React.FC = () => {
  const location = useLocation();
  const enabled = React.useMemo(() => {
    const q = new URLSearchParams(location.search);
    return q.get('design') === '1' || q.get('design') === 'true';
  }, [location.search]);

  // Persist original viewport meta to restore when toggling off
  const originalViewportRef = React.useRef<string | null>(null);

  const [vp, setVp] = React.useState<'desktop' | 'mobile'>(() => {
    return (sessionStorage.getItem('design_vp') as 'desktop' | 'mobile') || 'desktop';
  });

  React.useEffect(() => {
    if (!enabled) return;
    sessionStorage.setItem('design_vp', vp);
  }, [vp, enabled]);

  // Manage <meta name="viewport"> to simulate true responsive mobile without iframes
  React.useEffect(() => {
    if (!enabled) return;

    let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (!originalViewportRef.current) {
      originalViewportRef.current = meta?.getAttribute('content') || 'width=device-width, initial-scale=1';
    }
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'viewport');
      document.head.appendChild(meta);
    }

    if (vp === 'mobile') {
      meta.setAttribute('content', 'width=390, initial-scale=1');
    } else {
      meta.setAttribute('content', originalViewportRef.current || 'width=device-width, initial-scale=1');
    }

    return () => {
      if (!enabled) return;
      const metaCleanup = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
      if (metaCleanup && originalViewportRef.current) {
        metaCleanup.setAttribute('content', originalViewportRef.current);
      }
    };
  }, [vp, enabled]);

  if (!enabled) return null;

  // no overlays that alter layout; desktop is untouched, mobile uses viewport meta

  return (
    <>
      {/* Centered pill controls only */}
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


