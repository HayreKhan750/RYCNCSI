import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { messageService } from '../../services/messageService';

const MessageModal = ({ isOpen, onClose, instructorName = 'Instructor', instructorId }) => {
    const { user } = useSelector(state => state.auth);
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('idle'); // idle, sending, success, error

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        if (!user) {
            alert("Please login to send a message.");
            return;
        }

        setStatus('sending');
        console.log("Sending Message Payload:", {
            senderId: user.uid,
            receiverId: instructorId, // Check if this is undefined
            text: message
        });

        try {
            await messageService.sendMessage({
                senderId: user.uid,
                senderName: user.displayName || user.fullName || 'Student',
                receiverId: instructorId,
                text: message
            });
            
            setStatus('success');
            onClose();
            // Navigate immediately
            if (window.location.pathname !== '/student/messages') {
                    window.location.href = `/student/messages?partnerId=${instructorId}`;
            }
        } catch (error) {
            console.error("Message send failed details:", error);
            // Log the specific error code if available
            if (error.code) console.error("Firebase Error Code:", error.code);
            
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
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
                <div style={{
                    position: 'fixed', top:0, left:0, width:'100%', height:'100%',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 999
                }} />

                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="premium-modal-wrapper"
                    style={{ 
                        maxWidth: '500px', width: '90%', position:'relative', zIndex: 1000, margin: 'auto', top: '10%',
                        background: 'var(--bg-elevated)', borderRadius: '24px', 
                        border: '1px solid var(--border-subtle)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <style>{`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 8px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: rgba(255, 255, 255, 0.05);
                            border-radius: 4px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: var(--primary);
                            border-radius: 4px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: var(--primary-light);
                        }
                    `}</style>

                    <div className="premium-modal-content" style={{padding: 0, borderRadius: '24px', overflow: 'hidden', background: 'var(--bg-elevated)'}}>
                        {/* Header */}
                        <div className="premium-modal-header" style={{
                            padding: '32px', 
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', // Fallback to verified premium gradient
                            display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <div>
                                <h3 className="premium-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin:0, fontSize:'1.5rem', color: 'white', fontWeight: 700 }}>
                                    <span style={{ fontSize: '1.25rem', background: 'rgba(255,255,255,0.2)', borderRadius:'12px', padding:'8px', display:'flex' }}>✉️</span> 
                                    Message {instructorName}
                                </h3>
                                <p style={{margin:'8px 0 0 52px', color:'rgba(255,255,255,0.8)', fontSize:'0.9rem', fontWeight: 500}}>Private • Direct Message</p>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="premium-modal-close-btn" 
                                style={{
                                    background:'rgba(255,255,255,0.1)', border:'none', color:'white', 
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize:'1.2rem', cursor:'pointer', transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="premium-modal-body" style={{padding: '32px'}}>
                            {status === 'success' ? (
                                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'white' }}>
                                    <motion.div 
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        style={{ fontSize: '4rem', marginBottom: '1rem' }}
                                    >✅</motion.div>
                                    <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Message Sent!</h4>
                                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>The instructor will be notified.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSend} className="premium-modal-form">
                                    <div className="form-group">
                                        <label className="premium-label" style={{display:'block', marginBottom:'12px', color:'var(--text-primary)', fontWeight: 600, fontSize: '1rem'}}>
                                            Your Inquiry
                                        </label>
                                        <textarea 
                                            className="premium-input custom-scrollbar"
                                            rows="6"
                                            placeholder={`Hi ${instructorName}, I have a question about...`}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            required
                                            maxLength={1000}
                                            style={{
                                                width: '100%',
                                                background: 'var(--bg-root)', // Darker background for contrast
                                                border: '1px solid var(--border-subtle)',
                                                borderRadius: '16px',
                                                padding: '16px',
                                                color: 'var(--text-primary)',
                                                fontSize: '1rem',
                                                resize: 'none',
                                                outline: 'none',
                                                fontFamily: 'inherit',
                                                lineHeight: 1.6,
                                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                            onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                                            <span style={{ fontSize: '0.8rem', color: message.length > 900 ? '#ef4444' : 'var(--text-muted)' }}>
                                                {message.length} / 1000
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ paddingTop: '1.5rem' }}>
                                        <button 
                                            type="submit" 
                                            disabled={status === 'sending' || !message.trim()}
                                            className="btn-header-action"
                                            style={{ 
                                                width: '100%', 
                                                justifyContent: 'center', 
                                                background: status === 'sending' ? 'var(--bg-elevated)' : 'var(--primary-gradient)',
                                                color: status === 'sending' ? 'var(--text-muted)' : 'white',
                                                border: status === 'sending' ? '1px solid var(--border-subtle)' : 'none',
                                                fontSize: '1.1rem',
                                                fontWeight: 700,
                                                padding: '16px',
                                                borderRadius: '16px',
                                                cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex', alignItems: 'center', gap: '12px',
                                                boxShadow: status === 'sending' ? 'none' : '0 10px 20px -5px rgba(99, 102, 241, 0.4)'
                                            }}
                                            onMouseOver={(e) => !status && (e.currentTarget.style.transform = 'translateY(-2px)')}
                                            onMouseOut={(e) => !status && (e.currentTarget.style.transform = 'translateY(0)')}
                                        >
                                            {status === 'sending' ? (
                                                <>Sending...</>
                                            ) : status === 'error' ? (
                                                <>Failed. Try Again.</>
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
