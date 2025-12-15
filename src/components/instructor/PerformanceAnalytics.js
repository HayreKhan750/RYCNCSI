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

// CSS-only Trend Chart
const TrendChart = ({ data }) => {
    if (!data || data.length === 0) return <div style={{textAlign:'center', color:'#94a3b8', padding:'2rem'}}>No trend data</div>;

    const width = 100;
    const height = 50;
    
    // Normalize data (5.0 max)
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.value / 5) * height);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div style={{position:'relative', width:'100%', aspectRatio:'2/1', background:'rgba(248, 250, 252, 0.5)', borderRadius:'12px', border:'1px solid #e2e8f0', overflow:'hidden'}}>
             <svg viewBox={`0 0 ${width} ${height}`} style={{width:'100%', height:'100%', padding:'1rem', overflow:'visible'}} preserveAspectRatio="none">
                 <defs>
                     <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                         <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                         <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                     </linearGradient>
                 </defs>
                 
                 {data.length > 1 && (
                     <path 
                        d={`M0,${height} ${points} L${width},${height} Z`} 
                        fill="url(#gradient)" 
                     />
                 )}

                 <polyline 
                    fill="none" 
                    stroke="#4f46e5" 
                    strokeWidth="2" 
                    points={points} 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                 />
                 
                 {data.map((d, i) => {
                     const x = (i / (data.length - 1)) * width;
                     const y = height - ((d.value / 5) * height);
                     return (
                         <circle key={i} cx={x} cy={y} r="3" fill="white" stroke="#4f46e5" strokeWidth="1.5" />
                     );
                 })}
             </svg>
             
             <div style={{display:'flex', justifyContent:'space-between', padding:'0 1rem 0.5rem', fontSize:'0.65rem', color:'#94a3b8'}}>
                 <span>{data[0]?.label}</span>
                 <span>{data[data.length-1]?.label}</span>
             </div>
        </div>
    );
};


const PerformanceAnalytics = () => {
    const { chartData } = useInstructorProfile();

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="analytics-grid"
        >
            {/* Rating Trend */}
            <div className="chart-card">
                <div className="chart-header">
                    <h3 className="chart-title">Rating Trend</h3>
                    <p className="chart-subtitle">Average rating over last 6 months</p>
                </div>
                <TrendChart data={chartData.trend} />
            </div>

            {/* Tag Distribution */}
            <div className="chart-card">
                <div className="chart-header">
                    <h3 className="chart-title">Top Feedback Tags</h3>
                    <p className="chart-subtitle">Most frequent compliments</p>
                </div>
                <SimpleBarChart data={chartData.tags} />
            </div>
        </motion.div>
    );
};

// Export standalone charts for reuse
export { TrendChart, SimpleBarChart };
export default PerformanceAnalytics;
