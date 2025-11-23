import React, { useState, useMemo } from 'react';

export default function AdminContent({ ratings, logs, onDeleteRating, updateRatingStatus, flagRating }) {
  const [tab, setTab] = useState('ratings'); // 'ratings' | 'logs'
  const [filter, setFilter] = useState('all'); // 'all' | 'flagged' | 'pending' | 'reviewed'
  const [search, setSearch] = useState('');

  const filteredRatings = useMemo(() => {
    return ratings.filter(r => {
      const matchesFilter = filter === 'all' ? true : (r.status || 'PENDING') === filter.toUpperCase();
      const matchesSearch = search === '' || 
        (r.instructorId && r.instructorId.toLowerCase().includes(search.toLowerCase())) ||
        (r.studentId && r.studentId.toLowerCase().includes(search.toLowerCase())) ||
        (r.feedback && r.feedback.toLowerCase().includes(search.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [ratings, filter, search]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'FLAGGED': return <span className="status-badge danger">Flagged</span>;
      case 'REVIEWED': return <span className="status-badge success">Reviewed</span>;
      default: return <span className="status-badge warning">Pending</span>;
    }
  };

  return (
    <div>
      <div style={{display:'flex', gap:12, marginBottom:24}}>
          <button className={`adm-btn ${tab === 'ratings' ? 'primary' : ''}`} onClick={() => setTab('ratings')}>Ratings & Feedback</button>
          <button className={`adm-btn ${tab === 'logs' ? 'primary' : ''}`} onClick={() => setTab('logs')}>Audit Logs</button>
      </div>

      {tab === 'ratings' && (
          <div className="adm-glass adm-table-container">
             <div style={{padding: '20px', display: 'flex', gap: '15px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                <input 
                  type="text" 
                  placeholder="Search feedback..." 
                  className="admin-input" 
                  style={{width: '300px'}}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select 
                  className="admin-input" 
                  style={{width: '150px'}}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="flagged">Flagged</option>
                  <option value="reviewed">Reviewed</option>
                </select>
             </div>

             <table className="adm-table">
                 <thead>
                     <tr>
                         <th>Status</th>
                         <th>Instructor</th>
                         <th>Rating</th>
                         <th>Feedback</th>
                         <th>Actions</th>
                     </tr>
                 </thead>
                 <tbody>
                     {filteredRatings.map(rating => (
                         <tr key={rating.id}>
                             <td>{getStatusBadge(rating.status || 'PENDING')}</td>
                             <td>{rating.instructorId || 'Unknown'}</td>
                             <td>
                                 <span style={{color:'#fbbf24', fontWeight:'bold'}}>{rating.ratingValue} ★</span>
                             </td>
                             <td style={{maxWidth:300}}>
                                 <div style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                    {rating.feedback || '-'}
                                 </div>
                                 {rating.tags && (
                                   <div style={{display:'flex', gap:'5px', marginTop:'5px', flexWrap:'wrap'}}>
                                     {rating.tags.map(t => <span key={t} style={{fontSize:'10px', background:'rgba(255,255,255,0.1)', padding:'2px 6px', borderRadius:'10px'}}>{t}</span>)}
                                   </div>
                                 )}
                             </td>
                             <td>
                                 <div style={{display:'flex', gap:'8px'}}>
                                   <button className="adm-btn success" style={{padding:'4px 8px', fontSize:'12px'}} onClick={() => updateRatingStatus(rating.id, 'REVIEWED')}>✓</button>
                                   <button className="adm-btn warning" style={{padding:'4px 8px', fontSize:'12px'}} onClick={() => flagRating(rating.id)}>🚩</button>
                                   <button className="adm-btn danger" style={{padding:'4px 8px', fontSize:'12px'}} onClick={() => onDeleteRating(rating.id)}>🗑️</button>
                                 </div>
                             </td>
                         </tr>
                     ))}
                     {filteredRatings.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:20}}>No ratings found matching filters</td></tr>}
                 </tbody>
             </table>
          </div>
      )}

      {tab === 'logs' && (
          <div className="adm-glass adm-table-container">
             <table className="adm-table">
                 <thead>
                     <tr>
                         <th>Action</th>
                         <th>Target ID</th>
                         <th>Details</th>
                         <th>Time</th>
                     </tr>
                 </thead>
                 <tbody>
                     {logs.map(log => (
                         <tr key={log.id}>
                             <td><span className="status-badge warning">{log.action}</span></td>
                             <td style={{fontFamily:'monospace', opacity:0.7}}>{log.target}</td>
                             <td>{log.details}</td>
                             <td style={{opacity:0.6}}>{log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'Just now'}</td>
                         </tr>
                     ))}
                 </tbody>
             </table>
          </div>
      )}
    </div>
  );
}
