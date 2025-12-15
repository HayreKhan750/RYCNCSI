import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { cloudinaryService } from '../../services/cloudinaryService';
// Removed: import { storage } from '../../firebase';
// Removed: import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async ({ uid, data }, { rejectWithValue }) => {
    try {
      await authService.updateUserProfile(uid, data);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadProfilePicture = createAsyncThunk(
  'user/uploadProfilePicture',
  async ({ uid, file }, { rejectWithValue }) => {
    try {
      // Use Cloudinary Service instead of Firebase Storage
      const url = await cloudinaryService.uploadImage(file);
      
      // Update user profile with new URL
      await authService.updateUserProfile(uid, { photoURL: url, profilePictureUrl: url });
      
      return url;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (state.profile) {
            state.profile = { ...state.profile, ...action.payload };
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Upload Picture
      .addCase(uploadProfilePicture.pending, (state) => {
          state.status = 'loading';
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
          state.status = 'succeeded';
          if (state.profile) {
              state.profile.photoURL = action.payload;
              state.profile.profilePictureUrl = action.payload;
          }
      })
      .addCase(uploadProfilePicture.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
      });
  },
});

export default userSlice.reducer;
