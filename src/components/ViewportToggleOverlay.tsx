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

  // Apply a root wrapper constraint by setting inline styles on #root
  const previousRootStylesRef = React.useRef<Partial<CSSStyleDeclaration> | null>(null);
  React.useEffect(() => {
    if (!enabled) return;
    const root = document.getElementById('root') as HTMLElement | null;
    if (!root) return;

    const setMobile = vp === 'mobile';

    if (setMobile) {
      if (!previousRootStylesRef.current) {
        previousRootStylesRef.current = {
          width: root.style.width,
          marginLeft: root.style.marginLeft,
          marginRight: root.style.marginRight,
          maxWidth: (root.style as any).maxWidth,
        } as Partial<CSSStyleDeclaration>;
      }

      root.style.width = '390px';
      root.style.marginLeft = 'auto';
      root.style.marginRight = 'auto';
      (root.style as any).maxWidth = 'none';
    } else {
      if (previousRootStylesRef.current) {
        root.style.width = previousRootStylesRef.current.width || '';
        root.style.marginLeft = previousRootStylesRef.current.marginLeft || '';
        root.style.marginRight = previousRootStylesRef.current.marginRight || '';
        (root.style as any).maxWidth = (previousRootStylesRef.current as any).maxWidth || '';
        previousRootStylesRef.current = null;
      } else {
        // Ensure cleanup even if we did not store previous styles
        root.style.width = '';
        root.style.marginLeft = '';
        root.style.marginRight = '';
        (root.style as any).maxWidth = '';
      }
    }

    return () => {
      // On unmount, restore styles if we modified them
      if (!enabled) return;
      const rootCleanup = document.getElementById('root') as HTMLElement | null;
      if (rootCleanup) {
        if (previousRootStylesRef.current) {
          rootCleanup.style.width = previousRootStylesRef.current.width || '';
          rootCleanup.style.marginLeft = previousRootStylesRef.current.marginLeft || '';
          rootCleanup.style.marginRight = previousRootStylesRef.current.marginRight || '';
          (rootCleanup.style as any).maxWidth = (previousRootStylesRef.current as any).maxWidth || '';
          previousRootStylesRef.current = null;
        } else {
          rootCleanup.style.width = '';
          rootCleanup.style.marginLeft = '';
          rootCleanup.style.marginRight = '';
          (rootCleanup.style as any).maxWidth = '';
        }
      }
    };
  }, [vp, enabled]);

  if (!enabled || isEmbed) return null;

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


