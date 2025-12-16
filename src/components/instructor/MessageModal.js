import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MessageModal = ({ isOpen, onClose, instructorName = 'Instructor' }) => {
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('idle'); // idle, sending, success
    
    // Simulate send
    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setStatus('sending');
        // Mock API Call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setStatus('success');
        setTimeout(() => {
            onClose();
            setMessage('');
            setStatus('idle');
        }, 1500);
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
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="premium-modal-wrapper"
                    style={{ maxWidth: '450px' }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="premium-modal-content">
                        {/* Header */}
                        <div className="premium-modal-header">
                            <div>
                                <h3 className="premium-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>✉️</span> 
                                    Message {instructorName}
                                </h3>
                            </div>
                            <button onClick={onClose} className="premium-modal-close-btn">
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="premium-modal-body">
                            {status === 'success' ? (
                                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'white' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                                    <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Message Sent!</h4>
                                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>The instructor needs to reply before you can message again.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSend} className="premium-modal-form">
                                    <div className="form-group">
                                        <label className="premium-label">
                                            Your Inquiry
                                        </label>
                                        <textarea 
                                            className="premium-input resize-none"
                                            rows="5"
                                            placeholder={`Hi ${instructorName}, I have a question about...`}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            required
                                            maxLength={500}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                            <span style={{ fontSize: '0.75rem', color: message.length > 450 ? '#ef4444' : 'rgba(255,255,255,0.5)' }}>
                                                {message.length} / 500
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ paddingTop: '0.5rem' }}>
                                        <button 
                                            type="submit" 
                                            disabled={status === 'sending' || !message.trim()}
                                            className="btn-header-action"
                                            style={{ 
                                                width: '100%', 
                                                justifyContent: 'center', 
                                                background: status === 'sending' ? '#334155' : '#4f46e5',
                                                color: status === 'sending' ? '#94a3b8' : 'white',
                                                border: 'none',
                                                fontSize: '1rem',
                                                padding: '0.875rem'
                                            }}
                                        >
                                            {status === 'sending' ? (
                                                <>Sending...</>
                                            ) : (
                                                <>Send Message 🚀</>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MessageModal;
