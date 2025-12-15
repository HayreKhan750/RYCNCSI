import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Header from '../../common/Header';
import '../Management.css';

const FeedbackConsole = () => {
    const navigate = useNavigate();
    const { recentFeedback } = useSelector(state => state.management);
    const [filter, setFilter] = useState('all'); // 'all', 'flagged', 'low_rating'

    // Mock flagged status for demonstration if data doesn't have it
    const processedFeedback = recentFeedback.map(f => ({
        ...f,
        flagged: f.flagged || f.rating < 2 || (f.comment && f.comment.includes('bad')) // auto-flag simulation
    }));

    const filteredList = processedFeedback.filter(f => {
        if (filter === 'flagged') return f.flagged;
        if (filter === 'low_rating') return f.rating < 3;
        return true;
    });

    const handleAction = (id, action) => {
        alert(`Action ${action} triggered for feedback ${id}. In production, this would call a Cloud Function.`);
    };

    return (
        <div className="management-container">
            <Header title="Feedback Console" />
            
            <main className="management-main">
                <div className="executive-header">
                    <div>
                        <h1 className="page-title">Moderation Console</h1>
                        <p className="page-subtitle">Review and manage student feedback.</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '0' }}>
                    {/* Toolbar */}
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '12px' }}>
                        <button 
                            className={`btn-secondary ${filter === 'all' ? 'active-filter' : ''}`}
                            style={{ background: filter === 'all' ? 'var(--primary)' : 'var(--bg-root)', color: filter === 'all' ? 'white' : 'var(--text-secondary)' }}
                            onClick={() => setFilter('all')}
                        >
                            All Feedback
                        </button>
                        <button 
                            className={`btn-secondary ${filter === 'flagged' ? 'active-filter' : ''}`}
                            style={{ background: filter === 'flagged' ? 'var(--danger)' : 'var(--bg-root)', color: filter === 'flagged' ? 'white' : 'var(--text-secondary)' }}
                            onClick={() => setFilter('flagged')}
                        >
                            ⚠️ Flagged Issues
                        </button>
                        <button 
                             className={`btn-secondary ${filter === 'low_rating' ? 'active-filter' : ''}`}
                             onClick={() => setFilter('low_rating')}
                        >
                            Low Ratings (&lt; 3)
                        </button>
                    </div>

                    {/* List */}
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {filteredList.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No feedback found matching filters.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'var(--bg-root)', position: 'sticky', top: 0 }}>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.8rem' }}>Date</th>
                                        <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.8rem' }}>Instructor</th>
                                        <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.8rem' }}>Rating</th>
                                        <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.8rem' }}>Comment</th>
                                        <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: '0.8rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredList.map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                            <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                {item.time || 'Recent'}
                                            </td>
                                            <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                                                {item.instructorId} 
                                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 400 }}>{item.department}</span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div className="rating-stars" style={{ color: item.rating < 3 ? 'var(--danger)' : '#FBBF24' }}>
                                                    {'★'.repeat(Math.round(item.rating || 0))}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', maxWidth: '400px' }}>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>"{item.comment || item.feedback}"</p>
                                                {item.flagged && <span style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 700 }}>⚠️ Flagged Content</span>}
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    {item.flagged && (
                                                        <button 
                                                            className="btn-secondary" 
                                                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--success)', color: 'var(--success)' }}
                                                            onClick={() => handleAction(item.id, 'APPROVE')}
                                                        >
                                                            Dismiss
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="btn-secondary" 
                                                        style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                                                        onClick={() => handleAction(item.id, 'DELETE')}
                                                    >
                                                        Delete
                                                    </button>
                                                    <button 
                                                         className="btn-secondary" 
                                                         style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                         onClick={() => navigate(`/management/instructor/${item.instructorId}`)}
                                                    >
                                                        Context
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FeedbackConsole;
