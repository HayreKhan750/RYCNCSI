import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CreateCourseModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        department: 'Computer Science',
        description: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate async save
        await new Promise(resolve => setTimeout(resolve, 1500));
        onSave({ ...formData, id: Date.now().toString() });
        setLoading(false);
        onClose();
        setFormData({ title: '', code: '', department: 'Computer Science', description: '' });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="premium-modal-overlay"
                onClick={onClose}
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="premium-modal-wrapper"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="premium-modal-content">
                        {/* Header */}
                        <div className="premium-modal-header">
                            <div>
                                <h2 className="premium-modal-title">
                                     📚 Create New Course
                                </h2>
                                <p className="premium-upload-hint" style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Add a new course to your teaching catalog.</p>
                            </div>
                            <button onClick={onClose} className="premium-modal-close-btn">
                                ✕
                            </button>
                        </div>

                        {/* Form */}
                        <div className="premium-modal-body">
                            <form onSubmit={handleSubmit} className="premium-modal-form">
                                <div className="grid grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="premium-label">Course Code</label>
                                        <input 
                                            type="text" 
                                            name="code"
                                            required
                                            placeholder="e.g. CS101"
                                            className="premium-input"
                                            value={formData.code}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="premium-label">Department</label>
                                        <select 
                                            name="department"
                                            className="premium-input"
                                            value={formData.department}
                                            onChange={handleChange}
                                        >
                                            <option>Computer Science</option>
                                            <option>Information Systems</option>
                                            <option>Software Engineering</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="premium-label">Course Title</label>
                                    <input 
                                        type="text" 
                                        name="title"
                                        required
                                        placeholder="e.g. Introduction to Algorithms"
                                        className="premium-input"
                                        value={formData.title}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="premium-label">Description</label>
                                    <textarea 
                                        name="description"
                                        rows="3"
                                        placeholder="Brief overview of the course..."
                                        className="premium-input resize-none"
                                        value={formData.description}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="premium-modal-actions">
                                    <button 
                                        type="button"
                                        onClick={onClose}
                                        className="premium-btn-cancel"
                                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.75rem', borderRadius: '12px', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={loading}
                                        className="btn-header-action"
                                        style={{ flex: 1, justifyContent: 'center', background: '#4f46e5', color: 'white', border: 'none' }}
                                    >
                                        {loading ? (
                                            <>Creating...</>
                                        ) : (
                                            <><span>＋</span> Create Course</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CreateCourseModal;
