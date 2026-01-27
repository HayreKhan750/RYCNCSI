import User from './User';

export default class Instructor extends User {
    constructor(data = {}) {
        super(data);
        this.instructorId = data.instructorId || this.uid;
        this.ratingStats = data.ratingStats || { average: 0, totalRatings: 0, distribution: {} };
        this.engagementScore = data.engagementScore || 0;
        this.bio = data.bio || '';
        this.courses = data.courses || [];
        this.tags = data.tags || [];
        // Ensure role is forced
        this.role = 'instructor';
    }

    get averageRating() {
        return this.ratingStats.average?.toFixed(1) || '0.0';
    }

    get totalRatings() {
        return this.ratingStats.totalRatings || 0;
    }

    /**
     * Returns a quick summary of the instructor's performance.
     */
    getPerformanceSummary() {
        return {
            rating: this.averageRating,
            reviews: this.totalRatings,
            engagement: this.engagementScore
        };
    }

    toJSON() {
        return {
            ...super.toJSON(),
            instructorId: this.instructorId,
            ratingStats: this.ratingStats,
            engagementScore: this.engagementScore,
            bio: this.bio,
            courses: this.courses,
            tags: this.tags,
            averageRating: this.averageRating,
            // Ensure UI-compatible fields are present
            fullName: this.displayName,
            instructorName: this.displayName,
            name: this.displayName
        };
    }

    static fromFirestore(doc) {
        const data = doc.data();
        return new Instructor({
            ...data,
            id: doc.id,
            // Map Firestore public profile fields to Model standard
            department: data.departmentId || data.department, 
            displayName: data.fullName || data.instructorName
        });
    }
}
