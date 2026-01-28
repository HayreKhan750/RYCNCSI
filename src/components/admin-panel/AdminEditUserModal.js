import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

export default function AdminEditUserModal({ isOpen, onClose, user, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    role: 'student',
    department: '',
    bio: ''
  });
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || user.displayName || '',
        email: user.email || user.contactEmail || user.userInfo?.email || '', // Populate Email
        role: user.role || 'student',
        department: user.department || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsClosing(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(user.id, formData);
    // Force UI refresh after save to ensure sync
    // We can rely on the parent (AdminUsers) or global refresh, 
    // but typically onSave is async now in the parent wrapper I'll create/verify.
    handleClose();
  };

  if (!isOpen && !isClosing) return null;

  return ReactDOM.createPortal(
    <div 
      className={`modal-overlay ${isClosing ? 'fade-out' : 'fade-in'}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div 
        className={`modal-content ${isClosing ? 'scale-out' : 'scale-in'}`}
        style={{
          background: 'var(--bg-elevated)',
          width: '100%',
          maxWidth: '500px',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '32px',
          position: 'relative'
        }}
      >
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Edit User</h3>
            <button onClick={handleClose} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'var(--text-secondary)'}}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap: 20}}>
            
            <div style={{display:'flex', flexDirection:'column', gap: 20}}>
                {/* Full Width Name for Alignment */}
                <div className="adm-form-group">
                    <label style={{display:'block', marginBottom: 8, fontSize:'0.85rem', color:'var(--text-secondary)', fontWeight:500}}>Full Name</label>
                    <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        className="adm-input" 
                        required 
                        style={{width: '94%'}} /* Ensure visual alignment with textarea */
                    />
                </div>

                {/* Full Width Email */}
                <div className="adm-form-group">
                    <label style={{display:'block', marginBottom: 8, fontSize:'0.85rem', color:'var(--text-secondary)', fontWeight:500}}>Email Address</label>
                    <input 
                        type="email" 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        className="adm-input"
                        placeholder="user@example.com"
                        style={{width: '94%'}}
                    />
                </div>

                {/* Grid for Role & Department */}
                <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
                    <div className="adm-form-group">
                        <label style={{display:'block', marginBottom: 8, fontSize:'0.85rem', color:'var(--text-secondary)', fontWeight:500}}>Role</label>
                        <select 
                            value={formData.role} 
                            onChange={(e) => setFormData({...formData, role: e.target.value})} 
                            className="adm-select"
                            style={{width:'100%'}}
                        >
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="adm-form-group">
                        <label style={{display:'block', marginBottom: 8, fontSize:'0.85rem', color:'var(--text-secondary)', fontWeight:500}}>Department / Faculty</label>
                        <input 
                            type="text" 
                            value={formData.department} 
                            onChange={(e) => setFormData({...formData, department: e.target.value})} 
                            className="adm-input" 
                            placeholder={formData.role === 'student' ? 'Major' : 'Department'}
                        />
                    </div>
                </div>
            </div>

            {/* Full Width Bio */}
            <div className="adm-form-group">
                <label style={{display:'block', marginBottom: 8, fontSize:'0.85rem', color:'var(--text-secondary)', fontWeight:500}}>Bio / Profile Summary</label>
                <textarea 
                    value={formData.bio} 
                    onChange={(e) => setFormData({...formData, bio: e.target.value})} 
                    className="adm-input" 
                    rows={4}
                    style={{resize:'vertical', minHeight: 100}}
                />
            </div>

            {/* Action Buttons */}
            <div style={{marginTop: 10, display:'flex', gap:12, paddingTop: 20, borderTop: '1px solid var(--border-subtle)'}}>
                <button 
                    type="button" 
                    onClick={handleClose}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'var(--primary-gradient)', // Uses global theme gradient
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                    Save Changes
                </button>
            </div>
        </form>
      </div>
      <style>{`
        .fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .fade-out { animation: fadeOut 0.3s ease-in forwards; }
        .scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .scale-out { animation: scaleOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>,
    document.body
  );
}
