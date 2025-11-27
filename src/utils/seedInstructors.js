import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import scheduleData from '../assets/my-file.optimized.json';

export const seedInstructorsToFirestore = async () => {
    console.log("Starting seeding process...");
    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    if (!scheduleData || !Array.isArray(scheduleData.schedule)) {
        console.error("Invalid schedule data format");
        return { success: false, message: "Invalid data format" };
    }

    const uniqueInstructors = new Map();

    // 1. Extract Unique Instructors
    scheduleData.schedule.forEach(dept => {
        if (Array.isArray(dept.courses)) {
            dept.courses.forEach(course => {
                if (Array.isArray(course.instructor)) {
                    course.instructor.forEach(inst => {
                        if (inst.email) {
                            const email = inst.email.toLowerCase().trim();
                            if (!uniqueInstructors.has(email)) {
                                uniqueInstructors.set(email, {
                                    name: inst.name,
                                    email: email,
                                    department: dept.department,
                                    courses: [course.course_title]
                                });
                            } else {
                                // Add course if not present
                                const existing = uniqueInstructors.get(email);
                                if (!existing.courses.includes(course.course_title)) {
                                    existing.courses.push(course.course_title);
                                }
                            }
                        }
                    });
                }
            });
        }
    });

    console.log(`Found ${uniqueInstructors.size} unique instructors to process.`);

    // 2. Upload to Firestore
    for (const [email, data] of uniqueInstructors) {
        try {
            // Use email as the Document ID for placeholders
            const docRef = doc(db, 'users', email);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                await setDoc(docRef, {
                    ...data,
                    role: 'instructor',
                    isRegistered: false,
                    createdAt: new Date().toISOString(),
                    bio: `Instructor in ${data.department}`,
                    photoURL: null,
                    ratingCount: 0,
                    avgRating: 0
                });
                addedCount++;
                console.log(`Added: ${data.name} (${email})`);
            } else {
                skippedCount++;
                // Optional: Update existing placeholder data if needed
                // await updateDoc(docRef, { department: data.department, courses: data.courses });
            }
        } catch (error) {
            console.error(`Error processing ${email}:`, error);
            errorCount++;
        }
    }

    return {
        success: true,
        message: `Seeding Complete. Added: ${addedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`
    };
};
