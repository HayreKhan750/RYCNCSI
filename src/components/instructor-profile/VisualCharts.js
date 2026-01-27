import React from 'react';

export default function VisualCharts({ data, compact = false }) {
  // Data validation
  const trend = data.trend || [];
  const tags = data.tags || [];
  const distribution = data.distribution || [];

  const maxTagVal = Math.max(...tags.map(d => d.value), 1);

  if (compact) {
      return (
        <div style={{height: '100%', width: '100%', padding: 20}}>
           {/* Line Chart Only for Compact View */}
           <h4 style={{opacity:0.7, marginBottom:10, marginTop: 0}}>Rating Trend</h4>
           <div style={{height: 160, position:'relative', borderLeft:'1px solid var(--border-subtle)', borderBottom:'1px solid var(--border-subtle)'}}>
               <svg viewBox="0 0 100 50" preserveAspectRatio="none" style={{width:'100%', height:'100%', overflow:'visible'}}>
                   <defs>
                      <linearGradient id="lineGradientCompact" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="var(--primary)" />
                          <stop offset="100%" stopColor="var(--accent-pink)" />
                      </linearGradient>
                   </defs>
                   {trend.length > 1 && (
                       <polyline
                           points={trend.map((d, i) => {
                               const x = (i / (trend.length - 1)) * 100;
                               const y = 50 - (d.value * 10);
                               return `${x},${y}`;
                           }).join(' ')}
                           fill="none"
                           stroke="url(#lineGradientCompact)"
                           strokeWidth="2"
                           strokeLinecap="round"
                           filter="drop-shadow(0 0 4px rgba(99, 102, 241, 0.3))"
                       />
                   )}
                   {trend.map((d, i) => (
                       <circle 
                          key={i} 
                          cx={(i / (trend.length - 1)) * 100} 
                          cy={50 - (d.value * 10)} 
                          r="2" 
                          fill="var(--bg-elevated)"
                          stroke="var(--primary)"
                          strokeWidth="1"
                       />
                   ))}
               </svg>
           </div>
           <div style={{display:'flex', justifyContent:'space-between', marginTop:5, fontSize:'0.7rem', opacity:0.5}}>
               <span>{trend[0]?.label}</span>
               <span>{trend[trend.length-1]?.label}</span>
           </div>
        </div>
      );
  }

  // State for timeframe
  const [timeframe, setTimeframe] = React.useState('3M');

  // Calculate Spline Path (Smooth Curve)
  const getPath = (points, isArea = false) => {
      if (points.length === 0) return '';
      
      const format = (n) => n.toFixed(2);
      
      // Control point logic for smooth bezier
      const controlPoint = (current, previous, next, reverse) => {
          const p = previous || current;
          const n = next || current;
          const smoothing = 0.2;
          const o = {
              length: Math.sqrt(Math.pow(n[0] - p[0], 2) + Math.pow(n[1] - p[1], 2)),
              angle: Math.atan2(n[1] - p[1], n[0] - p[0])
          };
          const angle = o.angle + (reverse ? Math.PI : 0);
          const length = o.length * smoothing;
          const x = current[0] + Math.cos(angle) * length;
          const y = current[1] + Math.sin(angle) * length;
          return [x, y];
      };

      const dataPoints = points.map((d, i) => {
          const x = (i / (points.length - 1)) * 100;
          const y = 50 - (d.value * 8); // Scale
          return [x, y];
      });

      const d = dataPoints.reduce((acc, point, i, a) => {
          if (i === 0) return `M ${format(point[0])},${format(point[1])}`;
          const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
          const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
          return `${acc} C ${format(cpsX)},${format(cpsY)} ${format(cpeX)},${format(cpeY)} ${format(point[0])},${format(point[1])}`;
      }, '');

      if (isArea) {
         return `${d} L 100,50 L 0,50 Z`;
      }
      return d;
  };

  return (
    <div className="glass-card chart-wrapper" style={{display:'block', height:'auto', padding:30}}>
       <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30}}>
           <h2 style={{marginTop:0, fontSize:'1.5rem', background: 'linear-gradient(90deg, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Performance Analytics</h2>
           <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              className="chart-select"
              style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', padding: '8px 16px', borderRadius: 12, outline: 'none', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: 500
              }}
           >
               <option value="3M">Last 3 Months</option>
               <option value="6M">Last 6 Months</option>
               <option value="1Y">Last Year</option>
           </select>
       </div>
       
       <div style={{display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40}}>
          
          {/* Line Chart */}
          <div>
              <h4 style={{opacity:0.7, marginBottom:20, textTransform: 'uppercase', letterSpacing:1, fontSize:'0.8rem'}}>Engagement Trends</h4>
              <div style={{height: 220, position:'relative', borderRadius: 16, background: 'rgba(255,255,255,0.02)', padding: 10}}>
                 <svg viewBox="0 0 100 50" preserveAspectRatio="none" style={{width:'100%', height:'100%', overflow:'visible'}}>
                     <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#00f3ff" />
                            <stop offset="100%" stopColor="#bc13fe" />
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#bc13fe" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#bc13fe" stopOpacity="0" />
                        </linearGradient>
                     </defs>
                     
                     {/* Horizontal Guide Lines */}
                     <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />
                     <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />
                     <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />

                     {trend.length > 1 && (
                         <>
                             <path d={getPath(trend, true)} fill="url(#areaGradient)" />
                             <path d={getPath(trend)} fill="none" stroke="url(#lineGradient)" strokeWidth="1.5" strokeLinecap="round" filter="drop-shadow(0 0 8px rgba(188, 19, 254, 0.4))" />
                         </>
                     )}
                     
                     {trend.map((d, i) => (
                         <circle 
                            key={i} 
                            cx={(i / (trend.length - 1)) * 100} 
                            cy={50 - (d.value * 8)} 
                            r="1.5" 
                            fill="#0f172a" 
                            stroke="#fff"
                            strokeWidth="0.5"
                         />
                     ))}
                 </svg>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', marginTop:15, fontSize:'0.75rem', opacity:0.6, padding: '0 10px'}}>
                  <span>{trend[0]?.label}</span>
                  <span>{trend[trend.length-1]?.label}</span>
              </div>
          </div>

          {/* Bar Chart */}
          <div>
              <h4 style={{opacity:0.7, marginBottom:20}}>Top Tags</h4>
              <div style={{height: 200, display:'flex', flexDirection:'column', justifyContent:'space-around'}}>
                  {tags.map((t, i) => (
                      <div key={i} style={{display:'flex', alignItems:'center', gap:10}}>
                          <div style={{width:80, fontSize:'0.8rem', textAlign:'right', opacity:0.8}}>{t.label}</div>
                          <div style={{flex:1, height:8, background:'rgba(255,255,255,0.05)', borderRadius:4}}>
                              <div style={{
                                  width: `${(t.value / maxTagVal) * 100}%`,
                                  height:'100%',
                                  background: 'linear-gradient(90deg, #00f3ff, #bc13fe)',
                                  borderRadius:4,
                                  boxShadow: '0 0 10px rgba(188, 19, 254, 0.3)'
                              }}></div>
                          </div>
                          <div style={{width:30, fontSize:'0.8rem', fontWeight:'bold'}}>{t.value}</div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Distribution (Pie approx) */}
          <div>
             <h4 style={{opacity:0.7, marginBottom:20}}>Course Distribution</h4>
             <div style={{height: 200, display:'flex', alignItems:'center', justifyContent:'center'}}>
                 <div style={{
                     width: 150,
                     height: 150,
                     borderRadius: '50%',
                     background: `conic-gradient(
                         #00f3ff 0% ${distribution.length > 0 ? 33 : 0}%, 
                         #bc13fe ${distribution.length > 0 ? 33 : 0}% ${distribution.length > 1 ? 66 : 0}%, 
                         #3b82f6 ${distribution.length > 1 ? 66 : 0}% 100%
                     )`,
                     position: 'relative',
                     boxShadow: '0 0 30px rgba(0,0,0,0.3)'
                 }}>
                     <div style={{
                         position:'absolute', inset:20, background: 'rgba(20,20,40,0.9)', borderRadius:'50%',
                         display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'
                     }}>
                         <span style={{fontSize:'1.5rem', fontWeight:'bold'}}>{distribution.length}</span>
                         <span style={{fontSize:'0.7rem', opacity:0.6}}>Courses</span>
                     </div>
                 </div>
             </div>
          </div>
          
       </div>
    </div>
  );
}
