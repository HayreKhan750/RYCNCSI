import React, { useState, useMemo } from 'react';
import ConfirmationModal from '../ConfirmationModal';

export default function AdminContent({ ratings, logs, reports, onDeleteRating, updateRatingStatus, flagRating, resolveReport, view = 'ratings' }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'flagged' | 'pending' | 'reviewed'
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'rating' | 'report', id: string, feedbackId?: string }

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
      {/* No internal tabs - controlled by parent via 'view' prop */}

      {view === 'ratings' && (
          <div className="adm-glass adm-table-container">
             <div style={{padding: '20px', display: 'flex', gap: '15px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                <input 
                  type="text" 
                  placeholder="Search feedback..." 
                  className="adm-search" 
                  style={{width: '300px'}}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select 
                  className="adm-search" 
                  style={{width: '150px', cursor:'pointer'}}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all" style={{color:'black'}}>All Status</option>
                  <option value="pending" style={{color:'black'}}>Pending</option>
                  <option value="flagged" style={{color:'black'}}>Flagged</option>
                  <option value="reviewed" style={{color:'black'}}>Reviewed</option>
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

      {view === 'reports' && (
          <div className="adm-glass adm-table-container">
             <table className="adm-table">
                 <thead>
                     <tr>
                         <th>Status</th>
                         <th>Reason</th>
                         <th>Details</th>
                         <th>Flagged By</th>
                         <th>Actions</th>
                     </tr>
                 </thead>
                 <tbody>
                     {(reports || []).map(report => (
                         <tr key={report.id}>
                             <td>
                                <span className={`status-badge ${report.status === 'open' ? 'danger' : 'success'}`}>
                                    {report.status || 'OPEN'}
                                </span>
                             </td>
                             <td style={{fontWeight:'bold'}}>{report.reason}</td>
                             <td style={{opacity:0.8, maxWidth: '300px', overflow:'hidden', textOverflow:'ellipsis'}}>
                                {report.details || '-'}
                             </td>
                             <td style={{fontSize:'0.9rem'}}>
                                <div style={{display:'flex', flexDirection:'column'}}>
                                   <span style={{fontWeight:'bold', color: report.role === 'instructor' ? '#fbbf24' : 'inherit'}}>
                                     {report.role ? report.role.charAt(0).toUpperCase() + report.role.slice(1) : 'User'}
                                   </span>
                                   <span style={{fontSize:'0.8rem', opacity:0.6}}>{report.name || report.flaggedBy}</span>
                                </div>
                             </td>
                             <td>
                                 {report.status === 'open' ? (
                                    <div style={{display:'flex', gap:'8px'}}>
                                      <button 
                                        className="adm-btn success" 
                                        onClick={() => resolveReport(report.id, 'dismissed')}
                                        title="Dismiss / Reject Flag"
                                      >
                                        Dismiss
                                      </button>
                                      <button 
                                        className="adm-btn danger" 
                                        onClick={() => setDeleteConfirm({ type: 'report', id: report.id, feedbackId: report.feedbackId })}
                                        title="Delete Content & Resolve"
                                      >
                                        Delete Content
                                      </button>
                                    </div>
                                 ) : (
                                    <span style={{opacity:0.5, fontSize:'0.8rem'}}>Resolved: {report.resolution}</span>
                                 )}
                             </td>
                         </tr>
                     ))}
                     {(!reports || reports.length === 0) && <tr><td colSpan="5" style={{textAlign:'center', padding:20}}>No reports found</td></tr>}
                 </tbody>
             </table>
          </div>
      )}

      {view === 'logs' && (
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
      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Delete Content?"
        message="Are you sure you want to permanently delete this content? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={async () => {
            if (deleteConfirm?.type === 'rating') {
                await onDeleteRating(deleteConfirm.id);
            } else if (deleteConfirm?.type === 'report') {
                await onDeleteRating(deleteConfirm.feedbackId);
                await resolveReport(deleteConfirm.id, 'content_deleted');
            }
            setDeleteConfirm(null);
        }}
      />
    </div>
  );
}
