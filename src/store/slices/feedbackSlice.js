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

export const toggleLike = createAsyncThunk(
  'feedbacks/toggleLike',
  async ({ feedbackId, userId, isLike }, { rejectWithValue }) => {
    try {
      await feedbackService.toggleLikeReview(feedbackId, userId, isLike);
      return { feedbackId, isLike };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const flagFeedback = createAsyncThunk(
  'feedbacks/flag',
  async (flagData, { rejectWithValue }) => {
    try {
      const id = await feedbackService.flagFeedback(flagData);
      return id; // or flagData
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTopReviewers = createAsyncThunk(
  'feedbacks/fetchTopReviewers',
  async (_, { rejectWithValue }) => {
    try {
      const data = await feedbackService.fetchTopReviewers();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserReactions = createAsyncThunk(
  'feedbacks/fetchUserReactions',
  async (userId, { rejectWithValue }) => {
    try {
      return await feedbackService.fetchUserReactions(userId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserFlags = createAsyncThunk(
  'feedbacks/fetchUserFlags',
  async (userId, { rejectWithValue }) => {
    try {
      return await feedbackService.fetchUserFlags(userId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  byId: {},
  allIds: [],
  topReviewers: [],
  userReactions: {}, // { [feedbackId]: 'like' | 'dislike' }
  userFlags: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  submitStatus: 'idle'
};

const feedbackSlice = createSlice({
  name: 'feedbacks',
  initialState,
  reducers: {
      resetSubmitStatus: (state) => {
          state.submitStatus = 'idle';
      }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchFeedbacks.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFeedbacks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Normalize
        action.payload.forEach(f => {
            state.byId[f.id] = f;
            if (!state.allIds.includes(f.id)) {
                state.allIds.push(f.id);
            }
        });
      })
      .addCase(fetchFeedbacks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Submit
      .addCase(submitFeedback.pending, (state) => {
          state.submitStatus = 'loading';
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
          state.submitStatus = 'succeeded';
          const f = action.payload;
          state.byId[f.id] = f;
          state.allIds.unshift(f.id); // Add to top
      })
      .addCase(submitFeedback.rejected, (state, action) => {
          state.submitStatus = 'failed';
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
      })
      // Toggle Like
      .addCase(toggleLike.fulfilled, (state, action) => {
          const { feedbackId, userId, isLike, likesCount, dislikesCount } = action.payload;
          const feedback = state.byId[feedbackId];
          
          if (feedback) {
              feedback.likesCount = likesCount;
              feedback.dislikesCount = dislikesCount; // Set directly
              
              // Still need to update userReactions for local UI state
          }

          // Update local reaction state
          if (isLike === null) {
              delete state.userReactions[feedbackId];
          } else {
              state.userReactions[feedbackId] = isLike ? 'like' : 'dislike';
          }
      })
      // Top Reviewers
      .addCase(fetchTopReviewers.fulfilled, (state, action) => {
          state.topReviewers = action.payload;
      })
      // User Reactions
      .addCase(fetchUserReactions.fulfilled, (state, action) => {
          state.userReactions = action.payload;
      })

      // User Flags
      .addCase(fetchUserFlags.fulfilled, (state, action) => {
          state.userFlags = action.payload;
      });
  },
});

export const { resetSubmitStatus } = feedbackSlice.actions;
export default feedbackSlice.reducer;
