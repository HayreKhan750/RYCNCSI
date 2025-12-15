import React from 'react';
import { motion } from 'framer-motion';

const MetricCard = ({ title, value, subtext, icon, trend, onClick, delay, colorClass }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay * 0.1 }}
        whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
        className="metric-card-premium" // New CSS class needed
        onClick={onClick}
    >
        <div className={`metric-icon-circle ${colorClass}`}>
            {icon}
        </div>
        
        <div className="metric-info">
            <h3 className="metric-title">{title}</h3>
            <div className="metric-main-row">
                <span className="metric-value">{value}</span>
                {trend && (
                    <span className={`metric-trend ${trend.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend.isUp ? '↑' : '↓'} {trend.value}%
                    </span>
                )}
            </div>
            <p className="metric-subtext">{subtext}</p>
        </div>
    </motion.div>
);

const MetricsCards = ({ stats, onMetricClick }) => {
    // Demo trends
    const trends = {
        rating: { isUp: true, value: 5 },
        reviews: { isUp: true, value: 12 },
        engagement: { isUp: false, value: 2 },
        replies: { isUp: true, value: 8 }
    };

    return (
        <div className="metrics-grid">
            <MetricCard 
                title="Avg Rating" 
                value={Number(stats.avgRating || 0).toFixed(1)} 
                subtext="Last 30 days"
                icon="⭐"
                trend={trends.rating}
                colorClass="bg-amber-100 text-amber-600"
                delay={0}
                onClick={() => onMetricClick('rating')}
            />
            <MetricCard 
                title="Total Reviews" 
                value={stats.reviewCount || 0} 
                subtext="All time feedback"
                icon="📝"
                trend={trends.reviews}
                colorClass="bg-blue-100 text-blue-600"
                delay={1}
                onClick={() => onMetricClick('reviews')}
            />
            <MetricCard 
                title="Replies Given" 
                value={stats.repliesCount || 0} 
                subtext="Response rate: 85%"
                icon="💬"
                trend={trends.replies}
                colorClass="bg-indigo-100 text-indigo-600"
                delay={2}
                onClick={() => onMetricClick('replies')}
            />
            <MetricCard 
                title="Engagement" 
                value={stats.engagementScore || (stats.reviewCount * 1.5).toFixed(0)} 
                subtext="Student interactions"
                icon="🔥"
                trend={trends.engagement}
                colorClass="bg-rose-100 text-rose-600"
                delay={3}
                onClick={() => onMetricClick('engagement')}
            />
        </div>
    );
};

export default MetricsCards;
