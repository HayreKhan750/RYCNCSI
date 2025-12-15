import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { updateUserProfile, uploadProfilePicture } from './userSlice';

// Async Thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const user = await authService.login(email, password);
      const profile = await authService.getUserProfile(user.uid);
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: profile?.role || 'student',
        department: profile?.department || '',
        ...profile
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.googleLogin();
      const profile = await authService.getUserProfile(user.uid);
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: profile?.role || 'student',
        department: profile?.department || '',
        ...profile
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ email, password, name, role, department, file }, { dispatch, rejectWithValue }) => {
    try {
      let photoURL = '';
      
      // 1. Upload Image FIRST if exists
      if (file) {
          // We can't use 'uid' for the path yet because we don't have it!
          // But we can upload to a temp location or use a unique ID.
          // Better approach: Let's register to get the UID, but PASS the file to service? 
          // No, service shouldn't handle UI concerns like file objects if we can avoid it.
          // Wait, 'uploadProfilePicture' uses 'uid' to name the file: `profilePictures/${uid}`.
          // We don't have UID until we register.
          
          // SOLUTION:
          // 1. Register User (Auth Only) -> Gets UID.  (Done in service.register step 1)
          // 2. Upload Image using UID.
          // 3. Update the PENDING doc (not 'users').
          
          // Let's modify the service to handle this "pending update".
          // But we are in the thunk here.
          
          // Let's rely on the service to do the upload? No, separation of concerns.
          
          // REVISED PLAN:
          // 1. call authService.register -> creates Auth User + Pending Doc.
          // 2. if file, upload image.
          // 3. call authService.updatePendingProfile(uid, { photoURL }) -> NEW METHOD needed.
          
          // Actually, let's keep it simple.
          // The service returns the 'user' object.
          // We can just call a special method to update the pending doc.
      }
      
      const user = await authService.register(email, password, name, role, department);
      
      if (file) {
          try {
             // We use the existing upload action, but we need to tell it to update 'pending' or 'users'?
             // The upload action calls `updateUserProfile` which updates 'users'.
             // We need a way to update 'pending_registrations' if the user is not yet fully registered.
             
             // Let's do the upload manually here using the service directly to get the URL,
             // then manually update the pending doc via a new service method.
             // Relying on the thunk 'uploadProfilePicture' effectively breaks because it targets 'users'.
             
             // Import cloudinaryService directly here? Or add a method to authService.
             
             // Implementation in Thunk:
             const { cloudinaryService } = require('../../services/cloudinaryService');
             photoURL = await cloudinaryService.uploadImage(file);
             
             // Check if we need to update the pending doc
             await authService.updatePendingDoc(user.uid, { photoURL, profilePictureUrl: photoURL });
             
          } catch(e) {
              console.error("Failed to upload initial profile image", e);
              // Non-fatal, proceed.
          }
      }

      return {
        uid: user.uid,
        email: user.email,
        displayName: name,
        role,
        department,
        photoURL, // Now populated if successful
        isRegistered: false 
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email, { rejectWithValue }) => {
    try {
      await authService.resetPassword(email);
      return email;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  async (user, { rejectWithValue }) => {
    try {
      await authService.resendVerification(user);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkAuthState = createAsyncThunk(
    'auth/checkState',
    async (_, { dispatch }) => {
        return new Promise((resolve) => {
            authService.onAuthStateChanged(async (user) => {
                if (user) {
                    try { await user.reload(); } catch(e) { /* ignore network error on reload */ }
                    let profile = await authService.getUserProfile(user.uid);
                    
                    // Strict Read-Only: We do NOT auto-finalize here. 
                    // Finalization must be triggered by the Verification Flow explicitly.
                    // If profile is missing, we simply return null profile fields.


                    resolve({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        role: profile?.role || 'student',
                        department: profile?.department || '',
                        ...profile
                    });
                } else {
                    resolve(null);
                }
            });
        });
    }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  loading: false,
  globalLoading: false,
  error: null,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.status = 'succeeded';
    },
    clearError: (state) => {
        state.error = null;
    },
    resetAuthStatus: (state) => {
        state.status = 'idle';
        state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login - Local Loading
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload;
      })
      // Google Login - Local Loading
      .addCase(googleLogin.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload;
      })
      // Register - Local Loading
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload;
      })
      // Logout - Local Loading
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'idle';
        state.loading = false;
      })
      // Reset Password - Local Loading
      .addCase(resetPassword.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = 'succeeded';
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload;
      })
      // Check Auth State - GLOBAL LOADING (App Initialization)
      .addCase(checkAuthState.pending, (state) => {
          state.status = 'loading';
          state.globalLoading = true; 
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
          state.status = 'succeeded';
          state.globalLoading = false;
          state.user = action.payload;
          state.isAuthenticated = !!action.payload;
          state.initialized = true;
      })
      .addCase(checkAuthState.rejected, (state) => {
          state.status = 'failed';
          state.globalLoading = false;
          state.initialized = true;
      })
       // Sync with User Slice updates
      .addCase(updateUserProfile.fulfilled, (state, action) => {
          if (state.user) {
              state.user = { ...state.user, ...action.payload };
          }
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
          if (state.user) {
              state.user = { ...state.user, photoURL: action.payload, profilePictureUrl: action.payload };
          }
      });
  },
});

export const { setUser, clearError, resetAuthStatus } = authSlice.actions;
export default authSlice.reducer;
