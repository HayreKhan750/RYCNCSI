import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const toneCheck = (text) => {
    // Mock AI Tone Analysis
    if (text.length < 20) return { score: 0, label: 'Too Short' };
    if (text.toLowerCase().includes('sorry')) return { score: 85, label: 'Empathetic' };
    if (text.toLowerCase().includes('thanks') || text.toLowerCase().includes('appreciate')) return { score: 95, label: 'Professional' };
    return { score: 70, label: 'Neutral' };
};

const ReplyModal = ({ isOpen, onClose, feedback, onSubmit }) => {
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen || !feedback) return null;

    const tone = toneCheck(replyText);

    const handleSubmit = async () => {
        if (!replyText.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit(feedback.id, {
                text: replyText,
                authorId: 'instructor',
                createdAt: new Date().toISOString()
            });

            setReplyText('');
            onClose();
        } catch (err) {
            setError(err.message || "Failed to post reply");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden pointer-events-auto border border-white/10"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Reply to Student</h3>
                                    <p className="text-xs text-slate-500">Your reply will be visible on your public profile</p>
                                </div>
                                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                                    ✕
                                </button>
                            </div>

                            <div className="p-6">
                                {/* Context Review */}
                                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-amber-400 font-bold">★ {Number(feedback.rating).toFixed(1)}</span>
                                            <span className="text-xs text-slate-400">• {new Date(feedback.createdAt || feedback.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 italic text-sm">"{feedback.text || feedback.feedback}"</p>
                                </div>

                                {/* Text Area */}
                                <div className="relative">
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Write a professional, constructive reply..."
                                        className="w-full h-40 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-700 dark:text-slate-200 text-sm leading-relaxed transition-all"
                                        maxLength={1000}
                                    />
                                    <div className="absolute bottom-3 right-3 text-xs text-slate-400 font-medium">
                                        {replyText.length}/1000
                                    </div>
                                </div>

                                {/* AI Tone Check */}
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tone Analysis</div>
                                        {replyText.length > 0 && (
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                                                tone.score > 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                                <span>{tone.score > 80 ? '✨' : '⚪'}</span>
                                                {tone.label}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg flex items-center gap-2">
                                        ⚠ {error}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                                <button 
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={!replyText.trim() || isSubmitting}
                                    className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Posting...
                                        </>
                                    ) : (
                                        <>
                                            <span>Reply</span>
                                            <span>➤</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ReplyModal;
