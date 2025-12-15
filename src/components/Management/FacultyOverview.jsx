import React from 'react';

const KPICard = ({ title, value, change, trend, icon, color, bgColor, delay }) => (
    <div className="kpi-card slide-up" style={{ animationDelay: delay }}>
        {/* Decorative Shine */}
        <div className="kpi-shine" style={{ background: color }}></div>
        
        <div className="kpi-header">
            <div className="kpi-icon" style={{ color: color, background: bgColor }}>
                {icon}
            </div>
            <span className={`kpi-trend trend-${trend}`}>
                {change}
            </span>
        </div>
        
        <div className="kpi-content">
            <h3>{title}</h3>
            <p className="kpi-value">{value}</p>
        </div>
    </div>
);

const FacultyOverview = ({ stats, loading }) => {
  const { totalInstructors, totalDepartments, avgRating, engagementThisMonth } = stats || {};

  return (
    <>
      <KPICard 
        title="Total Instructors" 
        value={loading ? '...' : totalInstructors} 
        change="+2" 
        trend="up" 
        icon="👨‍🏫" 
        color="#4F46E5"
        bgColor="rgba(79, 70, 229, 0.1)"
        delay="0ms" 
      />
      <KPICard 
        title="Departments" 
        value={loading ? '...' : totalDepartments} 
        change="Stable" 
        trend="neutral" 
        icon="🏛️" 
        color="#2563EB"
        bgColor="rgba(37, 99, 235, 0.1)" 
        delay="100ms" 
      />
      <KPICard 
        title="Avg Rating" 
        value={loading ? '...' : avgRating} 
        change="+0.1" 
        trend="up" 
        icon="⭐" 
        color="#F59E0B"
        bgColor="rgba(245, 158, 11, 0.1)"
        delay="200ms" 
      />
      <KPICard 
        title="Engagement (Mo)" 
        value={loading ? '...' : engagementThisMonth} 
        change="Active" 
        trend="up" 
        icon="🔥" 
        color="#EF4444"
        bgColor="rgba(239, 68, 68, 0.1)"
        delay="300ms" 
      />
    </>
  );
};

export default FacultyOverview;
