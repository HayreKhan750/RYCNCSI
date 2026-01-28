import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { managementService } from '../../services/managementService';

// Thunks
export const fetchDashboardData = createAsyncThunk(
  'management/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      // Parallel Fetch for Speed
      const [stats, departments, topInstructors] = await Promise.all([
          managementService.fetchDashboardStats(),
          managementService.fetchDepartmentAnalytics(),
          managementService.fetchTopInstructors()
      ]);

      return { stats, departments, topInstructors, recentFeedback: [] };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  stats: {
    totalInstructors: 0,
    totalDepartments: 0,
    avgRating: 0,
    engagementThisMonth: 0
  },
  departments: [], // Analytics list
  topInstructors: [],
  recentFeedback: [],
  loading: false,
  error: null,
  lastUpdated: null
};

const managementSlice = createSlice({
  name: 'management',
  initialState,
  reducers: {
    clearManagementData: (state) => {
        state.stats = initialState.stats;
        state.departments = [];
        state.topInstructors = [];
        state.recentFeedback = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.departments = action.payload.departments;
        state.topInstructors = action.payload.topInstructors;
        state.recentFeedback = action.payload.recentFeedback;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearManagementData } = managementSlice.actions;
export default managementSlice.reducer;
