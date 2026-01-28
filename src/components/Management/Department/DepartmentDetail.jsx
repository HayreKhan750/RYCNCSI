import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDashboardData } from '../../../store/slices/managementSlice';
import Header from '../../common/Header';
import FeedbackStream from '../FeedbackStream'; // Reuse
import FacultyRosterList from '../FacultyRosterList'; // Renamed from InstructorInsights to break cache
import { generateDepartmentReport } from '../../../utils/AppReportGenerator';
import '../Management.css';

const DepartmentDetail = () => {
    const { deptName } = useParams();
    const navigate = useNavigate();
    const decodedName = decodeURIComponent(deptName || '');
    
    // In real app, fetch specific dept details here (incidents, trends)
    // For now, filter from global store
    const dispatch = useDispatch();
    const { departments, topInstructors, recentFeedback, lastUpdated } = useSelector(state => state.management);

    useEffect(() => {
        if (!lastUpdated || departments.length === 0) {
            dispatch(fetchDashboardData());
        }
    }, [dispatch, lastUpdated, departments.length]);
    
    const deptStats = departments.find(d => d.name === decodedName);
    const deptInstructors = topInstructors.filter(i => {
        const iDept = (i.department || i.deptName || 'General').toLowerCase().trim();
        const target = decodedName.toLowerCase().trim();
        return iDept === target || iDept.includes(target) || target.includes(iDept); 
    });
    
    const deptFeedback = recentFeedback.filter(f => {
        const fDept = (f.department || f.deptName || 'General').toLowerCase().trim();
        const target = decodedName.toLowerCase().trim();
        return fDept === target;
    });

    if (!deptStats) {
        return <div className="management-container"><div className="management-main">Department not found or loading...</div></div>;
    }

    return (
        <div className="management-container">
            <Header title={decodedName} />
            
            <main className="management-main">
                <div className="executive-header">
                    <div>
                        <button 
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '8px', padding: 0 }}
                            onClick={() => navigate('/management/departments')}
                        >
                            ← Back to Departments
                        </button>
                        <h1 className="page-title">{decodedName}</h1>
                        <p className="page-subtitle">Department Performance Report</p>
                    </div>
                    <button 
                        onClick={() => {
                            console.log("Downloading report for", decodedName);
                            generateDepartmentReport(decodedName, deptInstructors, deptStats);
                        }}
                        className="btn-download-report"
                    >
                        <span style={{fontSize:'1.1rem'}}>📥</span> Download Report
                    </button>
                </div>

                {/* KPI Row */}
                <section className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                     <div className="kpi-card">
                         <div className="kpi-header"><div className="kpi-icon" style={{background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)'}}>👥</div></div>
                         <h3>Active Instructors</h3>
                         <p className="kpi-value">{deptStats.instructorCount}</p>
                     </div>
                     <div className="kpi-card">
                         <div className="kpi-header"><div className="kpi-icon" style={{background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)'}}>⭐</div></div>
                         <h3>Average Rating</h3>
                         <p className="kpi-value">{deptStats.rating}</p>
                     </div>
                     <div className="kpi-card">
                         <div className="kpi-header"><div className="kpi-icon" style={{background: 'rgba(6, 182, 212, 0.1)', color: 'var(--analytics-cyan)'}}>🎓</div></div>
                         <h3>Student Engagement</h3>
                         <p className="kpi-value">{deptStats.students}</p>
                     </div>
                </section>

                <section className="analytics-split">
                    <div className="column-left">
                        {/* Instructor List */}
                        <div className="glass-panel">
                             <h2 className="panel-title" style={{marginBottom: '20px'}}>Faculty Roster</h2>
                             <FacultyRosterList instructors={deptInstructors.length > 0 ? deptInstructors : []} />
                             {deptInstructors.length === 0 && <p style={{color: 'var(--text-secondary)'}}>No instructor data for this department this month.</p>}
                        </div>
                    </div>
                    <div className="column-right">
                         <FeedbackStream feedback={deptFeedback} />
                    </div>
                </section>
            </main>
        </div>
    );
};

export default DepartmentDetail;
