import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAdminData } from './admin-panel/useAdminData';
import AdminDashboard from './admin-panel/AdminDashboard';
import AdminContent from './admin-panel/AdminContent';
import './AdminPanel.css';

export default function AdminPanel() {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin' || user?.role === 'management'; // Allow management role
  const [activeTab, setActiveTab] = useState('overview');
  
  // Use Real Data Hook
  const { 
      stats, 
      users, 
      ratings,
      reports, 
      logs, 
      loading, 
      refresh,
      deleteUser, 
      approveInstructor, // Ensure this exists in hook or add it
      deleteRating, 
      updateRatingStatus, 
      flagRating,
      resolveReport,
      fetchReports,
      updateUserStatus,
      updateUserProfile
  } = useAdminData();

  // Refresh on mount
  useEffect(() => {
      refresh();
  }, []);

  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      {/* Sidebar / Navigation (Vertical or Horizontal based on design, keeping Horizontal for now to match file) */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({stats?.totalStudents + stats?.totalInstructors || 0})
        </button>
        <button
          className={`admin-tab ${activeTab === 'ratings' ? 'active' : ''}`}
          onClick={() => setActiveTab('ratings')}
        >
          Feedback ({ratings?.length || 0})
        </button>
        <button
          className={`admin-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => {
              setActiveTab('reports');
              if (fetchReports) fetchReports('open');
          }}
        >
          Reports ({reports?.length || 0})
        </button>
        <button
          className={`admin-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          System Logs
        </button>
        <button
          className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="admin-content-area" style={{padding: '20px'}}>
        {loading && <div style={{opacity:0.5, marginBottom:10}}>Syncing with database...</div>}
        
        {activeTab === 'overview' && (
          <AdminDashboard stats={stats} ratings={ratings} />
        )}

        {activeTab === 'users' && (
           <div className="users-section">
               <div className="adm-glass adm-table-container">
                 <table className="adm-table">
                   <thead>
                     <tr>
                       <th>Name</th>
                       <th>Email</th>
                       <th>Role</th>
                       <th>Status</th>
                       <th>Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {users.map(u => (
                       <tr key={u.id}>
                         <td>
                             <div style={{fontWeight:'bold'}}>{u.displayName || u.name || 'N/A'}</div>
                             <div style={{fontSize:'0.8rem', opacity:0.7}}>{u.uid}</div>
                         </td>
                         <td>{u.email}</td>
                         <td>
                             <span className={`status-badge ${u.role === 'admin' ? 'danger' : u.role === 'instructor' ? 'warning' : 'success'}`}>
                                 {u.role}
                             </span>
                         </td>
                         <td>
                             {u.status === 'pending' ? (
                                 <span className="status-badge warning">Pending</span>
                             ) : (
                                 <span className="status-badge success">Active</span>
                             )}
                         </td>
                         <td>
                             <button className="adm-btn danger" onClick={() => deleteUser(u.id)}>Delete</button>
                             {u.role === 'instructor' && u.status === 'pending' && (
                                 <button className="adm-btn success" onClick={() => approveInstructor(u.id)}>Approve</button>
                             )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
           </div>
        )}

        {activeTab === 'ratings' && (
          <AdminContent 
             ratings={ratings || []} 
             view="ratings"
             onDeleteRating={deleteRating}
             updateRatingStatus={updateRatingStatus}
             flagRating={flagRating}
          />
        )}

        {activeTab === 'reports' && (
          <AdminContent 
             reports={reports || []}
             view="reports"
             resolveReport={resolveReport}
             onDeleteRating={deleteRating} // Reuse delete for "Delete Content" action
          />
        )}

        {activeTab === 'logs' && (
            <AdminContent 
                logs={logs || []}
                view="logs"
            />
        )}

        {activeTab === 'settings' && (
           <div className="settings-section adm-glass p-6">
               <h3>Data Export</h3>
               <button onClick={() => {
                   const data = { users, ratings, stats, logs };
                   const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                   const url = URL.createObjectURL(blob);
                   const a = document.createElement('a');
                   a.href = url;
                   a.download = `management_export_${new Date().toISOString().split('T')[0]}.json`;
                   a.click();
               }} className="btn-header-action">
                   Export All Data (JSON)
               </button>
           </div>
        )}
      </div>
    </div>
  );
}




