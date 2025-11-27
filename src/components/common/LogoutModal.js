import React from 'react';
import './LogoutModal.css';

export default function LogoutModal({ isOpen, onClose, onConfirm, isDark }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div 
        className={`logout-modal-content scale-in ${isDark ? 'dark' : 'light'}`} 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-icon-wrapper">
            <span className="modal-icon">👋</span>
        </div>
        
        <h3>Signing Out?</h3>
        <p>Are you sure you want to log out of your account?</p>
        
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="confirm-logout-btn" onClick={onConfirm}>
            Yes, Logout
          </button>
        </div>
      </div>
    </div>
  );
}
