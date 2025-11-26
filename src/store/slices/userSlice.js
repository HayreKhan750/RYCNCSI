import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '../../services/userService';

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async ({ uid, data }, { rejectWithValue }) => {
    try {
      const updatedData = await userService.updateProfile(uid, data);
      return updatedData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadProfilePicture = createAsyncThunk(
  'user/uploadProfilePicture',
  async ({ uid, file }, { rejectWithValue }) => {
    try {
      const downloadURL = await userService.uploadProfilePicture(uid, file);
      return downloadURL;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    loading: false,
    error: null,
    success: false
  },
  reducers: {
    resetUserStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateUserProfile.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload Picture
      .addCase(uploadProfilePicture.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadProfilePicture.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetUserStatus } = userSlice.actions;
export default userSlice.reducer;
