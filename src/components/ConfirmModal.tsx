// Add portal and px inline styles
import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this exists for class merging

export type ConfirmAction = 'primary' | 'danger' | 'neutral';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  actionStyle?: ConfirmAction;
  confirmIcon?: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  className?: string; // Optional for extension
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  children,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  actionStyle = 'primary',
  confirmIcon,
  onConfirm,
  onClose,
  className,
}) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const confirmBg = actionStyle === 'danger' ? '#dc2626' : actionStyle === 'neutral' ? '#3a3a3a' : '#2563eb';

  const modalContent = (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          background: '#1b1b1b',
          border: '1px solid #3a3a3a',
          borderRadius: 8,
          padding: 20,
          width: 'fit-content',
          maxWidth: 'min(680px, 95vw)',
          minWidth: 520,
          color: '#fff',
          fontSize: '12px !important',
          fontFamily: 'Inter, sans-serif',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <AlertTriangle size={16} color="#f59e0b" />
          <h3 style={{ margin: 0, fontSize: '14px !important', fontWeight: 600 }}>
            <span style={{ fontSize: 14 }}>{title}</span>
          </h3>
        </div>

        {children ? (
          <div style={{ marginBottom: 16, fontSize: '12px !important' }}>{children}</div>
        ) : message ? (
          <span style={{ display: 'block', margin: '0 0 16px 0', color: '#ccc', fontSize: '12px !important', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            <span style={{ fontSize: 12 }}>{message}</span>
          </span>
        ) : null}

        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <button
            onClick={onClose}
            style={{
              background: '#2a2a2a',
              color: '#fff',
              border: '1px solid #3a3a3a',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '12px !important',
              flex: 1,
              justifyContent: 'center'
            }}
          >
            <X size={12} />
            <span style={{ fontSize: 12 }}>{cancelText}</span>
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            style={{
              background: confirmBg,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '12px !important',
              flex: 1,
              justifyContent: 'center'
            }}
          >
            {confirmIcon}
            <span style={{ fontSize: 12 }}>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmModal;


