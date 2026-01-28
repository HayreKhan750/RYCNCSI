import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Header from '../../common/Header';
import '../Management.css'; 

import { generateExecutiveReport } from '../../../utils/AppReportGenerator';

import { fetchDashboardData } from '../../../store/slices/managementSlice';

const DepartmentList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { departments, stats, lastUpdated, loading } = useSelector(state => state.management);

    useEffect(() => {
        if (!lastUpdated || departments.length === 0) {
            dispatch(fetchDashboardData());
        }
    }, [dispatch, lastUpdated, departments.length]);

    const handleExport = () => {
        generateExecutiveReport(stats, departments);
    };

    return (
        <div className="management-container">
            <Header title="Departments" />
            
            <main className="management-main">
                <div className="executive-header">
                    <div>
                        <h1 className="page-title">Departments</h1>
                        <p className="page-subtitle">Academic Unit Performance</p>
                    </div>
                    <button className="btn-primary" onClick={handleExport} style={{ maxWidth: '200px' }}>
                        <span>📥</span> Download PDF
                    </button>
                </div>

                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Department</th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Instructors</th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Avg Rating</th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sentiment</th>
                                <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map(dept => (
                                <tr key={dept.name} className="dept-table-row" style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '20px 24px', fontWeight: 600, color: 'var(--text-primary)' }}>{dept.name}</td>
                                    <td style={{ padding: '20px 24px', color: 'var(--text-secondary)' }}>{dept.instructorCount}</td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <span style={{ 
                                            padding: '4px 8px', borderRadius: '6px', fontWeight: 700,
                                            background: dept.rating >= 4 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: dept.rating >= 4 ? 'var(--success)' : 'var(--warning)'
                                        }}>
                                            {dept.rating}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 24px', color: 'var(--text-secondary)' }}>{dept.sentiment}</td>
                                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                        <button 
                                            className="btn-secondary" 
                                            style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.8rem' }}
                                            onClick={() => navigate(`/management/department/${encodeURIComponent(dept.name)}`)}
                                        >
                                            View Report
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {departments.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No department data available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default DepartmentList;
