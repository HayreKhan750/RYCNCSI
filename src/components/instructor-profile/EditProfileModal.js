import React, { useState } from 'react';

export default function EditProfileModal({ profile, onSave, onClose }) {
  const [formData, setFormData] = useState({
    bio: profile.bio || '',
    department: profile.dept || '',
    name: profile.name || ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(profile.photoURL);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await onSave({
            bio: formData.bio,
            department: formData.department, // Ensure field matches DB schema
            name: formData.name
        }, photoFile);
        onClose();
    } catch (err) {
        alert('Failed to update profile');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
       <div className="edit-modal glass-card">
           <h2 style={{marginTop:0, marginBottom:20}}>Edit Profile</h2>
           
           <form onSubmit={handleSubmit}>
               <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginBottom:20}}>
                   <div style={{width:100, height:100, borderRadius:'50%', overflow:'hidden', marginBottom:10, border:'2px solid var(--neon-blue)'}}>
                       <img src={previewUrl || 'https://via.placeholder.com/100'} alt="Preview" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                   </div>
                   <label style={{cursor:'pointer', color:'var(--neon-blue)', fontSize:'0.9rem'}}>
                       Change Photo
                       <input type="file" hidden onChange={handleFileChange} accept="image/*" />
                   </label>
               </div>

               <div style={{marginBottom:15}}>
                   <label style={{display:'block', marginBottom:5, fontSize:'0.9rem', opacity:0.8}}>Full Name</label>
                   <input 
                      type="text" 
                      className="modern-input" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      style={{width:'100%'}}
                   />
               </div>

               <div style={{marginBottom:15}}>
                   <label style={{display:'block', marginBottom:5, fontSize:'0.9rem', opacity:0.8}}>Department</label>
                   <input 
                      type="text" 
                      className="modern-input" 
                      value={formData.department} 
                      onChange={e => setFormData({...formData, department: e.target.value})}
                      style={{width:'100%'}}
                   />
               </div>

               <div style={{marginBottom:20}}>
                   <label style={{display:'block', marginBottom:5, fontSize:'0.9rem', opacity:0.8}}>Bio</label>
                   <textarea 
                      className="modern-input" 
                      rows="4"
                      value={formData.bio} 
                      onChange={e => setFormData({...formData, bio: e.target.value})}
                      style={{width:'100%'}}
                   />
               </div>

               <div style={{display:'flex', justifyContent:'flex-end', gap:10}}>
                   <button type="button" onClick={onClose} style={{padding:'10px 20px', background:'transparent', border:'1px solid rgba(255,255,255,0.2)', color:'inherit', borderRadius:8, cursor:'pointer'}}>Cancel</button>
                   <button type="submit" disabled={loading} style={{padding:'10px 20px', background:'var(--neon-blue)', border:'none', borderRadius:8, fontWeight:'bold', cursor:'pointer', color:'#000'}}>
                       {loading ? 'Saving...' : 'Save Changes'}
                   </button>
               </div>
           </form>
       </div>
    </div>
  );
}
