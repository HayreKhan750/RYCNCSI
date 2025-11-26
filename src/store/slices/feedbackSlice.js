import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { feedbackService } from '../../services/feedbackService';

// Thunks
export const fetchFeedbacks = createAsyncThunk(
  'feedbacks/fetchAll',
  async (filters, { rejectWithValue }) => {
    try {
      const data = await feedbackService.fetchFeedbacks(filters);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitFeedback = createAsyncThunk(
  'feedbacks/submit',
  async (feedbackData, { rejectWithValue }) => {
    try {
      const data = await feedbackService.submitFeedback(feedbackData);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteFeedback = createAsyncThunk(
  'feedbacks/delete',
  async (id, { rejectWithValue }) => {
    try {
      await feedbackService.deleteFeedback(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateFeedback = createAsyncThunk(
  'feedbacks/update',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const data = await feedbackService.updateFeedback(id, updates);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addReply = createAsyncThunk(
  'feedbacks/addReply',
  async ({ feedbackId, replyData }, { rejectWithValue }) => {
    try {
      const data = await feedbackService.addReply(feedbackId, replyData);
      return { feedbackId, reply: data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const feedbackSlice = createSlice({
  name: 'feedbacks',
  initialState: {
    byId: {},
    allIds: [],
    loading: false,
    error: null,
    submitting: false
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchFeedbacks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFeedbacks.fulfilled, (state, action) => {
        state.loading = false;
        // Normalize
        action.payload.forEach(f => {
            state.byId[f.id] = f;
            if (!state.allIds.includes(f.id)) {
                state.allIds.push(f.id);
            }
        });
      })
      .addCase(fetchFeedbacks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Submit
      .addCase(submitFeedback.pending, (state) => {
          state.submitting = true;
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
          state.submitting = false;
          const f = action.payload;
          state.byId[f.id] = f;
          state.allIds.unshift(f.id); // Add to top
      })
      .addCase(submitFeedback.rejected, (state, action) => {
          state.submitting = false;
          state.error = action.payload;
      })
      // Delete
      .addCase(deleteFeedback.fulfilled, (state, action) => {
          const id = action.payload;
          delete state.byId[id];
          state.allIds = state.allIds.filter(fid => fid !== id);
      })
      // Update
      .addCase(updateFeedback.fulfilled, (state, action) => {
          const { id, ...updates } = action.payload;
          if (state.byId[id]) {
              state.byId[id] = { ...state.byId[id], ...updates };
          }
      })
      // Add Reply
      .addCase(addReply.fulfilled, (state, action) => {
          const { feedbackId, reply } = action.payload;
          if (state.byId[feedbackId]) {
              if (!state.byId[feedbackId].replies) {
                  state.byId[feedbackId].replies = [];
              }
              state.byId[feedbackId].replies.push(reply);
          }
      });
  },
});

export const deleteReply = createAsyncThunk(
  'feedbacks/deleteReply',
  async ({ feedbackId, replyId }, { rejectWithValue }) => {
    try {
      await feedbackService.deleteReply(feedbackId, replyId);
      return { feedbackId, replyId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const voteReply = createAsyncThunk(
  'feedbacks/voteReply',
  async ({ feedbackId, replyId, type }, { rejectWithValue }) => {
    try {
      await feedbackService.voteReply(feedbackId, replyId, type);
      return { feedbackId, replyId, type };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export default feedbackSlice.reducer;
