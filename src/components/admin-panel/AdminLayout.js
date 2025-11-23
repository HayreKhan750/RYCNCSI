import React from 'react';

export default function AdminLayout({ children, activePage, onNavigate, themeMode, toggleTheme, user }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'content', label: 'Content & Flags', icon: '🛡' },
    { id: 'logs', label: 'Audit Logs', icon: '📜' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
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
              onClick={() => onNavigate(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
        
        <div className="adm-nav-item" style={{marginTop:'auto'}} onClick={() => alert('Logout logic here')}>
           <span>🚪</span>
           <span>Logout</span>
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
           
           <div style={{display:'flex', gap:16}}>
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
