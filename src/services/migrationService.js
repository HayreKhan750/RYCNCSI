import { db } from '../firebase';
import { collection, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';

export const migrationService = {
  // Migrate Students -> Users
  migrateStudentsToUsers: async () => {
    console.log("Starting Migration: Students -> Users...");
    const logs = [];
    
    try {
      // 1. Fetch all legacy students
      const studentsSnap = await getDocs(collection(db, 'students'));
      logs.push(`Found ${studentsSnap.size} students to migrate.`);

      // 2. Iterate and Write to 'users'
      let migratedCount = 0;
      const promises = studentsSnap.docs.map(async (studentDoc) => {
        const data = studentDoc.data();
        const uid = studentDoc.id; // Authentication UID is the key

        // Map legacy fields to new Enterprise Schema
        const userPayload = {
          uid: uid,
          email: data.email,
          displayName: data.name || data.displayName,
          name: data.name || data.displayName, // Keep both for safety
          role: 'student', // Enforce role
          department: data.department || 'General',
          photoURL: data.profilePictureUrl || data.photoURL || '',
          profilePictureUrl: data.profilePictureUrl || data.photoURL || '',
          isRegistered: data.isRegistered || false,
          migratedAt: serverTimestamp(),
          createdAt: data.createdAt || serverTimestamp(), // Preserve or set new
          metadata: {
            source: 'migration_v1',
            originalId: data.id || uid
          }
        };

        // Write to 'users' collection
        // use merge: true to avoid overwriting if they already signed in to 'users'
        await setDoc(doc(db, 'users', uid), userPayload, { merge: true });
        migratedCount++;
      });

      await Promise.all(promises);
      
      logs.push(`Successfully migrated ${migratedCount} users.`);
      return { success: true, logs };

    } catch (error) {
      console.error("Migration Failed:", error);
      logs.push(`Error: ${error.message}`);
      return { success: false, logs };
    }
  },

  // Migrate Instructors -> Users & Optimized Collection
  migrateInstructors: async () => {
    console.log("Starting Migration: Instructors...");
    const logs = [];
    
    try {
      const instRef = collection(db, 'instructors');
      const instSnap = await getDocs(instRef);
      logs.push(`Found ${instSnap.size} instructors to migrate.`);

      let count = 0;
      const promises = instSnap.docs.map(async (instDoc) => {
        const data = instDoc.data();
        const uid = instDoc.id;

        // 1. Create/Update User Entry (Unified Auth)
        const userPayload = {
          uid: uid,
          email: data.email || `${data.id}@academicpulse.edu`, // Fallback email
          displayName: data.name || data.instructorName,
          name: data.name || data.instructorName,
          role: 'instructor',
          department: data.department || 'General',
          photoURL: data.photoURL || data.profilePictureUrl || '',
          profilePictureUrl: data.photoURL || data.profilePictureUrl || '',
          isRegistered: true, // Auto-register
          migratedAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', uid), userPayload, { merge: true });

        // 2. Ensure Instructor Collection is Optimized (Read-Heavy)
        // Make sure it has the fields we expect in the UI
        const optimizedPayload = {
            ...data,
            instructorName: data.name || data.instructorName, // Standardize
            stats: data.stats || { avgRating: 0, ratingCount: 0 },
            courses: data.courses || [],
            updatedAt: serverTimestamp()
        };
        await setDoc(doc(db, 'instructors', uid), optimizedPayload, { merge: true });
        
        count++;
      });

      await Promise.all(promises);
      logs.push(`Successfully migrated ${count} instructors.`);
      return { success: true, logs };

    } catch (error) {
      console.error("Instructor Migration Failed:", error);
      logs.push(`Error: ${error.message}`);
      return { success: false, logs };
    }
  }
};
