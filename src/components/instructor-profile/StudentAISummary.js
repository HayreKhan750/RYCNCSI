import React from 'react';

export default function StudentAISummary({ stats, feedbacks }) {
  // Simulate AI generation based on stats
  const getSentiment = () => {
      if (!stats || !stats.averageRating) return 'Neutral';
      if (stats.averageRating >= 4.5) return 'Exceptional';
      if (stats.averageRating >= 4.0) return 'Very Positive';
      if (stats.averageRating >= 3.0) return 'Generally Positive';
      return 'Mixed';
  };

  const getSummaryText = () => {
      if (!stats || !stats.averageRating) return "Not enough data to generate a summary yet.";
      
      const sentiment = getSentiment();
      const count = stats.ratingCount || 0;
      const topTag = stats.topTags?.[0] || 'engaging';

      if (sentiment === 'Exceptional') {
          return `Students consistently rate this instructor as outstanding. The teaching style is frequently described as ${topTag}, and the course content is highly valued. This is a top-tier learning experience.`;
      } else if (sentiment === 'Very Positive') {
          return `Most students have a great experience. The instructor is praised for being ${topTag}, though some students note minor areas for improvement. Overall, a solid choice for this subject.`;
      } else if (sentiment === 'Generally Positive') {
          return `Opinions are generally favorable. While many find the class ${topTag}, others suggest that clarity or pacing could be improved. It's a good course if you are willing to put in the effort.`;
      } else {
          return `Reviews are mixed. Some students appreciate the ${topTag} aspects, but a significant number have raised concerns about teaching effectiveness or course organization.`;
      }
  };

  return (
    <div className="glass-card fade-in" style={{padding: 30, marginBottom: 30, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))', border: '1px solid rgba(139, 92, 246, 0.2)'}}>
        <div style={{display:'flex', alignItems:'center', gap:15, marginBottom:15}}>
            <div style={{fontSize:'1.5rem'}}>✨</div>
            <h3 style={{margin:0, background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>AI Class Insight</h3>
        </div>
        
        <p style={{lineHeight: 1.6, fontSize: '1.05rem', opacity: 0.9, margin: 0}}>
            {getSummaryText()}
        </p>

        <div style={{marginTop: 20, display:'flex', gap: 15, flexWrap:'wrap'}}>
            <div className="ai-badge">
                <span style={{opacity:0.7, fontSize:'0.8rem'}}>Overall Sentiment</span>
                <div style={{fontWeight:600, color:'#a78bfa'}}>{getSentiment()}</div>
            </div>
            <div className="ai-badge">
                <span style={{opacity:0.7, fontSize:'0.8rem'}}>Based On</span>
                <div style={{fontWeight:600}}>{stats?.ratingCount || 0} Verified Reviews</div>
            </div>
        </div>
    </div>
  );
}
