import React from 'react';

export default function ChartsSection({ data }) {
  // Calculate max values for scaling
  const maxTagVal = Math.max(...data.tags.map(d => d.value), 10);
  
  return (
    <div className="charts-grid">
      {/* Custom CSS Bar Chart */}
      <div className="glass-panel">
        <h3 style={{marginTop:0, marginBottom:20}}>Tag Frequency</h3>
        <div className="chart-container">
           {data.tags.length === 0 && <p style={{opacity:0.5}}>No data available</p>}
           {data.tags.map((item, idx) => {
               const heightPct = (item.value / maxTagVal) * 80; 
               return (
                   <div key={idx} className="bar-group">
                       <div className="bar" style={{height: `${heightPct}%`}} title={`${item.value} times`}></div>
                       <div className="bar-label">{item.label}</div>
                   </div>
               );
           })}
        </div>
      </div>

      {/* Custom SVG Line Chart (Simulated) */}
      <div className="glass-panel">
         <h3 style={{marginTop:0, marginBottom:20}}>Rating Trend (Last 10)</h3>
         <div className="chart-container" style={{alignItems:'center', justifyContent:'center'}}>
             {data.trend.length < 2 ? (
                 <p style={{opacity:0.5}}>Not enough data</p>
             ) : (
                 <svg className="svg-chart" viewBox="0 0 100 50" preserveAspectRatio="none">
                     {/* Background grid lines */}
                     <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" />
                     <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" />
                     <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" />
                     
                     {/* Polyline */}
                     <polyline
                        points={data.trend.map((d, i) => {
                            const x = (i / (data.trend.length - 1)) * 100;
                            const y = 50 - (d.value * 10); // Scale 0-5 to 0-50 height (inverted)
                            return `${x},${y}`;
                        }).join(' ')}
                        className="line-path"
                     />
                     {/* Dots */}
                     {data.trend.map((d, i) => {
                         const x = (i / (data.trend.length - 1)) * 100;
                         const y = 50 - (d.value * 10);
                         return <circle key={i} cx={x} cy={y} r="1.5" className="chart-dot" />;
                     })}
                 </svg>
             )}
         </div>
      </div>
      
      {/* Course Performance List (Simple Visual) */}
      <div className="glass-panel">
          <h3 style={{marginTop:0, marginBottom:20}}>Course Performance</h3>
          <div style={{display:'flex', flexDirection:'column', gap:15}}>
              {data.courses.length === 0 && <p style={{opacity:0.5}}>No course data</p>}
              {data.courses.map((c, idx) => (
                  <div key={idx} style={{display:'flex', alignItems:'center', gap:10}}>
                      <div style={{width:50, fontWeight:'bold', fontSize:'0.9rem'}}>{c.label}</div>
                      <div style={{flex:1, height:8, background:'rgba(255,255,255,0.1)', borderRadius:4, overflow:'hidden'}}>
                          <div style={{
                              width: `${(c.value / 5) * 100}%`, 
                              height:'100%', 
                              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
                          }}></div>
                      </div>
                      <div style={{fontWeight:'bold'}}>{c.value}</div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}
