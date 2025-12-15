import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

const ReviewList = ({ reviews = [], instructorId, isInstructorView = false }) => {
    const [sortBy, setSortBy] = useState('newest'); // newest, lowest, highest
    const [filterRating, setFilterRating] = useState('all');

    // 1. Filter & Sort
    const processedReviews = useMemo(() => {
        let result = [...reviews];

        // Filter
        if (filterRating !== 'all') {
            result = result.filter(r => Math.round(r.rating) === Number(filterRating));
        }

        // Sort
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.timestamp || 0);
            const dateB = new Date(b.createdAt || b.timestamp || 0);
            const rateA = Number(a.rating || 0);
            const rateB = Number(b.rating || 0);

            switch (sortBy) {
                case 'newest': return dateB - dateA;
                case 'lowest': return rateA - rateB;
                case 'highest': return rateB - rateA;
                default: return dateB - dateA;
            }
        });

        return result;
    }, [reviews, sortBy, filterRating]);

    if (!reviews || reviews.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400 italic">
                No reviews yet.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap gap-4 justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Sort by:</span>
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-slate-800 text-slate-200 text-sm rounded-lg border border-slate-700 px-3 py-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="newest">Newest First</option>
                        <option value="highest">Highest Rated</option>
                        <option value="lowest">Lowest Rated</option>
                    </select>
                </div>
                
                <div className="flex items-center gap-2">
                     <span className="text-sm text-slate-400">Filter:</span>
                     <div className="flex gap-1">
                         {[5,4,3,2,1].map(star => (
                             <button
                                key={star}
                                onClick={() => setFilterRating(filterRating === star ? 'all' : star)}
                                className={`px-2 py-1 text-xs rounded-md border transition-all
                                    ${filterRating === star 
                                        ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
                                        : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500'}
                                `}
                             >
                                 {star}★
                             </button>
                         ))}
                     </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {processedReviews.map((review) => (
                    <div key={review.id} className="premium-card !p-5 !mb-0 hover:border-indigo-500/30 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                {/* Rating Badge */}
                                <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold text-lg
                                    ${review.rating >= 4 ? 'bg-emerald-500/10 text-emerald-400' : 
                                      review.rating >= 3 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}
                                `}>
                                    {review.rating}
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-200">
                                        {review.studentName || 'Anonymous Student'}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {review.courseTitle || review.courseId || 'Course'} • {new Date(review.createdAt || review.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            
                             {/* AI Badge (Instructor Only) */}
                             {isInstructorView && review.sentiment && (
                                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700`}>
                                    {review.sentiment}
                                </span>
                             )}
                        </div>

                        {/* Content */}
                        <div className="ml-13 pl-13">
                            <p className="text-slate-300 text-sm leading-relaxed mb-3">
                                {review.text || review.feedback || review.comment}
                            </p>
                            
                            {/* Tags */}
                            {review.tags && review.tags.length > 0 && (
                                <div className="flex gap-2 flex-wrap mb-3">
                                    {review.tags.map(tag => (
                                        <span key={tag} className="text-xs px-2 py-1 bg-slate-800/50 rounded-lg text-slate-400">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Actions Area (Reply / Flag) */}
                            <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                                {/* Likes (Read Only for Instructor, Interactive for Students) */}
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                   <span className="flex items-center gap-1 group cursor-pointer hover:text-slate-300">
                                        👍 {Array.isArray(review.likes) ? review.likes.length : (review.likesCount || 0)}
                                   </span>
                                   <span className="flex items-center gap-1 group cursor-pointer hover:text-slate-300">
                                        👎 {Array.isArray(review.dislikes) ? review.dislikes.length : (review.dislikesCount || 0)}
                                   </span>
                                </div>

                                {isInstructorView ? (
                                    <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                                        Reply to Student
                                    </button>
                                ) : (
                                    <button className="text-xs text-slate-600 hover:text-slate-400">
                                        Report
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewList;
