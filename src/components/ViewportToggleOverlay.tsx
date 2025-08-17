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
    try {
      window.dispatchEvent(new CustomEvent('design-viewport-change', { detail: { vp } }));
    } catch {}
  }, [vp, enabled]);

  // Animate the container width between desktop and mobile
  const targetWidth = vp === 'mobile' ? 390 : undefined; // undefined => 100vw

  if (!enabled) return null;

  // Desktop/Mobile shown inside animated container. No iframe isolation.

  return (
    <>
      {/* Viewport toggle - panel style */}
      <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1100 }} data-overlay-ui="1">
        <div style={{ 
          background: '#0f0f0f', 
          color: '#fff', 
          borderRadius: 8, 
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          display: 'flex',
          gap: 8,
          padding: 8
        }}>
          <button
            onClick={() => setVp('desktop')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 40,
              background: vp === 'desktop' ? '#2a2a2a' : '#1a1a1a',
              border: '1px solid #3a3a3a',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = vp === 'desktop' ? '#3a3a3a' : '#2a2a2a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = vp === 'desktop' ? '#2a2a2a' : '#1a1a1a';
            }}
            aria-label="Desktop viewport"
          >
            <Monitor size={20} />
          </button>
          <button
            onClick={() => setVp('mobile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 40,
              background: vp === 'mobile' ? '#2a2a2a' : '#1a1a1a',
              border: '1px solid #3a3a3a',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = vp === 'mobile' ? '#3a3a3a' : '#2a2a2a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = vp === 'mobile' ? '#2a2a2a' : '#1a1a1a';
            }}
            aria-label="Mobile viewport"
          >
            <Smartphone size={20} />
          </button>
        </div>
      </div>

      {/* Fullscreen background using design token (fills side whitespace) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: design?.colors?.background,
          zIndex: 800,
          pointerEvents: 'none',
        }}
      />

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
          background: design?.colors?.background,
        }}
      >
        {/* Site content will be portaled here */}
        {containerRef && children && createPortal(children, containerRef)}
      </div>
    </>
  );
};

export default ViewportToggleOverlay;


