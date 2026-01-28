import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../store/slices/themeSlice';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminRegisterUser from './AdminRegisterUser';
import AdminContent from './AdminContent';
import AdminSettings from './AdminSettings';
import AdminImporter from '../../pages/AdminImporter';
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
    reports,
    logs, 
    deleteUser, 
    approveInstructor, 
    deleteRating,
    updateRatingStatus,
    flagRating,
    registerUser,
    updateUserStatus,
    banUser,
    updateUserProfile,
    fetchReports,
    resolveReport
  } = useAdminData();

  const [activePage, setActivePage] = useState('dashboard');

  // Fetch Reports when page becomes 'reports'
  React.useEffect(() => {
      if (activePage === 'reports' && fetchReports) {
          fetchReports('open');
      }
  }, [activePage, fetchReports]);

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
                    onUpdateProfile={updateUserProfile} 
                 />;
          case 'register':
              return <div className="fade-in"><AdminRegisterUser onRegister={registerUser} /></div>;
          case 'import':
               // Dynamic import or direct component
               return <div className="fade-in"><AdminImporter /></div>;
          case 'content':
          case 'logs': 
          case 'reports': // Handle reports case
              return <AdminContent 
                        ratings={ratings} 
                        logs={logs} 
                        reports={reports} // Pass reports
                        onDeleteRating={deleteRating} 
                        updateRatingStatus={updateRatingStatus}
                        flagRating={flagRating}
                        resolveReport={resolveReport} // Pass resolve function
                        view={activePage} // View matches page id (content, logs, reports)
                     />;
          case 'settings':
              return <div className="fade-in"><AdminSettings /></div>;
          case 'dashboard':
          default:
              return <AdminDashboard stats={stats} ratings={ratings} users={users} />;
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
