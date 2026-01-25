import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { cloudinaryService } from '../../services/cloudinaryService';
import { updateUserProfile, uploadProfilePicture } from './userSlice';

// Helper for timeout
const withTimeout = (promise, ms = 5000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms))
    ]);
};

// --- THUNKS ---

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const user = await authService.login(email, password);
      // Profile fetch helps, but real hydration happens in checkAuthState typically.
      // However, for login, we want immediate feedback.
      const profile = await authService.getUserProfile(user.uid);
      
      // If no profile, we trust checkAuthState to handle "Onboarding" or "Repair"
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: profile?.role || 'student', // Default safe
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
      return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ email, password, name, role, department, file }, { rejectWithValue }) => {
    try {
      let photoURL = null;
      
      // Upload file if provided
      if (file) {
          try {
              photoURL = await cloudinaryService.uploadImage(file);
          } catch (uploadErr) {
              console.error("Profile image upload failed:", uploadErr);
              // We continue without image rather than blocking registration
          }
      }
      
      const user = await authService.register(email, password, name, role, department, photoURL);
      return {
        uid: user.uid,
        email: user.email,
        displayName: name,
        role,
        department,
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

// --- 5. Resend Verification Email ---
export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  async (user, { rejectWithValue }) => {
    try {
      // Note: We expect the Component to pass the Firebase User object
      // If it fails due to serializability, we might need to rely on auth.currentUser in service
      await authService.resendVerification(user); 
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- CORE AUTH CHECK (The Guard) ---
export const checkAuthState = createAsyncThunk(
    'auth/checkState',
    async (_, { dispatch }) => {
        return new Promise((resolve) => {
            const unsubscribe = authService.onAuthStateChanged(async (user) => {
                unsubscribe(); // One-time check
                
                if (user) {
                    try {
                        // PHASE 1: Authenticated (Firebase knows who you are)
                        // dispatcher({ type: 'auth/firebaseAuthenticated', payload: user }); // Internal if needed

                        // PHASE 2: Hydration (Firestore knows who you are)
                        // Critical: We MUST wait for this.
                        let profile = null;
                        try {
                             profile = await withTimeout(authService.getUserProfile(user.uid, user.email), 4000);
                        } catch (e) {
                            console.warn("Profile hydration failed/timed out", e);
                        }

                        // Auto-Repair Logic (Moved mainly to Service, but fail-safe here)
                        // CRITICAL FIX: Do NOT create default profile if user is unverified.
                        // This prevents the "Student" role from being locked in before finalizeRegistration runs.
                        if (!profile && user.emailVerified) {
                            console.warn("Verified user missing profile. Repairing...");
                            try {
                                profile = await authService.createDefaultProfile(user);
                            } catch(e) {
                                console.error("Critical: Could not create default profile.", e);
                            }
                        } else if (!profile) {
                            // Unverified and no profile? Likely pending registration. 
                            console.log("User profile missing (pending verification).");
                        }

                        resolve({
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                            role: profile?.role || 'student', // UI will handle redirection/verification screen based on isRegistered check
                            department: profile?.department || '',
                            mfaEnabled: profile?.mfaEnabled || false,
                            ...profile,
                            isRegistered: !!profile // If false, routing sends to Verify/AuthEntry
                        });
                    } catch (error) {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            });
        });
    }
);

const initialState = {
  user: null,
  // NEW STATE MACHINE
  authStatus: 'idle', // 'idle' | 'checking' | 'authenticated' | 'hydrated'
  mfaStatus: 'none',  // 'none' | 'required' | 'verified'
  
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
        state.user = action.payload;
        state.authStatus = 'hydrated';
    },
    setMfaStatus: (state, action) => {
        state.mfaStatus = action.payload;
        if (state.user && action.payload === 'verified') {
            sessionStorage.setItem(`mfa_${state.user.uid}`, 'verified');
        }
    },
    clearError: (state) => {
        state.error = null;
    },
    resetAuthStatus: (state) => {
        state.authStatus = 'idle';
        state.mfaStatus = 'none';
        state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthState.pending, (state) => {
          state.authStatus = 'checking';
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
          if (action.payload) {
              state.user = action.payload;
              state.authStatus = 'hydrated'; // Fully ready
              
              // Persisted MFA Logic
              const mfaSession = sessionStorage.getItem(`mfa_${action.payload.uid}`);
              const isPrivileged = action.payload.role === 'admin' || action.payload.role === 'management';
              const isDev = process.env.NODE_ENV === 'development';
              
              if (isPrivileged && !isDev) {
                  // If unverified session, require it. If persisted, trust it.
                  state.mfaStatus = mfaSession === 'verified' ? 'verified' : 'required';
              } else {
                  state.mfaStatus = 'verified'; // Regular users + Dev Mode allowed
              }
          } else {
              state.user = null;
              state.authStatus = 'unauthenticated';
              state.mfaStatus = 'none';
          }
      })
      .addCase(checkAuthState.rejected, (state) => {
          state.authStatus = 'unauthenticated';
          state.user = null;
      })
      
      // Login
      .addCase(loginUser.fulfilled, (state, action) => {
          state.user = action.payload;
          state.authStatus = 'hydrated';
          
          const isDev = process.env.NODE_ENV === 'development';
           if ((action.payload.role === 'admin' || action.payload.role === 'management') && !isDev) {
              state.mfaStatus = 'required';
          } else {
              state.mfaStatus = 'verified';
          }
      })
      .addCase(loginUser.rejected, (state, action) => {
          state.error = action.payload;
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
          state.user = null;
          state.authStatus = 'unauthenticated';
          state.mfaStatus = 'none';
          sessionStorage.clear(); // Clear all auth sessions
      })
      
      // Sync User Slice
      .addCase(updateUserProfile.fulfilled, (state, action) => {
          if (state.user) {
              state.user = { ...state.user, ...action.payload };
          }
      });
  },
});

export const { setUser, setMfaStatus, clearError, resetAuthStatus } = authSlice.actions;
export default authSlice.reducer;
