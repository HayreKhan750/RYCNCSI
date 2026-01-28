import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDashboardData } from '../../store/slices/managementSlice';
import FacultyOverview from './FacultyOverview';
import DepartmentAnalytics from './DepartmentAnalytics';
import FacultyRosterList from './FacultyRosterList';
import AISummaryPanel from './AISummaryPanel';

import Header from '../common/Header';
import './Management.css';

const ManagementDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  /* Cache-First Strategy: prevent re-fetching if we have data */
  const { stats, departments, topInstructors, loading, lastUpdated } = useSelector((state) => state.management);

  useEffect(() => {
     // Only fetch if we have no data. 
     // This makes navigation instant (Image 1 fix).
     if (!lastUpdated || !stats?.totalInstructors) {
        dispatch(fetchDashboardData());
     }
  }, [dispatch, lastUpdated, stats?.totalInstructors]);

  /* 
     Ideally show skeleton here if loading && !stats.totalInstructors 
     but for sleekness we let it load and show 0 then animate up 
  */

  return (
    <div className="management-container">
      <Header title="Management Portal" />
      
      <main className="management-main">
        {/* Welcome Section */}
        <div className="executive-header">
          <div>
            <h1 className="page-title">Executive Dashboard</h1>
            <p className="page-subtitle">Academic Performance & Sentiment Analysis</p>
          </div>
          <div className="btn-group">
             {/* Moderation removed as per request */}
             <button className="btn-primary" onClick={() => navigate('/management/departments')}>
               <span>📊</span> Full Report
             </button>
          </div>
        </div>

        {/* 1. Top KPI Row */}
        <section className="kpi-grid">
           <FacultyOverview stats={stats} loading={loading} />
        </section>

        {/* 2. Main Analytics Split */}
        <section className="analytics-split">
            {/* Left Column: Charts */}
            <div className="column-left">
                <DepartmentAnalytics departments={departments} />
                <FacultyRosterList instructors={topInstructors} />
            </div>

            {/* Right Column: AI & Feeds */}
            <div className="column-right">
               <AISummaryPanel stats={stats} />
            </div>
        </section>
      </main>
    </div>
  );
};

export default ManagementDashboard;
