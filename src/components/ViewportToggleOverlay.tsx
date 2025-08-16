import React from 'react';
import { useLocation } from 'react-router-dom';
import { Monitor, Smartphone } from 'lucide-react';

const ViewportToggleOverlay: React.FC = () => {
  const location = useLocation();
  const enabled = React.useMemo(() => {
    const q = new URLSearchParams(location.search);
    return q.get('design') === '1' || q.get('design') === 'true';
  }, [location.search]);

  // Hide overlay when explicitly embedding (not typical for this flow, but safe)
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

  // Build inline mobile iframe URL (same page with overlay disabled)
  const iframeUrl = React.useMemo(() => {
    if (vp !== 'mobile') return '';
    const url = new URL(window.location.href);
    url.searchParams.delete('design');
    url.searchParams.set('embed', '1');
    return url.toString();
  }, [vp]);

  // Small entrance animation for the iframe container
  const [animateIn, setAnimateIn] = React.useState(false);
  React.useEffect(() => {
    if (vp !== 'mobile') {
      setAnimateIn(false);
      return;
    }
    setAnimateIn(false);
    const r = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(r);
  }, [vp]);

  if (!enabled || isEmbed) return null;

  // Desktop is untouched. Mobile shows an inline iframe with backdrop and animation.

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

      {vp === 'mobile' && (
        <>
          {/* Backdrop that hides desktop without blocking inspector (pointer-events: none) */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              zIndex: 900,
              pointerEvents: 'none',
              transition: 'opacity 200ms ease-out',
              opacity: animateIn ? 1 : 0,
            }}
          />
          {/* Animated, centered mobile frame */}
          <div
            style={{
              position: 'fixed',
              top: 56,
              left: '50%',
              transform: `translateX(-50%) ${animateIn ? 'scale(1)' : 'scale(0.985)'}`,
              transformOrigin: 'top center',
              zIndex: 950,
              transition: 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease-out',
              opacity: animateIn ? 1 : 0,
              filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.6))',
            }}
          >
            <iframe
              key={iframeUrl}
              src={iframeUrl}
              title="Mobile preview"
              style={{
                width: 390,
                height: 'calc(100vh - 72px)',
                border: '1px solid rgba(255,255,255,0.08)',
                background: '#000',
                borderRadius: 12,
              }}
            />
          </div>
        </>
      )}
    </>
  );
};

export default ViewportToggleOverlay;


