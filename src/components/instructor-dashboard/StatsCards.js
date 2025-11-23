import React from 'react';

export default function StatsCards({ stats }) {
  return (
    <div className="stats-grid">
      <div className="glass-panel stat-card">
        <div className="stat-label">Average Rating</div>
        <div className="stat-value">
           {stats.averageRating} <span style={{fontSize:'1.5rem', color:'#fbbf24'}}>★</span>
        </div>
        <div style={{fontSize:'0.8rem', opacity:0.6}}>Based on {stats.totalRatings} reviews</div>
      </div>

      <div className="glass-panel stat-card">
        <div className="stat-label">Total Ratings</div>
        <div className="stat-value">{stats.totalRatings}</div>
        <div style={{fontSize:'0.8rem', opacity:0.6}}>Lifetime count</div>
      </div>

      <div className="glass-panel stat-card">
        <div className="stat-label">Student Engagement</div>
        <div className="stat-value">{stats.engagementScore}</div>
        <div style={{fontSize:'0.8rem', opacity:0.6}}>Interactions & Reactions</div>
      </div>

      <div className="glass-panel stat-card">
        <div className="stat-label">Top Tags</div>
        <div style={{marginTop: 15, display:'flex', flexWrap:'wrap', justifyContent:'center', gap:8}}>
           {stats.topTags.length > 0 ? stats.topTags.map(tag => (
               <span key={tag} style={{
                   background: 'rgba(59, 130, 246, 0.1)', 
                   color: '#3b82f6', 
                   padding:'4px 10px', 
                   borderRadius:15, 
                   fontSize:'0.8rem',
                   border:'1px solid rgba(59, 130, 246, 0.2)'
               }}>
                   {tag}
               </span>
           )) : <span style={{opacity:0.5}}>No tags yet</span>}
        </div>
      </div>
    </div>
  );
}
