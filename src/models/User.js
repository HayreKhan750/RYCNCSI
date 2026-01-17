export default class User {
    constructor(data = {}) {
        this.uid = data.uid || data.id || '';
        this.email = data.email || '';
        this.displayName = data.displayName || data.fullName || data.name || 'User';
        this.photoURL = data.photoURL || data.profilePictureUrl || '';
        this.role = data.role || 'student';
        this.department = data.department || data.departmentId || 'General';
        this.isVerified = !!(data.isVerified || data.emailVerified);
        this.isRegistered = !!(data.isRegistered);
        this.createdAt = data.createdAt ? new Date(data.createdAt.seconds * 1000) : null;
    }

    /**
     * Checks if the user has a specific role.
     * @param {string} roleName 
     * @returns {boolean}
     */
    hasRole(roleName) {
        return this.role === roleName;
    }

    /**
     * Returns a serialized plain object for Redux/State.
     * @returns {Object}
     */
    toJSON() {
        return {
            uid: this.uid,
            email: this.email,
            displayName: this.displayName,
            photoURL: this.photoURL,
            role: this.role,
            department: this.department,
            isVerified: this.isVerified,
            isRegistered: this.isRegistered,
            createdAt: this.createdAt ? this.createdAt.toISOString() : null
        };
    }

    static fromFirestore(doc) {
        const data = doc.data();
        return new User({
            ...data,
            uid: doc.id
        });
    }
}
