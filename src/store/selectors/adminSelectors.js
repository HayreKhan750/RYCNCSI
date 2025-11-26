import { createSelector } from '@reduxjs/toolkit';

const selectAdminState = (state) => state.admin;

export const selectAllReports = createSelector(
  [selectAdminState],
  (adminState) => adminState.reports
);

export const selectReportsByStatus = (status) => createSelector(
  [selectAllReports],
  (reports) => reports.filter(r => r.status === status)
);

export const selectAdminStats = createSelector(
  [selectAdminState],
  (adminState) => adminState.stats
);

export const selectAdminUsers = createSelector(
  [selectAdminState],
  (adminState) => adminState.users
);

export const selectAdminRatings = createSelector(
  [selectAdminState],
  (adminState) => adminState.ratings
);

export const selectAdminLogs = createSelector(
  [selectAdminState],
  (adminState) => adminState.logs
);

export const selectAdminLoading = createSelector(
  [selectAdminState],
  (adminState) => adminState.loading
);

export const selectAdminError = createSelector(
  [selectAdminState],
  (adminState) => adminState.error
);
