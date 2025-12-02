import { Timestamp } from 'firebase/firestore';

/**
 * Recursively converts Firestore Timestamps to ISO strings in an object or array.
 * @param {any} data - The data to serialize.
 * @returns {any} - The serialized data.
 */
export const serializeFirestoreData = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(item => serializeFirestoreData(item));
  }

  if (typeof data === 'object') {
    const serialized = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        serialized[key] = serializeFirestoreData(data[key]);
      }
    }
    return serialized;
  }

  return data;
};
