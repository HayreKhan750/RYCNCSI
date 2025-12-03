import React, { useState, useRef } from 'react';
import { cloudinaryService } from '../../services/cloudinaryService';

export default function UploadProfileImage({ 
  currentImage, 
  onUploadSuccess, 
  userType = 'student',
  userId,
  name = 'User'
}) {
  const [preview, setPreview] = useState(currentImage);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) { // 4MB
      setError('File too large (max 4MB).');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const url = await cloudinaryService.uploadImage(file, userType);
      
      clearInterval(interval);
      setProgress(100);
      setSuccess(true);
      
      if (onUploadSuccess) {
        onUploadSuccess(url);
      }
    } catch (err) {
      setError('Upload failed.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-profile-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      marginBottom: 24
    }}>
      <div style={{position: 'relative', width: 120, height: 120}}>
        <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '4px solid var(--bg-elevated)',
            background: 'var(--bg-root)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            color: 'var(--text-muted)'
        }}>
            {preview ? (
                <img 
                  src={preview} 
                  alt="Profile" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
            ) : (
                (name || 'U').charAt(0).toUpperCase()
            )}
        </div>

        {uploading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}>
            {progress}%
          </div>
        )}
        
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            position: 'absolute',
            bottom: 5,
            right: 5,
            background: 'var(--primary)',
            border: '2px solid var(--bg-elevated)',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            color: 'white',
            transition: 'transform 0.2s'
          }}
          title="Change Photo"
          disabled={uploading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
               <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        style={{display: 'none'}} 
        accept="image/png, image/jpeg, image/webp"
      />

      <div style={{textAlign: 'center', width: '100%'}}>
        {error && (
          <div style={{
            color: 'var(--danger)', 
            fontSize: '0.9rem', 
            marginTop: 5
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            color: 'var(--success)', 
            fontSize: '0.9rem', 
            marginTop: 5
          }}>
            Updated!
          </div>
        )}
      </div>
    </div>
  );
}
