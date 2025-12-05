
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closeFoulModal } from '../../store/slices/uiSlice';

export default function FoulLanguageModal() {
  const dispatch = useDispatch();
  const { foulModalOpen, foulViolations } = useSelector((state) => state.ui);

  if (!foulModalOpen) return null;

  return (
    <div className="modal-overlay" style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 9999
    }}>
      <div className="glass-card modal-content" style={{
          width: '90%', maxWidth: '500px',
          padding: '30px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 99, 71, 0.3)', // Reddish border for warning
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          textAlign: 'center',
          background: 'var(--bg-elevated)'
      }}>
        
        <div style={{fontSize: '4rem', marginBottom: '20px'}}>🚫</div>
        
        <h2 style={{
            fontSize: '1.8rem', 
            marginBottom: '15px',
            background: 'linear-gradient(to right, #ef4444, #f87171)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '800'
        }}>
            Inappropriate Language Detected
        </h2>

        <p style={{
            color: 'var(--text-secondary)', 
            fontSize: '1.1rem', 
            lineHeight: '1.6',
            marginBottom: '25px'
        }}>
            Your content contains wording that violates our community guidelines. 
            We detected potential <strong>{foulViolations.length > 0 ? foulViolations.join(", ") : "offensive language"}</strong>.
            <br/><br/>
            Please remove offensive or harmful language to maintain a respectful environment for everyone.
        </p>

        <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
            <button 
                onClick={() => dispatch(closeFoulModal())}
                style={{
                    padding: '12px 30px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'var(--primary-gradient)',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
                }}
            >
                Edit & Retry
            </button>
            
            {/* Secondary Action - Clear/Cancel could go here if needed, but Edit is primary */}
        </div>

      </div>
    </div>
  );
}
