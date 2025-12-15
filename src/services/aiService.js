import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';

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
      console.error("Error fetching AI insights:", error);
      return null;
    }
  },

  /**
   * (Simulation) Generate an AI Summary based on recent feedback.
   * In production, this would be a Cloud Function or specialized backend service.
   * Here we simulate it to populate the schema.
   */
  generateInsight: async (scope, targetId, feedbackText = []) => {
    // 1. Simulate Analysis
    // Simple logic: Check for keywords or sentiment
    // This is a PLACEHOLDER for the actual AI logic
    
    // In a real app, you'd call an OpenAI/Vertex AI endpoint here.
    
    let riskLevel = 'low';
    let summary = 'Performance is stable. Student sentiment is generally positive.';
    
    if (feedbackText.some(t => t.toLowerCase().includes('bad') || t.toLowerCase().includes('terrible'))) {
        riskLevel = 'medium';
        summary = 'Some negative sentiment detected regarding teaching style.';
    }
    
    // 2. Write to DB
    const insightData = {
        scope,
        targetId,
        summary,
        riskLevel,
        generatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'ai_insights'), insightData);
    return { id: docRef.id, ...insightData };
  }
};
