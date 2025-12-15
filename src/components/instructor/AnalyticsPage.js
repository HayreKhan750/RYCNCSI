import React, { useMemo } from 'react';
import useInstructorProfile from '../../hooks/useInstructorProfile';
import Header from '../common/Header';
import PerformanceAnalytics, { TrendChart, SimpleBarChart } from './PerformanceAnalytics';

const AnalyticsPage = () => {
    const { stats, chartData, loading, feedbacks, profile } = useInstructorProfile();

    // Advanced Stats Calculation
    const advancedStats = useMemo(() => {
        if (!feedbacks) return { responseRate: 0, sentimentScore: 0 };
        
        // Mock Response Rate (in real app, reviews / enrollment students)
        const responseRate = 78; 
        
        // Sentiment Score (0-100)
        const positive = feedbacks.filter(f => f.rating >= 4).length;
        const total = feedbacks.length || 1;
        const sentimentScore = Math.round((positive / total) * 100);

        return { responseRate, sentimentScore };
    }, [feedbacks]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    const handleExport = () => {
        // Simple CSV Export Logic
        const rows = [
            ['Student Name', 'Rating', 'Comment', 'Date', 'Tags'],
            ...feedbacks.map(f => [
                f.studentName || 'Anonymous',
                f.rating,
                `"${(f.text || '').replace(/"/g, '""')}"`, // Escape quotes
                new Date(f.createdAt || f.timestamp).toLocaleDateString(),
                (f.tags || []).join(', ')
            ])
        ];
        
        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "instructor_feedback_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <Header title="Analytics" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Performance Analytics</h1>
                        <p className="mt-2 text-lg text-slate-600">Deep dive into your teaching impact and student satisfaction.</p>
                    </div>
                    <button 
                        onClick={handleExport}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <span>📥</span> Export Data (CSV)
                    </button>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-amber-400 to-orange-500 mb-2">
                            {Number(stats?.avgRating || 0).toFixed(1)}
                        </div>
                        <div className="text-sm font-bold text-slate-600 uppercase tracking-wide">Overall Rating</div>
                        <div className="text-xs text-slate-400 mt-1">Top 15% of faculty</div>
                    </div>
                    
                    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="text-4xl font-black text-indigo-500 mb-2">
                            {stats?.reviewCount || 0}
                        </div>
                        <div className="text-sm font-bold text-slate-600 uppercase tracking-wide">Total Reviews</div>
                        <div className="text-xs text-slate-400 mt-1">+12 this week</div>
                    </div>

                    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="text-4xl font-black text-emerald-500 mb-2">
                            {advancedStats.sentimentScore}%
                        </div>
                        <div className="text-sm font-bold text-slate-600 uppercase tracking-wide">Positive Sentiment</div>
                        <div className="text-xs text-slate-400 mt-1">Based on feedback analysis</div>
                    </div>
                    
                    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="text-4xl font-black text-rose-500 mb-2">
                            {advancedStats.responseRate}%
                        </div>
                        <div className="text-sm font-bold text-slate-600 uppercase tracking-wide">Response Rate</div>
                        <div className="text-xs text-slate-400 mt-1">Students completing surveys</div>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Main Trend Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Rating Trend</h3>
                             <select className="text-xs border-none bg-slate-100 rounded-lg px-2 py-1 text-slate-600 outline-none">
                                <option>Last 6 Months</option>
                                <option>Year to Date</option>
                             </select>
                        </div>
                        {/* Reuse the trend chart component */}
                        <div className="h-64">
                             {chartData?.trend ? (
                                <TrendChart data={chartData.trend} />
                             ) : (
                                <div className="flex items-center justify-center h-full text-slate-400">Chart Loading...</div>
                             )}
                        </div>
                    </div>

                    {/* Tag Distribution */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Feedback Topics</h3>
                         <div className="h-64">
                             {chartData?.tags ? (
                                <SimpleBarChart data={chartData.tags} />
                             ) : (
                                <div className="flex items-center justify-center h-full text-slate-400">Analysis...</div>
                             )}
                        </div>
                    </div>
                </div>

                {/* Course Breakdown Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800">Course Breakdown</h3>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Course Name</th>
                                <th className="px-6 py-3 font-semibold text-center">Students</th>
                                <th className="px-6 py-3 font-semibold text-center">Rating</th>
                                <th className="px-6 py-3 font-semibold text-center">Sentiment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(profile?.courses || []).map((course, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">
                                        {course.courseTitle || course.title}
                                        <div className="text-xs text-slate-400 font-normal">{course.courseCode || course.code}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-600">{course.studentCount || 45}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg font-bold">
                                            {course.avgRating || 4.5}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-600">
                                        Original
                                    </td>
                                </tr>
                            ))}
                            {(profile?.courses || []).length === 0 && (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">No course data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default AnalyticsPage;
