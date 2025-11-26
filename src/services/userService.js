import { db, storage } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const userService = {
  // Update Profile Data
  updateProfile: async (uid, data) => {
    const userRef = doc(db, 'users', uid);
    const payload = {
        ...data,
        updatedAt: serverTimestamp()
    };
    await updateDoc(userRef, payload);
    return payload;
  },

  // Upload Profile Picture
  uploadProfilePicture: async (uid, file) => {
    const storageRef = ref(storage, `profilePictures/${uid}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update user doc with new URL
    await userService.updateProfile(uid, { photoURL: downloadURL, profilePictureUrl: downloadURL });
    
    return downloadURL;
  }
};
