import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const auditService = {
  /**
   * Log an administrative or critical action.
   * @param {string} actorId - UID of the user performing the action.
   * @param {string} action - Description of the action (e.g., "GRANT_ADMIN", "DELETE_FEEDBACK").
   * @param {string} targetId - ID of the object being acted upon (user UID, feedback ID, etc.).
   * @returns {Promise<string>} - The ID of the created log entry.
   */
  logAction: async (actorId, action, targetId) => {
    try {
      if (!actorId || !action) {
        console.warn("Audit Log missing required fields:", { actorId, action });
        return;
      }

      const docRef = await addDoc(collection(db, 'audit_logs'), {
        actorId,
        action,
        targetId: targetId || 'N/A',
        timestamp: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error("Failed to write audit log:", error);
      // We don't throw here to prevent blocking the main action, 
      // but in strict compliance environments, you might want to.
    }
  }
};
