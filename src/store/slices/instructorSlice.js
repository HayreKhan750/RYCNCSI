import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { instructorService } from '../../services/instructorService';
import { addReply, deleteReply, voteReply } from '../slices/feedbackSlice';

export const fetchInstructors = createAsyncThunk(
  'instructors/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await instructorService.fetchAllInstructors();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchInstructorProfile = createAsyncThunk(
  'instructors/fetchProfile',
  async (arg, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      
      // Handle both string ID and object { instructorId, email }
      let instructorId = arg;
      let fallbackEmail = null;
      
      if (typeof arg === 'object' && arg !== null) {
          instructorId = arg.instructorId;
          fallbackEmail = arg.email;
      }

      // Pass existing list to service to avoid re-fetching basic info if possible
      const existingList = Object.values(state.instructors.byId);
      const data = await instructorService.fetchInstructorProfile(instructorId, existingList, fallbackEmail);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateInstructorProfile = createAsyncThunk(
  'instructors/updateProfile',
  async ({ uid, data }, { rejectWithValue }) => {
    try {
      const updated = await instructorService.updateInstructorProfile(uid, data);
      return updated;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  byId: {},
  allIds: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  activeProfile: {
      data: null,
      ratings: [],
      replies: {},
      status: 'idle',
      error: null
  }
};

const instructorSlice = createSlice({
  name: 'instructors',
  initialState,
  reducers: {
      clearActiveProfile: (state) => {
          state.activeProfile = initialState.activeProfile;
      }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchInstructors.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchInstructors.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Normalize data
        const byId = {};
        const allIds = [];
        action.payload.forEach(inst => {
            byId[inst.id] = inst;
            allIds.push(inst.id);
        });
        state.byId = byId;
        state.allIds = allIds;
      })
      .addCase(fetchInstructors.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Fetch Profile
      .addCase(fetchInstructorProfile.pending, (state) => {
        state.activeProfile.status = 'loading';
        state.activeProfile.error = null;
      })
      .addCase(fetchInstructorProfile.fulfilled, (state, action) => {
        state.activeProfile.status = 'succeeded';
        state.activeProfile.data = action.payload.profile;
        state.activeProfile.ratings = action.payload.ratings;
        state.activeProfile.replies = action.payload.replies;
      })
      .addCase(fetchInstructorProfile.rejected, (state, action) => {
        state.activeProfile.status = 'failed';
        state.activeProfile.error = action.payload;
      })
      // Update Profile
      .addCase(updateInstructorProfile.fulfilled, (state, action) => {
          if (state.activeProfile.data) {
              state.activeProfile.data = { ...state.activeProfile.data, ...action.payload };
          }
      })
      // Add Reply (Sync with Feedback Slice)
      .addCase(addReply.fulfilled, (state, action) => {
          const { feedbackId, reply } = action.payload;
          if (state.activeProfile.replies) {
              if (!state.activeProfile.replies[feedbackId]) {
                  state.activeProfile.replies[feedbackId] = [];
              }
              state.activeProfile.replies[feedbackId].push(reply);
          }
      })
      .addCase(deleteReply.fulfilled, (state, action) => {
          const { feedbackId, replyId } = action.payload;
          if (state.activeProfile.replies && state.activeProfile.replies[feedbackId]) {
              state.activeProfile.replies[feedbackId] = state.activeProfile.replies[feedbackId].filter(r => r.id !== replyId);
          }
      })
      .addCase(voteReply.fulfilled, (state, action) => {
          const { feedbackId, replyId, type } = action.payload;
          if (state.activeProfile.replies && state.activeProfile.replies[feedbackId]) {
              const reply = state.activeProfile.replies[feedbackId].find(r => r.id === replyId);
              if (reply) {
                  if (type === 'like') reply.likes = (reply.likes || 0) + 1;
                  else reply.dislikes = (reply.dislikes || 0) + 1;
              }
          }
      });
  },
});

export const { clearActiveProfile } = instructorSlice.actions;
export default instructorSlice.reducer;
