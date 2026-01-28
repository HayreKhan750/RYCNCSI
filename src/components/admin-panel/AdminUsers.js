import React, { useState } from 'react';
import PremiumModal from '../common/PremiumModal';
import AdminEditUserModal from './AdminEditUserModal';

export default function AdminUsers({ users, onDelete, onApprove, onBan, onUpdateStatus, onUpdateProfile }) {
  const [filter, setFilter] = useState('student'); // 'student' | 'instructor'
  const [searchTerm, setSearchTerm] = useState('');
  const [actionOpen, setActionOpen] = useState(null);
  
  // Modal States
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', type: 'warning', onConfirm: null });
  const [editModal, setEditModal] = useState({ open: false, user: null });

  // Robust Search & Filtering
  const filteredUsers = users.filter(u => {
      const matchRole = u.role === filter;
      if (!matchRole) return false;
      
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
          (u.name || '').toLowerCase().includes(term) ||
          (u.displayName || '').toLowerCase().includes(term) ||
          (u.email || '').toLowerCase().includes(term) ||
          (u.contactEmail || '').toLowerCase().includes(term) ||
          (u.department || '').toLowerCase().includes(term)
      );
  });

  const handleActionClick = (id) => {
      setActionOpen(actionOpen === id ? null : id);
  };

  const handleEditClick = (user) => {
      setEditModal({ open: true, user });
      setActionOpen(null);
  };

  const handleSaveEdit = async (uid, updatedData) => {
      if (onUpdateProfile) {
          await onUpdateProfile(uid, updatedData);
          // Wait a beat for DB propagation then refresh if available
          // Note: In a real app we'd await the dispatch result.
          // Assuming users prop updates via Redux automatically, but a fetch helps for hybrid references.
      } else {
          console.error("Update Profile function missing");
      }
  };

  const confirmAction = (title, message, type, action) => {
      setConfirmModal({
          open: true,
          title,
          message,
          type,
          onConfirm: () => {
              action();
              setConfirmModal(prev => ({ ...prev, open: false }));
              setActionOpen(null);
          }
      });
  };

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
          
          <input 
            type="text" 
            placeholder="Search users..." 
            className="adm-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      <div className="adm-glass adm-table-container" style={{minHeight: 400}}>
         <table className="adm-table">
             <thead>
                 <tr>
                     <th>User</th>
                     <th>Email</th>
                     <th>Status</th>
                     <th>Actions</th>
                 </tr>
             </thead>
             <tbody>
                 {filteredUsers.map(user => (
                     <tr key={user.id}>
                         <td>
                             <div style={{display:'flex', alignItems:'center', gap:12}}>
                                 <div style={{width:32, height:32, borderRadius:'50%', background:'#333', overflow:'hidden', flexShrink:0}}>
                                     {user.profilePictureUrl ? (
                                         <img src={user.profilePictureUrl} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                     ) : (
                                         <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', color:'white'}}>
                                             {(user.name || user.displayName || user.instructorName || user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                                         </div>
                                     )}
                                 </div>
                                 <div style={{display:'flex', flexDirection:'column'}}>
                                     <span style={{fontWeight:500}}>{user.name || user.displayName || user.instructorName || user.fullName || 'Unknown User'}</span>
                                     <span style={{fontSize:'0.75rem', opacity:0.5}}>{user.department || 'General'}</span>
                                 </div>
                             </div>
                         </td>
                         <td>{user.email || user.contactEmail || user.userInfo?.email || 'N/A'}</td>
                         <td>
                             {user.isBanned ? (
                                 <span className="status-badge danger">Banned</span>
                             ) : user.isSuspended ? (
                                 <span className="status-badge warning">Suspended</span>
                             ) : filter === 'instructor' && !user.status ? (
                                 <span className="status-badge warning">Pending</span>
                             ) : (
                                 <span className="status-badge success">Active</span>
                             )}
                         </td>
                         <td style={{position:'relative'}}>
                             <button className="adm-btn" onClick={() => handleActionClick(user.id)}>Actions ▼</button>
                             
                             {actionOpen === user.id && (
                                 <div className="adm-dropdown" style={{
                                     position:'absolute', 
                                     right:0, 
                                     top:'100%', 
                                     zIndex:10, 
                                     background:'var(--adm-card-dark)', 
                                     backdropFilter: 'blur(12px)',
                                     border:'1px solid var(--adm-border-dark)', 
                                     borderRadius:12, 
                                     padding:8,
                                     width: 180,
                                     boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
                                     display: 'flex',
                                     flexDirection: 'column',
                                     gap: 4
                                 }}>
                                     <button className="adm-dropdown-item" onClick={() => handleEditClick(user)}>
                                         <span>✏️</span> Edit Details
                                     </button>
                                     
                                     {filter === 'instructor' && user.status !== 'approved' && (
                                         <button className="adm-dropdown-item success" onClick={() => confirmAction('Approve Instructor', `Are you sure you want to approve ${user.name}?`, 'success', () => onApprove(user.id))}>
                                             <span>✅</span> Approve
                                         </button>
                                     )}
                                     
                                     {!user.isBanned && (
                                        <button className="adm-dropdown-item danger" onClick={() => confirmAction('Ban User', `Are you sure you want to ban ${user.name}?`, 'danger', () => onUpdateStatus(user.id, 'banned', 'Admin Action'))}>
                                            <span>🚫</span> Ban User
                                        </button>
                                     )}
                                     
                                     {user.isBanned && (
                                        <button className="adm-dropdown-item success" onClick={() => confirmAction('Unban User', `Are you sure you want to unban ${user.name}?`, 'success', () => onUpdateStatus(user.id, 'active', 'Unbanned'))}>
                                            <span>🔄</span> Unban
                                        </button>
                                     )}

                                     <button className="adm-dropdown-item danger" onClick={() => confirmAction('Delete User', `Are you sure you want to delete ${user.name}? This action cannot be undone.`, 'danger', () => onDelete(user.id))}>
                                         <span>🗑️</span> Delete
                                     </button>
                                 </div>
                             )}
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

      <PremiumModal 
          isOpen={confirmModal.open}
          onClose={() => setConfirmModal({ ...confirmModal, open: false })}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          onConfirm={confirmModal.onConfirm}
          confirmText="Confirm"
          cancelText="Cancel"
      />

      <AdminEditUserModal 
          isOpen={editModal.open}
          onClose={() => setEditModal({ ...editModal, open: false })}
          user={editModal.user}
          onSave={handleSaveEdit}
      />
    </div>
  );
}
