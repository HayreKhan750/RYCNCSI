import React from 'react';

export default function BadgesSection({ badges }) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="glass-card" style={{padding:20}}>
        <h3 style={{marginTop:0, marginBottom:15, fontSize:'1.2rem'}}>Achievements</h3>
        <div className="badges-grid">
            {badges.map((badge, i) => (
                <div key={i} className="badge-item">
                    <div className="badge-icon">{badge.icon}</div>
                    <div className="badge-name">{badge.label}</div>
                </div>
            ))}
        </div>
    </div>
  );
}
