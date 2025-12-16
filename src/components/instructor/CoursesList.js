import React, { useState, useMemo } from 'react';
import useInstructorProfile from '../../hooks/useInstructorProfile';
import CourseCard from './CourseCard';
import CreateCourseModal from './CreateCourseModal';
import Header from '../common/Header';

const CoursesList = () => {
    const { profile, loading } = useInstructorProfile();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Simulate local state update until redux is fully wired for mutation
    const [localCourses, setLocalCourses] = useState([]);

    const allCourses = [...(profile?.courses || []), ...localCourses];

    const filteredCourses = useMemo(() => {
        if (!searchTerm) return allCourses;
        const lowerTerm = searchTerm.toLowerCase();
        return allCourses.filter(c => 
            (c.courseTitle || c.title || '').toLowerCase().includes(lowerTerm) ||
            (c.courseCode || c.code || '').toLowerCase().includes(lowerTerm)
        );
    }, [allCourses, searchTerm]);

    const handleCreateCourse = (newCourse) => {
        setLocalCourses(prev => [newCourse, ...prev]);
        // Trigger generic success feedback if available or just alert
        // alert("Course Created Successfully!"); 
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="courses-page-container">
            <Header title="My Courses" />

            <div className="courses-content-wrapper">
                {/* Page Title & Actions */}
                <div className="courses-header-section">
                    <div>
                        <h1 className="page-title-xl">Access Course Content</h1>
                        <p className="page-subtitle-lg">Manage materials, view students, and track performance.</p>
                    </div>
                     <button 
                        className="btn-create-course"
                        onClick={() => setIsModalOpen(true)}
                     >
                        <span>＋</span> Create New Course
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="search-box-wrapper">
                    <div className="search-input-group">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search courses by code or title..." 
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Grid */}
                {filteredCourses.length > 0 ? (
                    <div className="courses-grid">
                        {filteredCourses.map((course, index) => (
                            <CourseCard key={course.id || index} course={course} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-courses-state">
                        <div className="empty-icon-lg">📚</div>
                        <h3 className="empty-title">No courses found</h3>
                        <p className="empty-subtitle">
                            {allCourses.length === 0 
                                ? "You haven't been assigned any courses yet. Contact your department head." 
                                : "Try adjusting your search criteria we couldn't find matches."}
                        </p>
                    </div>
                )}
            </div>

            <CreateCourseModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onSave={handleCreateCourse}
            />
        </div>
    );
};

export default CoursesList;
