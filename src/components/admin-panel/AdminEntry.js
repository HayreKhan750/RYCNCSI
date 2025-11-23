import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useAdminData } from './useAdminData';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminContent from './AdminContent';
import './AdminPanel.css';

import { useTheme } from '../../contexts/ThemeContext';

export default function AdminEntry() {
  const { user, userData } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { 
    loading: dataLoading, 
    stats, 
    users, 
    ratings, 
    logs, 
    deleteUser, 
    approveInstructor, 
    deleteRating,
    updateRatingStatus,
    flagRating
  } = useAdminData();

  const [activePage, setActivePage] = useState('dashboard');

  // Access Control
  // Assuming AdminRoute wraps this component in App.js, but double check here for safety
  if (!user) return null; 
  if (userData?.role !== 'admin') {
      return (
          <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#09090b', color:'white'}}>
              <div style={{textAlign:'center'}}>
                  <h1 style={{fontSize:'2rem', marginBottom:10}}>Access Denied</h1>
                  <p style={{opacity:0.7}}>You do not have permission to view this area.</p>
              </div>
          </div>
      );
  }

  if (dataLoading) {
      return (
          <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background: theme === 'dark' ? '#09090b' : '#f8fafc', color: theme === 'dark' ? 'white' : 'black'}}>
              Loading Control Panel...
          </div>
      );
  }

  const renderPage = () => {
      switch(activePage) {
          case 'users':
              return <AdminUsers users={users} onDelete={deleteUser} onApprove={approveInstructor} />;
          case 'content':
          case 'logs': // Combined content/logs logic for now or split if preferred
              return <AdminContent 
                        ratings={ratings} 
                        logs={logs} 
                        onDeleteRating={deleteRating} 
                        updateRatingStatus={updateRatingStatus}
                        flagRating={flagRating}
                     />;
          case 'settings':
              return <div className="adm-glass" style={{padding:40, textAlign:'center'}}>Settings Module Placeholder</div>;
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
      toggleTheme={toggleTheme}
      user={user}
    >
        {renderPage()}
    </AdminLayout>
  );
}
