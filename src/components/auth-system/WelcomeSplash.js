import React from 'react';

export default function WelcomeSplash({ onFinish }) {
  // Auto-finish after animation
  React.useEffect(() => {
      const timer = setTimeout(onFinish, 2500);
      return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div style={{
        position:'fixed', top:0, left:0, width:'100%', height:'100%', 
        background:'#050505', zIndex:9999, 
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        animation: 'splashExit 0.5s ease forwards 2.2s'
    }}>
        {/* Glowing Logo Ring */}
        <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(59, 130, 246, 0.5)',
            animation:'popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            marginBottom: 24, position: 'relative'
        }}>
            <div style={{
                position:'absolute', width:'100%', height:'100%', borderRadius:'50%',
                border:'2px solid rgba(255,255,255,0.2)',
                animation:'ping 1.5s infinite'
            }}></div>
            <span style={{fontSize:'2.5rem'}}>🎓</span>
        </div>

        <h1 style={{
            color:'white', fontFamily:'Inter, sans-serif', fontWeight:800, fontSize:'2.5rem',
            background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            opacity:0, letterSpacing: '-0.02em',
            animation: 'fadeInUp 0.8s ease forwards 0.5s'
        }}>
            AcademicPulse
        </h1>
        <div style={{
            width: 40, height: 4, background:'linear-gradient(90deg, #3b82f6, #ec4899)', borderRadius:2, marginTop:24,
            animation: 'loadingBar 1.5s ease-in-out forwards 0.8s',
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
        }}></div>

        <style>{`
            @keyframes popIn { from { transform: scale(0); opacity:0; } to { transform: scale(1); opacity:1; } }
            @keyframes fadeInUp { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }
            @keyframes loadingBar { 0% { width:0; } 100% { width:150px; } }
            @keyframes splashExit { to { opacity:0; visibility:hidden; } }
            @keyframes ping { 
                0% { transform: scale(1); opacity: 0.8; }
                100% { transform: scale(1.5); opacity: 0; }
            }
        `}</style>
    </div>
  );
}
