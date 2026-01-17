import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export const aiService = {
  /**
   * Fetch latest AI insights for a specific target.
   * @param {string} scope - 'instructor' | 'department' | 'system'
   * @param {string} targetId - ID of the target (instructorId, deptId, or 'system')
   */
  fetchInsights: async (scope, targetId) => {
    try {
      const q = query(
        collection(db, 'ai_insights'),
        where('scope', '==', scope),
        where('targetId', '==', targetId),
        orderBy('generatedAt', 'desc'),
        limit(1)
      );
      
      const snap = await getDocs(q);
      if (snap.empty) return null;
      
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (error) {
      console.warn("Error fetching AI insights:", error);
      return null;
    }
  }
};
