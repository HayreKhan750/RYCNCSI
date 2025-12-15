import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { studentService } from '../../services/studentService';

// Thunks
export const fetchStudentProfile = createAsyncThunk(
  'student/fetchProfile',
  async (uid, { rejectWithValue }) => {
    try {
      const data = await studentService.fetchStudentProfile(uid);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  currentProfile: null, // The student profile being viewed (includes stats)
  myRatings: [],
  ratedInstructors: [],
  stats: null,
  userReactions: {}, // For the student being viewed? Or My reactions? Usually 'feedbackSlice' handles current user reactions. 
                     // studentService returns userReactions/flags for the profile.
  loading: false,
  error: null
};

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
      clearStudentProfile: (state) => {
          state.currentProfile = null;
          state.myRatings = [];
          state.ratedInstructors = [];
          state.stats = null;
      }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Unpack the composite object from studentService
        const { profile, myRatings, stats, ratedInstructors, userReactions } = action.payload;
        
        state.currentProfile = profile;
        state.myRatings = myRatings;
        state.stats = stats;
        state.ratedInstructors = ratedInstructors;
        // userReactions might be useful if we want to show "what this student liked"
        state.userReactions = userReactions; 
      })
      .addCase(fetchStudentProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearStudentProfile } = studentSlice.actions;
export default studentSlice.reducer;
