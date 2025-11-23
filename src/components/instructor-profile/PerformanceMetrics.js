import React from 'react';

export default function PerformanceMetrics({ stats }) {
  return (
    <div className="metrics-grid">
      <div className="glass-card metric-card">
         <div className="metric-value" style={{color: '#fbbf24'}}>
             {stats.avgRating}<span style={{fontSize:'1.5rem'}}>★</span>
         </div>
         <div className="metric-label">Avg Rating</div>
         <div style={{fontSize:'0.8rem', opacity:0.6, marginTop:5}}>{stats.ratingCount} Ratings</div>
      </div>

      <div className="glass-card metric-card">
         <div className="metric-value" style={{color: '#00f3ff'}}>
             {stats.reviewCount}
         </div>
         <div className="metric-label">Written Reviews</div>
      </div>

      <div className="glass-card metric-card">
         <div className="metric-value" style={{color: '#bc13fe'}}>
             {stats.engagement}
         </div>
         <div className="metric-label">Engagement Score</div>
         <div style={{fontSize:'0.8rem', opacity:0.6, marginTop:5}}>Likes & Replies</div>
      </div>

      <div className="glass-card metric-card">
         <div className="metric-value" style={{fontSize:'1.5rem', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60px'}}>
             {stats.topTags.length > 0 ? stats.topTags[0] : 'N/A'}
         </div>
         <div className="metric-label">Top Trait</div>
      </div>
    </div>
  );
}
