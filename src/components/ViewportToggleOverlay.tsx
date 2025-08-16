import React from 'react';
import { useLocation } from 'react-router-dom';
import { Monitor, Smartphone } from 'lucide-react';

const ViewportToggleOverlay: React.FC = () => {
  const location = useLocation();
  const enabled = React.useMemo(() => {
    const q = new URLSearchParams(location.search);
    return q.get('design') === '1' || q.get('design') === 'true';
  }, [location.search]);

  // Hide overlay when we're rendering inside an embedded preview window
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

  // A handle to a separate window used for the mobile preview
  const mobileWindowRef = React.useRef<Window | null>(null);

  const openMobileWindow = React.useCallback(() => {
    try {
      // Build URL for the preview window: same route, but hide overlays
      const url = new URL(window.location.href);
      url.searchParams.delete('design');
      url.searchParams.set('embed', '1');

      // Reasonable phone-like size. Let user resize manually if desired.
      const features = [
        'popup=yes',
        'noopener',
        'noreferrer',
        'resizable=yes',
        'scrollbars=yes',
        'width=390',
        'height=844',
      ].join(',');

      const win = window.open(url.toString(), 'rc-mobile-preview', features);
      if (win) {
        mobileWindowRef.current = win;
        // When the preview closes, restore state
        const interval = window.setInterval(() => {
          if (mobileWindowRef.current && mobileWindowRef.current.closed) {
            window.clearInterval(interval);
            mobileWindowRef.current = null;
            setVp('desktop');
          }
        }, 500);
      }
    } catch (_) {
      // noop
    }
  }, []);

  // Ensure preview window is closed on unmount/navigation
  React.useEffect(() => {
    return () => {
      try {
        if (mobileWindowRef.current && !mobileWindowRef.current.closed) {
          mobileWindowRef.current.close();
          mobileWindowRef.current = null;
        }
      } catch (_) {}
    };
  }, []);

  if (!enabled || isEmbed) return null;

  // no overlays that alter layout; desktop is untouched, mobile uses viewport meta

  return (
    <>
      {/* Centered pill controls only */}
      <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
        <div style={{ display: 'flex', gap: 4, background: '#0f0f0f', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 9999, padding: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <button
            onClick={() => {
              setVp('desktop');
              try {
                if (mobileWindowRef.current && !mobileWindowRef.current.closed) {
                  mobileWindowRef.current.close();
                  mobileWindowRef.current = null;
                }
              } catch (_) {}
            }}
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
            onClick={() => {
              setVp('mobile');
              openMobileWindow();
            }}
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


