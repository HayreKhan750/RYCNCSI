import axios from 'axios';

const CLOUD_NAME = 'dx9bzbz6l';
const UPLOAD_PRESET = 'upload_preset'; // User provided this value

export const cloudinaryService = {
  uploadImage: async (file, userType = 'student') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    
    // Dynamic folder based on user type
    const folderPath = userType === 'instructor' 
      ? 'profile_images/instructors' 
      : 'profile_images/students';
    
    formData.append('folder', folderPath);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            // We can expose this if we want fine-grained progress tracking in the service
            // For now, the component will likely handle its own progress simulation or we can pass a callback
          }
        }
      );
      return response.data.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      throw error;
    }
  }
};
