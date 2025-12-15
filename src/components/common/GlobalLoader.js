import React from 'react';
import { useSelector } from 'react-redux';

export default function GlobalLoader() {
  const { globalLoading } = useSelector((state) => state.auth);

  if (!globalLoading) return null;

  return (
    <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
    }}>
        <div className="spinner" style={{width: 50, height: 50, border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
