import React, { useState } from 'react';

export default function AdminContent({ ratings, logs, onDeleteRating }) {
  const [tab, setTab] = useState('ratings'); // 'ratings' | 'logs'

  return (
    <div>
      <div style={{display:'flex', gap:12, marginBottom:24}}>
          <button className={`adm-btn ${tab === 'ratings' ? 'primary' : ''}`} onClick={() => setTab('ratings')}>Ratings & Feedback</button>
          <button className={`adm-btn ${tab === 'logs' ? 'primary' : ''}`} onClick={() => setTab('logs')}>Audit Logs</button>
      </div>

      {tab === 'ratings' && (
          <div className="adm-glass adm-table-container">
             <table className="adm-table">
                 <thead>
                     <tr>
                         <th>Instructor</th>
                         <th>Student</th>
                         <th>Rating</th>
                         <th>Feedback</th>
                         <th>Actions</th>
                     </tr>
                 </thead>
                 <tbody>
                     {ratings.map(rating => (
                         <tr key={rating.id}>
                             <td>{rating.instructorName}</td>
                             <td>{rating.studentName || 'Anonymous'}</td>
                             <td>
                                 <span style={{color:'#fbbf24', fontWeight:'bold'}}>{rating.rating} ★</span>
                             </td>
                             <td style={{maxWidth:300, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                 {rating.feedback || '-'}
                             </td>
                             <td>
                                 <button className="adm-btn danger" onClick={() => onDeleteRating(rating.id)}>Delete</button>
                             </td>
                         </tr>
                     ))}
                     {ratings.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:20}}>No ratings found</td></tr>}
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
