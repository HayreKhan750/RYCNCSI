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
  async (instructorId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      // Pass existing list to service to avoid re-fetching basic info if possible
      // Convert normalized list back to array for service consumption if needed, 
      // or just let service handle it. For now, we pass the array from selectors if we had them,
      // but here we can just pass Object.values(state.instructors.byId)
      const existingList = Object.values(state.instructors.byId);
      const data = await instructorService.fetchInstructorProfile(instructorId, existingList);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const instructorSlice = createSlice({
  name: 'instructors',
  initialState: {
    byId: {},
    allIds: [],
    loading: false,
    error: null,
    activeProfile: {
        data: null,
        ratings: [],
        replies: {},
        loading: false,
        error: null
    }
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchInstructors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInstructors.fulfilled, (state, action) => {
        state.loading = false;
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
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Profile
      .addCase(fetchInstructorProfile.pending, (state) => {
        state.activeProfile.loading = true;
      })
      .addCase(fetchInstructorProfile.fulfilled, (state, action) => {
        state.activeProfile.loading = false;
        state.activeProfile.data = action.payload.profile;
        state.activeProfile.ratings = action.payload.ratings;
        state.activeProfile.replies = action.payload.replies;
      })
      .addCase(fetchInstructorProfile.rejected, (state, action) => {
        state.activeProfile.loading = false;
        state.activeProfile.error = action.payload;
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

export default instructorSlice.reducer;
