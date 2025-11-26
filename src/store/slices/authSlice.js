import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { updateUserProfile, uploadProfilePicture } from './userSlice';

// Async Thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const user = await authService.login(email, password);
      // Fetch full profile to get role
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

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: true, // Start true to handle initial check
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.loading = false;
    },
    clearError: (state) => {
        state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Google Login
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        // Maybe set a success message flag if needed, but for now just stop loading
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Resend Verification
      .addCase(resendVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendVerification.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Check Auth State
      .addCase(checkAuthState.pending, (state) => {
          state.loading = true;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
          state.loading = false;
          state.user = action.payload;
          state.isAuthenticated = !!action.payload;
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

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
