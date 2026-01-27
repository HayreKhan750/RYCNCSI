import React from 'react';
import { motion } from 'framer-motion';
import useInstructorProfile from '../../hooks/useInstructorProfile';

// CSS-only Bar Chart
const SimpleBarChart = ({ data, colorStyle }) => {
    if (!data || data.length === 0) return <div style={{textAlign:'center', color:'#94a3b8', padding:'2rem'}}>No data available</div>;

    const maxVal = Math.max(...data.map(d => Number(d.value)));

    return (
        <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', height:'160px', paddingTop:'1rem', gap:'0.5rem'}}>
            {data.map((item, idx) => (
                <div key={idx} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center'}}>
                    <div style={{position:'relative', width:'100%', display:'flex', justifyContent:'center', height:'100%', alignItems:'flex-end', cursor:'pointer'}} className="group">
                        <div 
                            style={{ 
                                width:'100%', maxWidth:'24px', borderRadius:'6px 6px 0 0', opacity:0.8, transition:'all 0.3s',
                                height: `${(item.value / maxVal) * 100}%`,
                                background: 'linear-gradient(to top, #10b981, #34d399)'
                            }}
                        ></div>
                        <span style={{position:'absolute', bottom:'-20px', fontSize:'0.65rem', color:'#94a3b8', fontWeight:600}}>{item.label}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Premium Spline Area Chart (Matches VisualCharts.js)
const TrendChart = ({ data }) => {
    if (!data || data.length === 0) return <div style={{textAlign:'center', color:'#94a3b8', padding:'2rem'}}>No trend data</div>;

    // Calculate Spline Path (Smooth Curve)
    const getPath = (points, isArea = false) => {
      if (points.length === 0) return '';
      const format = (n) => n.toFixed(2);
      
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
          // Scale: Max height 50. 
          // Let's use range 5-45 to give 5px padding top/bottom.
          // Value 0 -> y=45. Value 5 -> y=5.
          // slope = (5-45)/5 = -8. 
          const y = 45 - (Number(d.value) * 8); 
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
        <div style={{position:'relative', width:'100%', aspectRatio:'2/1', background:'rgba(255,255,255,0.02)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.05)', overflow:'hidden', padding: 10}}>
             <svg viewBox="0 0 100 50" preserveAspectRatio="none" style={{width:'100%', height:'100%', overflow:'visible'}}>
                 <defs>
                    <linearGradient id="splineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#00f3ff" />
                        <stop offset="100%" stopColor="#bc13fe" />
                    </linearGradient>
                    <linearGradient id="splineArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#bc13fe" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#bc13fe" stopOpacity="0" />
                    </linearGradient>
                 </defs>
                 
                 {/* Guides */}
                 <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />
                 <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />
                 <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="0.1" />

                 {data.length > 1 && (
                     <>
                         <path d={getPath(data, true)} fill="url(#splineArea)" />
                         <path d={getPath(data)} fill="none" stroke="url(#splineGradient)" strokeWidth="1.5" strokeLinecap="round" filter="drop-shadow(0 0 6px rgba(188, 19, 254, 0.4))" />
                     </>
                 )}
                 
                 {data.map((d, i) => {
                     // Don't render dots for zero values to avoid clutter
                     if (Number(d.value) === 0) return null;
                     
                     return (
                         <circle 
                            key={i} 
                            cx={(i / (data.length - 1)) * 100} 
                            cy={45 - (Number(d.value) * 8)} 
                            r="1.5" 
                            fill="#0f172a" 
                            stroke="#fff"
                            strokeWidth="0.5"
                         />
                     );
                 })}
             </svg>
             
             <div style={{display:'flex', justifyContent:'space-between', marginTop: 8, padding:'0 5px', fontSize:'0.7rem', color:'rgba(255,255,255,0.5)'}}>
                 <span>{data[0]?.label}</span>
                 <span>{data[data.length-1]?.label}</span>
             </div>
        </div>
    );
};


const PerformanceAnalytics = () => {
    const { chartData, feedbacks } = useInstructorProfile(); // feedbacks = myRatings
    const [timeframe, setTimeframe] = React.useState('1W'); // Default to "This Week"
    
    // Aggregation Engine: Converts raw feedback list into Trend Data
    const getRealTrendData = () => {
        if (!feedbacks || feedbacks.length === 0) return [];

        const now = new Date();
        const dataMap = new Map();
        let startDate = new Date();
        // Default Key Format (Daily)
        let formatKey = (d) => `${d.getMonth()+1}-${d.getDate()}`; 
        let displayLabel = (d) => `${d.getDate()}/${d.getMonth()+1}`;

        // 1. Determine Scope & Granularity
        switch(timeframe) {
            case '1W': 
                startDate.setDate(now.getDate() - 7);
                // Daily buckets
                break;
            case '1M':
                startDate.setMonth(now.getMonth() - 1);
                // Weekly buckets
                formatKey = (d) => {
                    const diff = Math.floor((d - startDate) / (1000 * 60 * 60 * 24));
                    const week = Math.floor(diff / 7);
                    return `W${week}`;
                };
                displayLabel = (d) => `Week ${Math.ceil((d.getDate())/7)}`;
                break;
            case '3M':
                startDate.setMonth(now.getMonth() - 3);
                // Monthly buckets
                formatKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;
                displayLabel = (d) => d.toLocaleString('default', { month: 'short' });
                break;
            default: // 6M (This Semester)
                startDate.setMonth(now.getMonth() - 6);
                formatKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;
                displayLabel = (d) => d.toLocaleString('default', { month: 'short' });
                break;
        }

        // 2. Iterate & Aggregate
        feedbacks.forEach(f => {
            const d = f.createdAt?.seconds ? new Date(f.createdAt.seconds * 1000) : new Date(f.createdAt || Date.now());
            if (d < startDate) return;

            const key = formatKey(d);
            
            if (!dataMap.has(key)) {
                dataMap.set(key, { sum: 0, count: 0, label: displayLabel(d), sortDate: d.getTime() });
            }
            const entry = dataMap.get(key);
            entry.sum += (Number(f.rating || f.overall || 0));
            entry.count += 1;
        });

        // 3. Convert to Array & Sort
        let results = Array.from(dataMap.values())
            .sort((a,b) => a.sortDate - b.sortDate)
            .map(item => ({
                label: item.label,
                value: (item.sum / item.count).toFixed(1)
            }));

        // Handle single point for visualization
        if (results.length === 1) {
            return [ {label: 'Start', value: results[0].value}, results[0] ];
        }
        
        // If empty and "Today" selected, show flat line
        if (results.length === 0 && timeframe === '1D') {
             return [{label: '00:00', value: 0}, {label: 'Now', value: 0}];
        }

        return results;
    };

    const hasRatings = feedbacks && feedbacks.length > 0;
    const displayData = hasRatings ? getRealTrendData() : [
        { label: 'No Data', value: 0 }, { label: 'No Data', value: 0 }
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="analytics-grid"
        >
            <style>{`
                .premium-select {
                    appearance: none;
                    background-color: #312e81; /* Indigo 900 */
                    color: white;
                    padding: 8px 16px;
                    padding-right: 32px;
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.1);
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px top 50%;
                    background-size: 10px auto;
                    transition: all 0.2s;
                }
                .premium-select:hover {
                    background-color: #4338ca; /* Indigo 700 */
                }
                .premium-select option {
                    background-color: #1e293b;
                    color: white;
                }
            `}</style>

            {/* Rating Trend */}
            <div className="chart-card">
                <div className="chart-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                        <h3 className="chart-title">Engagement Trends</h3>
                        <p className="chart-subtitle">{hasRatings ? 'Real Data' : 'Waiting for feedback'}</p>
                    </div>
                    <select 
                        value={timeframe} 
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="premium-select"
                    >
                        <option value="1W">This Week</option>
                        <option value="1M">Last Month</option>
                        <option value="3M">Last 3 Months</option>
                        <option value="6M">This Semester</option>
                    </select>
                </div>
                {hasRatings ? (
                    <TrendChart data={displayData} />
                ) : (
                    <div style={{height: 200, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)'}}>
                        Collect reviews to see trends.
                    </div>
                )}
            </div>


        </motion.div>
    );
};

// Export standalone charts for reuse
export { TrendChart, SimpleBarChart };
export default PerformanceAnalytics;
