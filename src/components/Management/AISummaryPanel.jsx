import React, { useState, useEffect } from 'react';

const AISummaryPanel = ({ stats }) => {
    const [isThinking, setIsThinking] = useState(false);
    const [showDeepDive, setShowDeepDive] = useState(false);
    const [typedText, setTypedText] = useState('');
    const [scanLine, setScanLine] = useState(0);

    // Dynamic Data
    const engagementCount = stats?.engagementThisMonth || 0;
    const avgRating = parseFloat(stats?.avgRating || 0);
    const engagementTrend = engagementCount > 2 ? 'Positive' : 'Stable';
    const sentimentScore = Math.min(100, Math.round((avgRating / 5) * 100));
    
    // Generative Text
    const fullText = avgRating >= 4.5
        ? `Analysis complete. Exceptional academic performance detected. Faculty satisfaction rate is performing in the top percentile (${avgRating}/5.0). Recommendation: sustain current engagement strategies.`
        : `Analysis complete. Student engagement volume is currently at ${engagementCount} active signals. Average Rating is stabilizing at ${avgRating}/5.0. Anomaly detected in lower-variance departments.`;

    // Typewriter Effect
    useEffect(() => {
        if (!isThinking && !showDeepDive) {
            let i = 0;
            const timer = setInterval(() => {
                setTypedText(fullText.substring(0, i));
                i++;
                if (i > fullText.length) clearInterval(timer);
            }, 30);
            return () => clearInterval(timer);
        }
    }, [fullText, isThinking, showDeepDive]);

    // Handle Deep Dive Interaction
    const handleDeepDive = () => {
        setIsThinking(true);
        setTimeout(() => {
            setIsThinking(false);
            setShowDeepDive(true);
        }, 2000);
    };

    return (
        <div className="ai-panel relative overflow-hidden transition-all duration-500" style={{ 
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 0 40px rgba(99, 102, 241, 0.15)'
        }}>
             {/* Scanning Line Effect */}
             <div style={{
                 position: 'absolute',
                 top: 0,
                 left: 0,
                 right: 0,
                 height: '2px',
                 background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
                 opacity: 0.5,
                 zIndex: 0,
                 animation: 'scan 4s linear infinite'
             }}></div>

             {/* Background Orbs */}
             <div className="ai-bg-shape" style={{ top: '-50px', right: '-50px', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', width: '300px', height: '300px', animation: 'pulse 6s infinite' }}></div>

             <div style={{ position: 'relative', zIndex: 10 }}>
                 {/* Header */}
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <div style={{ 
                             width: '40px', height: '40px', borderRadius: '50%', 
                             background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
                             display: 'flex', alignItems: 'center', justifyContent: 'center',
                             boxShadow: '0 0 15px rgba(79, 70, 229, 0.5)'
                         }}>
                             <span style={{ fontSize: '1.2rem' }}>✨</span>
                         </div>
                         <div>
                             <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>
                                 AI Executive Insight
                             </h2>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                 <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></span>
                                 <p style={{ opacity: 0.7, fontSize: '0.75rem', margin: 0, letterSpacing: '1px', textTransform: 'uppercase', color: '#cbd5e1' }}>
                                     System Online • Real-time
                                 </p>
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* Content Area */}
                 <div style={{ minHeight: '180px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                     
                     {isThinking ? (
                         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                             <div className="spinner-loader" style={{ marginBottom: '16px' }}></div>
                             <p style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>Processing neural nodes...</p>
                         </div>
                     ) : showDeepDive ? (
                         <div className="fade-in">
                             {/* Deep Dive Visualization */}
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                 <div className="stat-pod" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                     <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8' }}>Sentiment Score</div>
                                     <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{sentimentScore}%</div>
                                     <div style={{ height: '4px', background: '#334155', borderRadius: '2px', marginTop: '8px' }}>
                                         <div style={{ width: `${sentimentScore}%`, height: '100%', background: '#4f46e5', borderRadius: '2px' }}></div>
                                     </div>
                                 </div>
                                 <div className="stat-pod" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                     <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8' }}>Keywords</div>
                                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                         {['Knowledge', 'Punctual', 'Fair'].map(k => (
                                             <span key={k} style={{ fontSize: '0.7rem', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', padding: '2px 6px', borderRadius: '4px' }}>{k}</span>
                                         ))}
                                     </div>
                                 </div>
                             </div>
                             <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderLeft: '3px solid #10b981', borderRadius: '4px' }}>
                                 <p style={{ margin: 0, fontSize: '0.85rem', color: '#dcfce7' }}>
                                     <strong>Projection:</strong> Consistent performance indicates a 92% probability of positive end-of-term feedback.
                                 </p>
                             </div>
                             <button 
                                 onClick={() => setShowDeepDive(false)}
                                 style={{ marginTop: '16px', fontSize: '0.8rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                             >
                                 ← Return to Summary
                             </button>
                         </div>
                     ) : (
                         <>
                             {/* Main Typing Text */}
                             <div style={{ 
                                 background: 'rgba(0,0,0,0.2)', 
                                 padding: '16px', 
                                 borderRadius: '12px', 
                                 border: '1px solid rgba(255,255,255,0.05)',
                                 fontFamily: '"Space Grotesk", sans-serif',
                                 position: 'relative'
                             }}>
                                 <p style={{ fontSize: '1rem', lineHeight: 1.6, margin: 0, color: '#e2e8f0', minHeight: '80px' }}>
                                     {typedText}<span className="cursor-blink">|</span>
                                 </p>
                             </div>

                             {/* Action Row */}
                             <div style={{ display: 'flex', gap: '12px' }}>
                                 <div style={{ flex: 1, padding: '12px', borderRadius: '12px', background: engagementTrend === 'Positive' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)', border: `1px solid ${engagementTrend === 'Positive' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                     <span style={{ fontSize: '1.2rem' }}>{engagementTrend === 'Positive' ? '📈' : '⚖️'}</span>
                                     <div>
                                         <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase' }}>Trend</div>
                                         <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{engagementTrend} Growth</div>
                                     </div>
                                 </div>
                             </div>
                         </>
                     )}
                 </div>
             </div>

             {/* Footer Control */}
             {!showDeepDive && !isThinking && (
                 <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '20px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                          ID: {stats?.lastUpdated ? `SYNC-${stats.lastUpdated}` : 'SYNC-LIVE-884'}
                      </div>
                      <button 
                          onClick={handleDeepDive}
                          className="premium-btn-glow"
                          style={{ 
                              background: 'rgba(99, 102, 241, 0.1)', 
                              color: '#818cf8',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              padding: '8px 16px',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                          }}
                      >
                          INITIATE DEEP SCAN <span style={{ fontSize: '1rem' }}>→</span>
                      </button>
                 </div>
             )}

             <style>{`
                 @keyframes scan {
                     0% { top: 0%; opacity: 0; }
                     10% { opacity: 0.5; }
                     90% { opacity: 0.5; }
                     100% { top: 100%; opacity: 0; }
                 }
                 .cursor-blink { animation: blink 1s step-end infinite; }
                 @keyframes blink { 50% { opacity: 0; } }
                 .premium-btn-glow:hover {
                     background: rgba(99, 102, 241, 0.2) !important;
                     box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
                     transform: translateY(-1px);
                 }
             `}</style>
        </div>
    );
};

export default AISummaryPanel;
