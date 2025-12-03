import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../store/slices/themeSlice';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminRegisterUser from './AdminRegisterUser';
import AdminContent from './AdminContent';
import AdminSettings from './AdminSettings';
import { useAdminData } from './useAdminData';
import './AdminPanel.css';

export default function AdminEntry() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const theme = mode; // Alias for compatibility
  
  const { 
    stats, 
    users, 
    ratings, 
    logs, 
    deleteUser, 
    approveInstructor, 
    deleteRating,
    updateRatingStatus,
    flagRating,
    registerUser,
    updateUserStatus,
    banUser
  } = useAdminData();

  const [activePage, setActivePage] = useState('dashboard');

  // Access Control
  if (!user) return null; 
  if (user?.role !== 'admin') {
      return (
          <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#09090b', color:'white'}}>
              <div style={{textAlign:'center'}}>
                  <h1 style={{fontSize:'2rem', marginBottom:10}}>Access Denied</h1>
                  <p style={{opacity:0.7}}>You do not have permission to view this area.</p>
              </div>
          </div>
      );
  }

  const renderPage = () => {
      switch(activePage) {
          case 'users':
              return <AdminUsers 
                        users={users} 
                        onDelete={deleteUser} 
                        onApprove={approveInstructor} 
                        onBan={banUser}
                        onUpdateStatus={updateUserStatus}
                     />;
          case 'register':
              return <div className="fade-in"><AdminRegisterUser onRegister={registerUser} /></div>;
          case 'content':
          case 'logs': 
              return <AdminContent 
                        ratings={ratings} 
                        logs={logs} 
                        onDeleteRating={deleteRating} 
                        updateRatingStatus={updateRatingStatus}
                        flagRating={flagRating}
                        flagRating={flagRating}
                        view={activePage === 'logs' ? 'logs' : 'ratings'}
                     />;
          case 'settings':
              return <div className="fade-in"><AdminSettings /></div>;
          case 'dashboard':
          default:
              return <AdminDashboard stats={stats} />;
      }
  };

  return (
    <AdminLayout 
      activePage={activePage} 
      onNavigate={setActivePage} 
      themeMode={theme} 
      toggleTheme={() => dispatch(toggleTheme())}
      user={user}
    >
        {renderPage()}
    </AdminLayout>
  );
}
