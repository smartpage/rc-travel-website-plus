import React from 'react';

// Minimal bridge active only when ?embed=1 to relay selection and preview events
const EditorBridge: React.FC = () => {
  const enabled = React.useMemo(() => {
    const q = new URLSearchParams(window.location.search);
    return q.get('embed') === '1' || q.get('embed') === 'true';
  }, []);

  React.useEffect(() => {
    if (!enabled) return;

    const channel = new BroadcastChannel('rc_editor');

    // Relay clicks on elements with data-section-id up to the parent editor
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const sectionEl = target.closest('[data-section-id]') as HTMLElement | null;
      const sectionId = sectionEl?.getAttribute('data-section-id');
      if (sectionId) {
        channel.postMessage({ type: 'select-section', sectionId });
      }
    };
    document.addEventListener('click', clickHandler, true);

    // Listen for design updates from parent and apply to local DesignContext
    const onMessage = (ev: MessageEvent) => {
      const msg = ev.data;
      if (!msg || typeof msg !== 'object') return;
      
      if (msg.type === 'design-update' && msg.design) {
        // Get the DesignContext from window (if available)
        try {
          const designContextUpdate = (window as any).rcDesignContextUpdate;
          if (typeof designContextUpdate === 'function') {
            designContextUpdate(msg.design);
          }
        } catch (e) {
          console.warn('Failed to apply design update in iframe:', e);
        }
      }
    };
    channel.addEventListener('message', onMessage);

    return () => {
      document.removeEventListener('click', clickHandler, true);
      channel.removeEventListener('message', onMessage as any);
      channel.close();
    };
  }, [enabled]);

  return null;
};

export default EditorBridge;


