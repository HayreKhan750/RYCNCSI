import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

export default function AdminLayout({ children, activePage, onNavigate, themeMode, toggleTheme, user }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
      await dispatch(logoutUser());
      navigate('/login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'register', label: 'Register', icon: '➕' },
    { id: 'reports', label: 'Reports', icon: '🚩' },
    { id: 'logs', label: 'Audit Logs', icon: '📜' },
    { id: 'import', label: 'Data Migration', icon: '📥' }, // New Item
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className={`admin-root ${themeMode === 'light' ? 'light' : ''}`}>
      {/* Sidebar */}
      <aside className="adm-sidebar">
        <div className="adm-logo">CNCS Admin</div>
        <nav style={{flex:1}}>
          {navItems.map(item => (
            <div 
              key={item.id} 
              className={`adm-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => item.id === 'import' ? navigate('/admin/import') : onNavigate(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
        
        <div 
          className="adm-nav-item logout-btn" 
          style={{marginTop:'auto', marginBottom: 20, borderTop:'1px solid var(--adm-border-dark)', borderRadius:0, padding:'20px 16px'}} 
          onClick={handleLogout}
        >
           <span style={{color:'var(--adm-danger)'}}>🚪</span>
           <span style={{color:'var(--adm-danger)', fontWeight:600}}>Logout</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="adm-main">
        <header className="adm-header">
           <div>
             <h2 style={{margin:0, fontSize:'1.2rem'}}>
                {navItems.find(n => n.id === activePage)?.label || 'Dashboard'}
             </h2>
             <p className="adm-subtitle" style={{fontSize:'0.8rem'}}>Welcome back, {user?.displayName || 'Admin'}</p>
           </div>
           
           <div style={{display:'flex', gap:16, alignItems:'center'}}>
              <button className="adm-btn" onClick={toggleTheme}>
                  {themeMode === 'light' ? '🌙 Dark Mode' : '☀ Light Mode'}
              </button>
              <div className="adm-glass" style={{width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>
                  A
              </div>
           </div>
        </header>

        <div className="fade-in-up">
          {children}
        </div>
      </main>
    </div>
  );
}
