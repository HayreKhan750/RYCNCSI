import { db } from '../firebase';
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  serverTimestamp,
  runTransaction,
  increment,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

const repliesCollection = (feedbackId) => collection(db, 'feedbacks', feedbackId, 'replies');
const flagsCollection = (feedbackId) => collection(db, 'feedbacks', feedbackId, 'flags');
const reactionDoc = (feedbackId, userId) => doc(db, 'userReactions', userId, 'feedbackReactions', feedbackId);

export async function fetchReplies(feedbackId) {
  if (!feedbackId) return [];
  const repliesQuery = query(repliesCollection(feedbackId), orderBy('createdAt', 'asc'));
  const snap = await getDocs(repliesQuery);
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function postReply({ feedbackId, authorId, authorRole, authorName, text, parentReplyId = null }) {
  if (!feedbackId || !authorId || !text) return null;
  const replyRef = await addDoc(repliesCollection(feedbackId), {
    authorId,
    authorRole,
    authorName,
    text,
    parentReplyId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deleted: false,
  });

  const feedbackRef = doc(db, 'feedbacks', feedbackId);
  await runTransaction(db, async (tx) => {
    const feedbackSnap = await tx.get(feedbackRef);
    if (!feedbackSnap.exists()) return;
    const prevCount = feedbackSnap.data()?.replyCount || 0;
    tx.update(feedbackRef, { replyCount: prevCount + 1 });
  });

  return replyRef.id;
}

export async function editReply({ feedbackId, replyId, newText }) {
  if (!feedbackId || !replyId) return;
  const replyRef = doc(db, 'feedbacks', feedbackId, 'replies', replyId);
  await setDoc(
    replyRef,
    {
      text: newText,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function toggleReaction({ feedbackId, userId, type }) {
  if (!feedbackId || !userId) return null;
  return runTransaction(db, async (tx) => {
    const feedbackRef = doc(db, 'feedbacks', feedbackId);
    const reactionRef = reactionDoc(feedbackId, userId);
    const reactionSnap = await tx.get(reactionRef);
    const feedbackSnap = await tx.get(feedbackRef);
    if (!feedbackSnap.exists()) return null;

    const previousType = reactionSnap.exists() ? reactionSnap.data()?.type : null;
    let likesDelta = 0;
    let dislikesDelta = 0;

    if (previousType === type) {
      if (type === 'like') likesDelta -= 1;
      if (type === 'dislike') dislikesDelta -= 1;
      tx.delete(reactionRef);
    } else {
      if (type === 'like') likesDelta += 1;
      if (type === 'dislike') dislikesDelta += 1;
      if (previousType === 'like') likesDelta -= 1;
      if (previousType === 'dislike') dislikesDelta -= 1;
      tx.set(reactionRef, {
        type,
        userId,
        createdAt: serverTimestamp(),
      });
    }

    const updates = {};
    if (likesDelta !== 0) updates.likesCount = increment(likesDelta);
    if (dislikesDelta !== 0) updates.dislikesCount = increment(dislikesDelta);
    tx.update(feedbackRef, updates);

    return {
      type: previousType === type ? null : type,
    };
  });
}

export async function getUserReaction(feedbackId, userId) {
  if (!feedbackId || !userId) return null;
  const snap = await getDoc(reactionDoc(feedbackId, userId));
  return snap.exists() ? snap.data() : null;
}

export async function fetchUserReactions(userId) {
  if (!userId) return [];
  const q = query(collection(db, 'userReactions', userId, 'feedbackReactions'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ feedbackId: docSnap.id, ...(docSnap.data() || {}) }));
}

export async function fetchUserFlags(userId) {
  if (!userId) return [];
  try {
    const flagsQuery = query(collectionGroup(db, 'flags'), where('flaggedBy', '==', userId));
    const snapshot = await getDocs(flagsQuery);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      feedbackId: docSnap.ref.parent.parent?.id,
      ...(docSnap.data() || {}),
    }));
  } catch (e) {
    console.warn('Could not load user flags; you may need to create a collection group index for `flags.flaggedBy` in Firestore.', e);
    return [];
  }
}

export async function flagFeedback({ feedbackId, userId, reason, details, metadata = {} }) {
  if (!feedbackId || !userId) return null;
  const flagRef = await addDoc(flagsCollection(feedbackId), {
    feedbackId,
    flaggedBy: userId,
    reason,
    details,
    metadata,
    status: 'open',
    createdAt: serverTimestamp(),
    resolvedAt: null,
    resolvedBy: null,
  });
  const feedbackRef = doc(db, 'feedbacks', feedbackId);
  await runTransaction(db, async (tx) => {
    const feedbackSnap = await tx.get(feedbackRef);
    if (!feedbackSnap.exists()) return;
    const prev = feedbackSnap.data()?.flagCount || 0;
    tx.update(feedbackRef, { flagCount: prev + 1 });
  });
  return flagRef.id;
}
