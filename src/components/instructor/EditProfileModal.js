import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadProfileImage from '../common/UploadProfileImage'; // Reuse existing logic

const EditProfileModal = ({ profile, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        bio: '',
        photoURL: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || profile.instructorName || '',
                department: profile.dept || profile.department || '',
                bio: profile.bio || '',
                photoURL: profile.profilePictureUrl || profile.photoURL || ''
            });
            setPreviewUrl(profile.profilePictureUrl || profile.photoURL || '');
        }
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, [profile]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave({
                ...formData,
                profilePictureUrl: formData.photoURL // Normalized field
            });
            onClose();
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="premium-modal-overlay"
                onClick={onClose}
            >
                <div onClick={e => e.stopPropagation()} className="premium-modal-wrapper">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="premium-modal-content"
                    >
                        {/* Header */}
                        <div className="premium-modal-header">
                             <h2 className="premium-modal-title">Edit Profile</h2>
                             <button onClick={onClose} className="premium-modal-close-btn">
                                 &times;
                             </button>
                        </div>
                        
                        {/* Body */}
                        <div className="premium-modal-body">
                            <form onSubmit={handleSubmit} className="premium-modal-form">
                                {/* Image Upload */}
                                <div className="premium-upload-section">
                                    <div className="relative group">
                                         <UploadProfileImage 
                                            currentImage={previewUrl} 
                                            onUploadSuccess={(url) => {
                                                setFormData(prev => ({ ...prev, photoURL: url }));
                                                setPreviewUrl(url);
                                            }}
                                            userId={profile?.id}
                                            variant="premium" 
                                        />
                                    </div>
                                    <p className="premium-upload-hint">Click to verify uploads</p>
                                </div>

                                {/* Inputs */}
                                <div className="premium-form-inputs">
                                    <div className="form-group">
                                        <label className="premium-label">Full Name</label>
                                        <input 
                                            type="text" 
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="premium-input"
                                            placeholder="Dr. John Doe"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="premium-label">Department</label>
                                        <input 
                                            type="text" 
                                            value={formData.department}
                                            onChange={(e) => setFormData({...formData, department: e.target.value})}
                                            className="premium-input"
                                            placeholder="Computer Science"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="premium-label">Bio</label>
                                        <textarea 
                                            rows="4"
                                            value={formData.bio}
                                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                            className="premium-input resize-none"
                                            placeholder="Share your teaching philosophy..."
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="premium-modal-actions">
                                    <button 
                                        type="button" 
                                        onClick={onClose}
                                        className="premium-btn-cancel"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="premium-btn-save"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save Profile'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default EditProfileModal;
