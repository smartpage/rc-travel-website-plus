import React from 'react';
import { useLocation } from 'react-router-dom';
import { Monitor, Smartphone } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useDesign } from '@/contexts/DesignContext';

const ViewportToggleOverlay: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { design } = useDesign();
  const enabled = React.useMemo(() => {
    const q = new URLSearchParams(location.search);
    return q.get('design') === '1' || q.get('design') === 'true';
  }, [location.search]);

  const [vp, setVp] = React.useState<'desktop' | 'mobile'>(() => {
    return (sessionStorage.getItem('design_vp') as 'desktop' | 'mobile') || 'desktop';
  });

  const [containerRef, setContainerRef] = React.useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!enabled) return;
    sessionStorage.setItem('design_vp', vp);
  }, [vp, enabled]);

  // Animate the container width between desktop and mobile
  const targetWidth = vp === 'mobile' ? 390 : undefined; // undefined => 100vw

  if (!enabled) return null;

  // Desktop/Mobile shown inside animated container. No iframe isolation.

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

      {/* Animated container wrapper - renders site content directly inside */}
      <div
        ref={setContainerRef}
        className="@container"
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: targetWidth ? `${targetWidth}px` : '100vw',
          height: '100vh',
          zIndex: 900,
          transition: 'width 300ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          overflow: 'auto',
          background: design?.colors?.background || 'black',
        }}
      >
        {/* Site content will be portaled here */}
        {containerRef && children && createPortal(children, containerRef)}
      </div>
    </>
  );
};

export default ViewportToggleOverlay;


