import React from 'react';
import { useNavigate } from 'react-router-dom';

const NavigationControls = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', gap: '10px', marginRight: '20px' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'inherit',
          fontSize: '14px'
        }}
        title="Go Back"
      >
        ←
      </button>
      <button 
        onClick={() => navigate(1)} 
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'inherit',
          fontSize: '14px'
        }}
        title="Go Forward"
      >
        →
      </button>
    </div>
  );
};

export default NavigationControls;
