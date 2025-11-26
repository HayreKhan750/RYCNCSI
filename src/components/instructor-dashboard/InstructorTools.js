import React from 'react';

export default function InstructorTools({ onAction }) {
  const tools = [
      { icon: '💬', label: 'Respond to Reviews' },
      { icon: '👤', label: 'View My Public Profile' },
      { icon: '📊', label: 'Download Analytics Report' },
      { icon: '📚', label: 'Manage My Courses' }
  ];

  return (
    <div className="glass-panel" style={{marginTop: 30}}>
        <h3 style={{marginTop:0, marginBottom:20}}>Quick Tools</h3>
        <div className="tools-grid">
            {tools.map((t, i) => (
                <button key={i} className="tool-btn" onClick={() => onAction && onAction(t.label)}>
                    <span style={{fontSize:'1.2em'}}>{t.icon}</span>
                    <span>{t.label}</span>
                </button>
            ))}
        </div>
    </div>
  );
}
