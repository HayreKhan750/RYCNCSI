import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminService } from '../../services/adminService';

export const fetchReports = createAsyncThunk(
  'admin/fetchReports',
  async (status, { rejectWithValue }) => {
    try {
      const data = await adminService.fetchReports(status);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const resolveReport = createAsyncThunk(
  'admin/resolveReport',
  async ({ reportId, resolution }, { rejectWithValue }) => {
    try {
      const data = await adminService.resolveReport(reportId, resolution);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDashboardData = createAsyncThunk(
  'admin/fetchDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const data = await adminService.fetchDashboardData();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (uid, { rejectWithValue }) => {
    try {
      await adminService.deleteUser(uid);
      await adminService.logAction('DELETE_USER', uid, 'Deleted user account');
      return uid;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const approveInstructor = createAsyncThunk(
  'admin/approveInstructor',
  async (uid, { rejectWithValue }) => {
    try {
      await adminService.approveInstructor(uid);
      await adminService.logAction('APPROVE_INSTRUCTOR', uid, 'Approved instructor application');
      return uid;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteRating = createAsyncThunk(
  'admin/deleteRating',
  async (id, { rejectWithValue }) => {
    try {
      await adminService.deleteRating(id);
      await adminService.logAction('DELETE_RATING', id, 'Removed abusive content');
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateRatingStatus = createAsyncThunk(
  'admin/updateRatingStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      await adminService.updateRatingStatus(id, status);
      await adminService.logAction('UPDATE_STATUS', id, `Marked as ${status}`);
      return { id, status };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    reports: [],
    users: [],
    ratings: [], // Feedbacks
    logs: [],
    stats: {
      totalStudents: 0,
      totalInstructors: 0,
      totalRatings: 0,
      flaggedCount: 0
    },
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Reports
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Dashboard Data
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.users = action.payload.users;
        state.ratings = action.payload.ratings;
        state.logs = action.payload.logs;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete User
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u.id !== action.payload);
      })
      // Approve Instructor
      .addCase(approveInstructor.fulfilled, (state, action) => {
        const index = state.users.findIndex(u => u.id === action.payload);
        if (index !== -1) {
            state.users[index].status = 'approved';
        }
      })
      // Delete Rating
      .addCase(deleteRating.fulfilled, (state, action) => {
        state.ratings = state.ratings.filter(r => r.id !== action.payload);
      })
      // Update Rating Status
      .addCase(updateRatingStatus.fulfilled, (state, action) => {
        const index = state.ratings.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
            state.ratings[index].status = action.payload.status;
        }
      })
      // Resolve Report
      .addCase(resolveReport.fulfilled, (state, action) => {
          const index = state.reports.findIndex(r => r.id === action.payload.id);
          if (index !== -1) {
              state.reports[index].status = 'resolved';
              state.reports[index].resolution = action.payload.resolution;
          }
      });
  },
});

export default adminSlice.reducer;
