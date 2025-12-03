import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

export default function PremiumModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'confirm', // 'confirm', 'alert', 'input', 'danger'
  onConfirm, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  inputPlaceholder = '',
  ...props
}) {
  const [inputValue, setInputValue] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsClosing(false);
      setInputValue('');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleConfirm = () => {
    if (type === 'input' && !inputValue.trim()) return;
    if (onConfirm) onConfirm(type === 'input' ? inputValue : undefined);
    handleClose();
  };

  if (!isOpen && !isClosing) return null;

  const isDanger = type === 'danger';

  return ReactDOM.createPortal(
    <div 
      className={`modal-overlay ${isClosing ? 'fade-out' : 'fade-in'}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div 
        className={`modal-content ${isClosing ? 'scale-out' : 'scale-in'}`}
        style={{
          background: 'var(--bg-elevated)',
          width: '100%',
          maxWidth: '400px',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '32px',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
          color: isDanger ? 'var(--danger)' : 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          margin: '0 auto 20px'
        }}>
          {isDanger ? '⚠️' : type === 'input' ? '✏️' : '✨'}
        </div>

        <h3 style={{ margin: '0 0 12px', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{message}</p>

        {type === 'input' && (
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={inputPlaceholder}
            rows={3}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-root)',
              color: 'var(--text-primary)',
              marginBottom: '24px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            autoFocus
          />
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          {type !== 'alert' && (
            <button 
              onClick={handleClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: isDanger ? 'var(--danger)' : 'var(--primary-gradient)',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: isDanger ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        .fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .fade-out { animation: fadeOut 0.3s ease-in forwards; }
        .scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .scale-out { animation: scaleOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>,
    document.body
  );
}
