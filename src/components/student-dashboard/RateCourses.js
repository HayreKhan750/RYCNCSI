import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import RatingModal from './RatingModal';
import scheduleData from '../../assets/my-file.optimized.json'; // Using local JSON as primary source for speed

export default function RateCourses({ user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Parse scheduleData into a flat list of ratable items
    // Structure: { sectionName: [courses...] }
    const allItems = [];
    Object.entries(scheduleData).forEach(([section, items]) => {
        if(Array.isArray(items)) {
            items.forEach(item => {
                allItems.push({
                    ...item,
                    id: `${section}-${item.courseNo}`, // Generate unique ID
                    section
                });
            });
        }
    });
    setCourses(allItems);
    setFilteredCourses(allItems);
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredCourses(courses);
      return;
    }
    const lower = searchTerm.toLowerCase();
    const filtered = courses.filter(c => 
      (c.courseTitle && c.courseTitle.toLowerCase().includes(lower)) ||
      (c.instructors && c.instructors.toLowerCase().includes(lower)) ||
      (c.dept && c.dept.toLowerCase().includes(lower))
    );
    setFilteredCourses(filtered);
  }, [searchTerm, courses]);

  const handleRateClick = (course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  return (
    <div className="rate-courses-page">
      <input 
        type="text" 
        placeholder="🔍 Search instructor, course, or department..." 
        className="search-bar-large"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="courses-grid-layout">
        {filteredCourses.slice(0, 50).map((course) => (
          <div key={course.id} className="glass-card instructor-card-lg">
            <div className="card-banner"></div>
            <div className="card-avatar-wrapper">
               <div style={{width:'100%', height:'100%', background:'#e0e7ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 24, fontWeight:'bold', color:'#6366f1'}}>
                 {(course.instructors || 'T').charAt(0)}
               </div>
            </div>
            <div className="card-content">
              <span className="dept">{course.dept || 'General'}</span>
              <h3>{course.instructors || 'Unknown Instructor'}</h3>
              <p style={{margin:'0 0 15px', opacity:0.7, fontSize:14}}>
                 {course.courseTitle} ({course.courseNo})
              </p>
              <button className="rate-btn" onClick={() => handleRateClick(course)}>Rate Now</button>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
          <div style={{textAlign:'center', padding: 40, opacity: 0.6}}>No results found.</div>
      )}

      {isModalOpen && (
        <RatingModal 
          course={selectedCourse} 
          user={user} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
