import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

export const metadataService = {
  
  // --- DEPARTMENTS ---
  
  fetchAllDepartments: async () => {
    try {
      const q = query(collection(db, 'departments'), orderBy('name'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error("Error fetching departments:", error);
      return [];
    }
  },

  addDepartment: async (data) => {
    // Schema: departmentId, name, facultyCount, studentCount, avgRating
    const cleanData = {
        name: data.name,
        facultyCount: data.facultyCount || 0,
        studentCount: data.studentCount || 0,
        avgRating: data.avgRating || 0
    };
    const ref = await addDoc(collection(db, 'departments'), cleanData);
    // Strict Schema: Store departmentId
    await updateDoc(ref, { departmentId: ref.id });
    
    return { id: ref.id, departmentId: ref.id, ...cleanData };
  },

  updateDepartment: async (id, data) => {
    const ref = doc(db, 'departments', id);
    await updateDoc(ref, data);
    return { id, ...data };
  },

  deleteDepartment: async (id) => {
    await deleteDoc(doc(db, 'departments', id));
    return id;
  },

  // --- COURSES ---

  fetchAllCourses: async (departmentId = null) => {
    try {
      let q = collection(db, 'courses');
      if (departmentId) {
        q = query(q, where('departmentId', '==', departmentId));
      } else {
        q = query(q, orderBy('title')); // Default sort
      }
      
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error("Error fetching courses:", error);
      return [];
    }
  },

  addCourse: async (data) => {
    // Schema: courseId, title, departmentId, year, semester, credit
    const cleanData = {
        title: data.title,
        departmentId: data.departmentId,
        year: data.year,
        semester: data.semester,
        credit: data.credit
    };
    const ref = await addDoc(collection(db, 'courses'), cleanData);
    // Strict Schema
    await updateDoc(ref, { courseId: ref.id });
    
    return { id: ref.id, courseId: ref.id, ...cleanData };
  },

  updateCourse: async (id, data) => {
    const ref = doc(db, 'courses', id);
    await updateDoc(ref, data);
    return { id, ...data };
  },

  deleteCourse: async (id) => {
    await deleteDoc(doc(db, 'courses', id));
    return id;
  },

  // --- CAMPUSES ---

  fetchAllCampuses: async () => {
    try {
      const q = query(collection(db, 'campuses'), orderBy('name'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error("Error fetching campuses:", error);
      return [];
    }
  },

  addCampus: async (data) => {
    // Schema: campusId, name, location, active
    const cleanData = {
        name: data.name,
        location: data.location || '',
        active: data.active !== false // Default true
    };
    const ref = await addDoc(collection(db, 'campuses'), cleanData);
    // Strict Schema
    await updateDoc(ref, { campusId: ref.id });

    return { id: ref.id, campusId: ref.id, ...cleanData };
  },

  updateCampus: async (id, data) => {
    const ref = doc(db, 'campuses', id);
    await updateDoc(ref, data);
    return { id, ...data };
  },

  deleteCampus: async (id) => {
    await deleteDoc(doc(db, 'campuses', id));
    return id;
  }
};
