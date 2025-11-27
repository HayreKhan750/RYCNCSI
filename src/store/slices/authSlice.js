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
      const user = await authService.register(email, password, name, role, department);
      
      let photoURL = '';
      if (file) {
          const resultAction = await dispatch(uploadProfilePicture({ uid: user.uid, file }));
          if (uploadProfilePicture.fulfilled.match(resultAction)) {
              photoURL = resultAction.payload;
          }
      }

      return {
        uid: user.uid,
        email: user.email,
        displayName: name,
        role,
        department,
        photoURL
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
                    const profile = await authService.getUserProfile(user.uid);
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
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Google Login
      .addCase(googleLogin.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'idle';
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Check Auth State
      .addCase(checkAuthState.pending, (state) => {
          state.status = 'loading';
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
          state.status = 'succeeded';
          state.user = action.payload;
          state.isAuthenticated = !!action.payload;
          state.initialized = true;
      })
      .addCase(checkAuthState.rejected, (state) => {
          state.status = 'failed';
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
