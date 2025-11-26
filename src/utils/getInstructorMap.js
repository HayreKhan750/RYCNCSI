import scheduleData from '../assets/my-file.optimized.json';

export const getInstructorMap = () => {
  const map = new Map();
  if (!scheduleData || !scheduleData.schedule) return map;

  scheduleData.schedule.forEach(dept => {
    if (dept.courses) {
      dept.courses.forEach(course => {
        if (course.instructor) {
          if (Array.isArray(course.instructor)) {
            course.instructor.forEach(inst => {
              if (inst.name) map.set(inst.name, inst.name); // Using name as ID for now if no specific ID
            });
          } else {
             map.set(course.instructor, course.instructor);
          }
        }
      });
    }
  });
  return map;
};
