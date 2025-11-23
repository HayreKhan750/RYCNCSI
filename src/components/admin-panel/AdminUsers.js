import React, { useState } from 'react';

export default function AdminUsers({ users, onDelete, onApprove }) {
  const [filter, setFilter] = useState('student'); // 'student' | 'instructor'

  const filteredUsers = users.filter(u => u.role === filter);

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:24}}>
          <div style={{display:'flex', gap:12}}>
              <button 
                className={`adm-btn ${filter === 'student' ? 'primary' : ''}`}
                onClick={() => setFilter('student')}
              >
                  Students
              </button>
              <button 
                className={`adm-btn ${filter === 'instructor' ? 'primary' : ''}`}
                onClick={() => setFilter('instructor')}
              >
                  Instructors
              </button>
          </div>
          
          <input type="text" placeholder="Search users..." className="adm-search" />
      </div>

      <div className="adm-glass adm-table-container">
         <table className="adm-table">
             <thead>
                 <tr>
                     <th>User</th>
                     <th>Email</th>
                     <th>Status</th>
                     <th>Joined</th>
                     <th>Actions</th>
                 </tr>
             </thead>
             <tbody>
                 {filteredUsers.map(user => (
                     <tr key={user.id}>
                         <td>
                             <div style={{display:'flex', alignItems:'center', gap:12}}>
                                 <div style={{width:32, height:32, borderRadius:'50%', background:'#333', overflow:'hidden'}}>
                                     {user.profilePictureUrl ? (
                                         <img src={user.profilePictureUrl} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                     ) : (
                                         <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem'}}>
                                             {user.name?.[0] || 'U'}
                                         </div>
                                     )}
                                 </div>
                                 <span style={{fontWeight:500}}>{user.name || 'Unknown'}</span>
                             </div>
                         </td>
                         <td>{user.email}</td>
                         <td>
                             {filter === 'instructor' && !user.status ? (
                                 <span className="status-badge warning">Pending</span>
                             ) : (
                                 <span className="status-badge success">Active</span>
                             )}
                         </td>
                         <td style={{opacity:0.7}}>
                            {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                         </td>
                         <td>
                             <div style={{display:'flex', gap:8}}>
                                 <button className="adm-btn">Edit</button>
                                 {filter === 'instructor' && user.status !== 'approved' && (
                                     <button className="adm-btn primary" onClick={() => onApprove(user.id)}>Approve</button>
                                 )}
                                 <button className="adm-btn danger" onClick={() => onDelete(user.id)}>Delete</button>
                             </div>
                         </td>
                     </tr>
                 ))}
                 {filteredUsers.length === 0 && (
                     <tr>
                         <td colSpan="5" style={{textAlign:'center', padding:40, opacity:0.5}}>No users found</td>
                     </tr>
                 )}
             </tbody>
         </table>
      </div>
    </div>
  );
}
