import React from 'react';

export default function InstructorTools({ onAction }) {
  const tools = [
      { icon: '💬', label: 'Respond to Reviews', desc: 'Engage with your students' },
      { icon: '✉️', label: 'Private Messages', desc: 'Chat with students' },
      { icon: '👤', label: 'View My Profile', desc: 'See what students see' },
      { icon: '📊', label: 'Download Analytics Report', desc: 'Detailed performance data' },
      { icon: '📚', label: 'Manage My Courses', desc: 'Update content & materials' }
  ];

  return (
    <div className="tools-section fade-in-up">
        <div className="tools-grid" style={{
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: 20
        }}>
            {tools.map((t, i) => (
                <button 
                    key={i} 
                    className="tool-card glass-card clickable" 
                    onClick={() => onAction && onAction(t.label)}
                    style={{
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        textAlign: 'left',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-elevated)',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <div className="tool-icon" style={{
                        fontSize: '2rem', 
                        marginBottom: 15,
                        background: 'var(--primary-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>{t.icon}</div>
                    <div style={{fontWeight: 700, fontSize: '1.1rem', marginBottom: 5, color: 'var(--text-primary)'}}>{t.label}</div>
                    <div style={{fontSize: '0.9rem', opacity: 0.7, color: 'var(--text-secondary)'}}>{t.desc}</div>
                </button>
            ))}
        </div>
        <style>{`
            .tool-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 30px -10px rgba(0,0,0,0.2);
                border-color: var(--primary);
            }
        `}</style>
    </div>
  );
}
