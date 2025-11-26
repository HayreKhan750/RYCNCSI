import React from 'react';
import './ConfirmationModal.css';

export default function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'info' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay fade-in" onClick={onCancel}>
      <div className="modal-content glass-card premium-modal" onClick={e => e.stopPropagation()}>
        <div className={`modal-header ${type}`}>
            {type === 'danger' && <span className="modal-icon">⚠️</span>}
            {type === 'success' && <span className="modal-icon">✅</span>}
            {type === 'info' && <span className="modal-icon">ℹ️</span>}
            <h3>{title}</h3>
        </div>
        <div className="modal-body">
            <p>{message}</p>
        </div>
        <div className="modal-actions">
            <button className="cancel-btn" onClick={onCancel}>{cancelText}</button>
            <button className={`confirm-btn ${type}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
