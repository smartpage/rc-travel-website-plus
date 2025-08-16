import React from 'react';
import { useLocation } from 'react-router-dom';
import { Monitor, Smartphone } from 'lucide-react';

const ViewportToggleOverlay: React.FC = () => {
  const location = useLocation();
  const enabled = React.useMemo(() => {
    const q = new URLSearchParams(location.search);
    return q.get('design') === '1' || q.get('design') === 'true';
  }, [location.search]);

  // Hide overlay when explicitly embedding (the iframe loads with embed=1)
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

  // Always render a single full-viewport iframe; prevent recursion via ?embed=1
  const iframeUrl = React.useMemo(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('design');
    url.searchParams.set('embed', '1');
    return url.toString();
  }, []);

  // Animate the frame width between desktop and mobile
  const targetWidth = vp === 'mobile' ? 390 : undefined; // undefined => 100vw
  const [animateTick, setAnimateTick] = React.useState(0);
  React.useEffect(() => {
    // force reflow-driven animation trigger on vp change
    setAnimateTick((n) => n + 1);
  }, [vp]);

  if (!enabled || isEmbed) return null;

  // Desktop/Mobile shown inside one iframe. Parent page never changes layout.

  return (
    <>
      {/* Centered pill controls only */}
      <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1100 }}>
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

      {/* Single iframe that animates its width between desktop (100vw) and mobile (390px) */}
      <div
        key={animateTick}
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: targetWidth ? targetWidth : '100vw',
          height: '100vh',
          zIndex: 1000,
          transition: 'width 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <iframe
          src={iframeUrl}
          title="Site preview"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: 'transparent',
            overflow: 'hidden',
          }}
        />
      </div>
    </>
  );
};

export default ViewportToggleOverlay;


