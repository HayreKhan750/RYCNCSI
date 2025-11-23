import courseData from '../assets/my-file.optimized.json';

export const getAllInstructors = () => {
  const instructors = [];
  const seenEmails = new Set();

  courseData.schedule.forEach(dept => {
    dept.courses.forEach(course => {
      course.instructor.forEach(inst => {
        if (!seenEmails.has(inst.email)) {
          instructors.push({
            ...inst,
            department: dept.department,
            courses: [course.course_title]
          });
          seenEmails.add(inst.email);
        } else {
          // Add course to existing instructor
          const existing = instructors.find(i => i.email === inst.email);
          if (existing && !existing.courses.includes(course.course_title)) {
            existing.courses.push(course.course_title);
          }
        }
      });
    });
  });
  return instructors;
};

export const getDepartments = () => {
  return courseData.schedule.map(s => s.department);
};

export const getCoursesByDepartment = (deptName) => {
  const dept = courseData.schedule.find(s => s.department === deptName);
  return dept ? dept.courses : [];
};

export default courseData;
