import React from 'react';

export default function AdminDashboard({ stats }) {
  // Mock Chart Data - In a real app, this would come from historical logs or a separate stats collection
  const trendData = [40, 65, 50, 80, 95, 70, 85];
  
  return (
    <div>
      {/* Stats Grid */}
      <div className="adm-grid">
        <div className="adm-glass adm-stat-card">
           <div className="stat-label">Total Students</div>
           <div className="stat-val" style={{color: 'var(--adm-accent)'}}>{stats.totalStudents}</div>
           <div className="status-badge success" style={{display:'inline-block'}}>Active</div>
        </div>
        <div className="adm-glass adm-stat-card">
           <div className="stat-label">Instructors</div>
           <div className="stat-val" style={{color: '#a78bfa'}}>{stats.totalInstructors}</div>
           <div className="status-badge warning" style={{display:'inline-block'}}>Verified</div>
        </div>
        <div className="adm-glass adm-stat-card">
           <div className="stat-label">Total Ratings</div>
           <div className="stat-val" style={{color: '#34d399'}}>{stats.totalRatings}</div>
           <div style={{fontSize:'0.8rem', color:'var(--adm-text-secondary)'}}>Avg 4.2 ★</div>
        </div>
        <div className="adm-glass adm-stat-card">
           <div className="stat-label">Flagged Content</div>
           <div className="stat-val" style={{color: 'var(--adm-danger)'}}>{stats.flaggedCount}</div>
           <div className="status-badge danger" style={{display:'inline-block'}}>Action Required</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="adm-grid" style={{gridTemplateColumns: '2fr 1fr'}}>
          <div className="adm-glass" style={{padding:24, height:350}}>
              <h3 style={{margin:'0 0 20px'}}>Platform Activity</h3>
              <svg className="chart-svg" viewBox="0 0 200 100" preserveAspectRatio="none">
                  <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--adm-accent)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="var(--adm-accent)" stopOpacity="0" />
                      </linearGradient>
                  </defs>
                  
                  {/* Grid */}
                  <line x1="0" y1="25" x2="200" y2="25" className="chart-grid" />
                  <line x1="0" y1="50" x2="200" y2="50" className="chart-grid" />
                  <line x1="0" y1="75" x2="200" y2="75" className="chart-grid" />

                  {/* Area */}
                  <polygon 
                     points={`0,100 ${trendData.map((v, i) => `${(i / (trendData.length-1)) * 200},${100 - v}`).join(' ')} 200,100`}
                     fill="url(#areaGradient)"
                  />
                  
                  {/* Line */}
                  <polyline 
                     points={trendData.map((v, i) => `${(i / (trendData.length-1)) * 200},${100 - v}`).join(' ')}
                     className="chart-line"
                  />
              </svg>
          </div>

          <div className="adm-glass" style={{padding:24, height:350}}>
              <h3 style={{margin:'0 0 20px'}}>User Distribution</h3>
              <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'20px'}}>
                  <div style={{
                      width: 180, height: 180, borderRadius:'50%', 
                      background: `conic-gradient(var(--adm-accent) 0% ${(stats.totalStudents / (stats.totalStudents + stats.totalInstructors || 1)) * 100}%, #a78bfa 0% 100%)`,
                      position: 'relative'
                  }}>
                      <div style={{position:'absolute', inset:30, background:'var(--adm-card-dark)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'}}>
                         <div style={{fontSize:'2rem', fontWeight:'bold'}}>{stats.totalStudents + stats.totalInstructors}</div>
                         <div style={{fontSize:'0.8rem', opacity:0.7}}>Total Users</div>
                      </div>
                  </div>
                  <div style={{display:'flex', gap:'15px', fontSize:'0.8rem'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'5px'}}><span style={{width:10, height:10, background:'var(--adm-accent)', borderRadius:'50%'}}></span> Students</div>
                    <div style={{display:'flex', alignItems:'center', gap:'5px'}}><span style={{width:10, height:10, background:'#a78bfa', borderRadius:'50%'}}></span> Instructors</div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
