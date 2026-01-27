import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import UploadProfileImage from '../common/UploadProfileImage';

export default function EditProfileModal({ profile, onSave, onClose, email, currentPhotoURL }) {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    bio: '',
    photoURL: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (profile) {
        setFormData({
            name: profile.name || profile.instructorName || '',
            department: profile.dept || profile.department || '',
            bio: profile.bio || '',
            photoURL: profile.profilePictureUrl || profile.photoURL || ''
        });
        // Use the passed prop as fallback if profile lacks URL
        setPreviewUrl(profile.profilePictureUrl || profile.photoURL || currentPhotoURL || '');
    }
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [profile, currentPhotoURL]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
          setError("Image size must be less than 5MB");
          return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
        setError("Full Name is required");
        return;
    }

    setLoading(true);
    setError('');
    try {
        await onSave({
            name: formData.name,
            department: formData.department,
            bio: formData.bio,
            photoURL: formData.photoURL
        }, imageFile); // Pass imageFile
        handleClose();
    } catch (err) {
        console.error(err);
        setError('Failed to update profile');
        setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div 
      className={`modal-overlay ${isClosing ? 'fade-out' : 'fade-in'}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
       <div 
         className={`edit-modal glass-card ${isClosing ? 'scale-out' : 'scale-in'}`}
         style={{
            background: 'var(--bg-elevated)',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '24px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--text-muted) transparent'
         }}
       >
           {/* Header Background */}
           <div style={{
             height: '120px',
             background: 'var(--primary-gradient)',
             position: 'relative',
             display: 'flex',
             justifyContent: 'flex-end',
             padding: '20px'
           }}>
             <button 
               onClick={handleClose}
               style={{
                 background: 'rgba(255, 255, 255, 0.2)',
                 border: 'none',
                 borderRadius: '50%',
                 width: '36px',
                 height: '36px',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 color: 'white',
                 fontSize: '1.2rem',
                 cursor: 'pointer',
                 backdropFilter: 'blur(4px)',
                 transition: 'background 0.2s'
               }}
               onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
               onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
             >
               &times;
             </button>
           </div>

           {/* Profile Image & Form */}
           <div style={{ padding: '0 32px 32px', marginTop: '-60px' }}>
               <form onSubmit={handleSubmit}>
                   
                   {/* Avatar Upload */}
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                       <UploadProfileImage 
                           currentImage={formData.photoURL || previewUrl} 
                           onUploadSuccess={(url) => {
                               setFormData(prev => ({ ...prev, photoURL: url }));
                               setPreviewUrl(url);
                           }}
                           userType="instructor"
                           userId={profile?.id}
                           name={formData.name}
                       />
                       <h2 style={{ margin: '16px 0 4px', fontSize: '1.5rem', color: 'var(--text-primary)' }}>Edit Profile</h2>
                       <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Update your instructor details</p>
                   </div>

                   {/* Form Fields */}
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                       
                       {/* Name */}
                       <div>
                           <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Full Name</label>
                           <input 
                               type="text" 
                               name="name" 
                               value={formData.name} 
                               onChange={handleChange} 
                               required 
                               placeholder="e.g. Dr. Sarah Smith"
                               style={{
                                   width: '100%',
                                   padding: '12px 16px',
                                   borderRadius: '12px',
                                   border: '1px solid var(--border-subtle)',
                                   background: 'var(--bg-root)',
                                   color: 'var(--text-primary)',
                                   fontSize: '0.95rem',
                                   outline: 'none',
                                   transition: 'border-color 0.2s, box-shadow 0.2s'
                               }}
                               onFocus={e => {
                                   e.target.style.borderColor = 'var(--primary)';
                                   e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                               }}
                               onBlur={e => {
                                   e.target.style.borderColor = 'var(--border-subtle)';
                                   e.target.style.boxShadow = 'none';
                               }}
                           />
                       </div>

                       {/* Department */}
                       <div>
                           <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Department</label>
                           <input 
                               type="text" 
                               name="department" 
                               value={formData.department} 
                               onChange={handleChange} 
                               placeholder="e.g. Computer Science"
                               style={{
                                   width: '100%',
                                   padding: '12px 16px',
                                   borderRadius: '12px',
                                   border: '1px solid var(--border-subtle)',
                                   background: 'var(--bg-root)',
                                   color: 'var(--text-primary)',
                                   fontSize: '0.95rem',
                                   outline: 'none',
                                   transition: 'border-color 0.2s, box-shadow 0.2s'
                               }}
                               onFocus={e => {
                                   e.target.style.borderColor = 'var(--primary)';
                                   e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                               }}
                               onBlur={e => {
                                   e.target.style.borderColor = 'var(--border-subtle)';
                                   e.target.style.boxShadow = 'none';
                               }}
                           />
                       </div>

                       {/* Bio */}
                       <div>
                           <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Bio</label>
                           <textarea 
                               name="bio" 
                               value={formData.bio} 
                               onChange={handleChange} 
                               rows={4} 
                               placeholder="Tell students about your expertise and teaching philosophy..."
                               style={{
                                   width: '100%',
                                   padding: '12px 16px',
                                   borderRadius: '12px',
                                   border: '1px solid var(--border-subtle)',
                                   background: 'var(--bg-root)',
                                   color: 'var(--text-primary)',
                                   fontSize: '0.95rem',
                                   outline: 'none',
                                   resize: 'vertical',
                                   transition: 'border-color 0.2s, box-shadow 0.2s',
                                   fontFamily: 'inherit'
                               }}
                               onFocus={e => {
                                   e.target.style.borderColor = 'var(--primary)';
                                   e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                               }}
                               onBlur={e => {
                                   e.target.style.borderColor = 'var(--border-subtle)';
                                   e.target.style.boxShadow = 'none';
                               }}
                           />
                       </div>

                       {/* Read-only Email */}
                       <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                               <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                               <polyline points="22,6 12,13 2,6"></polyline>
                           </svg>
                           <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{email || profile?.email || 'No Email'}</span>
                       </div>

                   </div>

                   {error && (
                       <div style={{ 
                           marginTop: '20px', 
                           padding: '12px', 
                           background: 'rgba(239, 68, 68, 0.1)', 
                           border: '1px solid rgba(239, 68, 68, 0.2)', 
                           borderRadius: '12px', 
                           color: 'var(--danger)', 
                           fontSize: '0.9rem',
                           display: 'flex',
                           alignItems: 'center',
                           gap: '8px'
                       }}>
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                               <circle cx="12" cy="12" r="10"></circle>
                               <line x1="12" y1="8" x2="12" y2="12"></line>
                               <line x1="12" y1="16" x2="12.01" y2="16"></line>
                           </svg>
                           {error}
                       </div>
                   )}

                   {/* Actions */}
                   <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                       <button 
                           type="button" 
                           onClick={handleClose} 
                           disabled={loading}
                           style={{
                               flex: 1,
                               padding: '14px',
                               borderRadius: '14px',
                               border: '1px solid var(--border-subtle)',
                               background: 'transparent',
                               color: 'var(--text-secondary)',
                               fontWeight: '600',
                               cursor: 'pointer',
                               transition: 'all 0.2s'
                           }}
                           onMouseOver={e => {
                               if(!loading) {
                                   e.currentTarget.style.background = 'var(--bg-root)';
                                   e.currentTarget.style.color = 'var(--text-primary)';
                               }
                           }}
                           onMouseOut={e => {
                               if(!loading) {
                                   e.currentTarget.style.background = 'transparent';
                                   e.currentTarget.style.color = 'var(--text-secondary)';
                               }
                           }}
                       >
                           Cancel
                       </button>
                       <button 
                           type="submit" 
                           disabled={loading}
                           style={{
                               flex: 1,
                               padding: '14px',
                               borderRadius: '14px',
                               border: 'none',
                               background: 'var(--primary-gradient)',
                               color: 'white',
                               fontWeight: '600',
                               cursor: loading ? 'not-allowed' : 'pointer',
                               opacity: loading ? 0.7 : 1,
                               boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                               transition: 'transform 0.2s, box-shadow 0.2s',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               gap: '8px'
                           }}
                           onMouseOver={e => {
                               if(!loading) {
                                   e.currentTarget.style.transform = 'translateY(-2px)';
                                   e.currentTarget.style.boxShadow = '0 8px 16px rgba(79, 70, 229, 0.4)';
                               }
                           }}
                           onMouseOut={e => {
                               if(!loading) {
                                   e.currentTarget.style.transform = 'translateY(0)';
                                   e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.3)';
                               }
                           }}
                       >
                           {loading ? (
                               <>
                                   <span style={{
                                       width: '16px',
                                       height: '16px',
                                       border: '2px solid white',
                                       borderTopColor: 'transparent',
                                       borderRadius: '50%',
                                       display: 'inline-block',
                                       animation: 'spin 1s linear infinite'
                                   }}></span>
                                   Saving...
                               </>
                           ) : 'Save Changes'}
                       </button>
                   </div>
               </form>
           </div>
       </div>
       <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .fade-out { animation: fadeOut 0.3s ease-in forwards; }
        .scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .scale-out { animation: scaleOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes scaleOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
      `}</style>
    </div>,
    document.body
  );
}

