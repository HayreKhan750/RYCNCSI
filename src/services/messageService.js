import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  updateDoc, 
  doc 
} from 'firebase/firestore';

export const messageService = {
  // Send a direct message
  sendMessage: async ({ senderId, senderName, receiverId, text }) => {
     if (!senderId || !receiverId || !text) throw new Error("Missing required fields");

     const docRef = await addDoc(collection(db, 'messages'), {
         senderId,
         senderName,
         receiverId,
         text,
         read: false,
         createdAt: serverTimestamp(),
         participants: [senderId, receiverId] // Useful for "My Conversations" query
     });

     return docRef.id;
  },

  // Fetch messages for a user (either as sender or receiver)
  // Typically for an instructor inbox
  fetchInbox: async (userId) => {
      const q = query(
          collection(db, 'messages'), 
          where('receiverId', '==', userId),
          orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // NEW: Fetch all conversations (unique participants)
  fetchConversations: async (userId) => {
      // In a real app, you'd likely have a separate 'conversations' collection.
      // Here, we'll query all messages involved and group them manually.
      // Optimally, use a composite index on participants.
      const q = query(
          collection(db, 'messages'), 
          where('participants', 'array-contains', userId)
          // Removed orderBy to avoid composite index requirement. Sorting is done client-side.
      );
      
      const snap = await getDocs(q);
      const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Group by the "other" person
      const conversations = {};
      messages.forEach(msg => {
          const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
          const otherName = msg.senderId === userId ? (msg.receiverName || 'Participant') : msg.senderName;
          
          if (!conversations[otherId]) {
              conversations[otherId] = {
                  userId: otherId,
                  name: otherName,
                  lastMessage: msg,
                  unreadCount: (!msg.read && msg.receiverId === userId) ? 1 : 0
              };
          } else {
             // Since ordered by desc, the first one encountered is the latest
             if ((msg.createdAt?.seconds || 0) > (conversations[otherId].lastMessage.createdAt?.seconds||0)) {
                 conversations[otherId].lastMessage = msg;
             }
             if (!msg.read && msg.receiverId === userId) {
                 conversations[otherId].unreadCount++;
             }
          }
      });
      
      return Object.values(conversations).sort((a,b) => 
          (b.lastMessage.createdAt?.seconds||0) - (a.lastMessage.createdAt?.seconds||0)
      );
  },

  // NEW: Fetch thread between two users
  fetchThread: async (user1, user2) => {
      // Firestore doesn't support array-contains-all natively efficiently without specific index setup sometimes,
      // but 'participants' array-contains user1 is a start, then filter in memory if needed or use composite.
      // Easier hack: Fetch where array-contains user1, then filter for user2 in memory.
      // Or better: Use the participants logic if we set it up.
      
      // Let's rely on simple client filtering for now to avoid index creation prompt
      const q = query(
          collection(db, 'messages'), 
          where('participants', 'array-contains', user1),
          orderBy('createdAt', 'asc')
      );
      
      const snap = await getDocs(q);
      return snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(m => m.participants.includes(user2));
  },

  // Mark as Read
  markAsRead: async (messageId) => {
      await updateDoc(doc(db, 'messages', messageId), { read: true });
  }
};
