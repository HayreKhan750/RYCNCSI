import { createSelector } from '@reduxjs/toolkit';

const selectUserState = (state) => state.user;
const selectAuthState = (state) => state.auth;

export const selectCurrentUser = createSelector(
  [selectAuthState],
  (authState) => authState.user
);

export const selectUserLoading = createSelector(
  [selectUserState],
  (userState) => userState.loading
);

export const selectUserError = createSelector(
  [selectUserState],
  (userState) => userState.error
);

export const selectUserProfile = createSelector(
  [selectUserState],
  (userState) => userState.profile
);

export const selectUserRole = createSelector(
  [selectCurrentUser],
  (user) => user?.role || 'student'
);

export const selectIsAdmin = createSelector(
  [selectUserRole],
  (role) => role === 'admin'
);

export const selectIsInstructor = createSelector(
  [selectUserRole],
  (role) => role === 'instructor'
);
