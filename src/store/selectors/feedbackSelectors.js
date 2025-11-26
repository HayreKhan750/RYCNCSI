import { createSelector } from '@reduxjs/toolkit';

const selectFeedbackState = (state) => state.feedbacks;

export const selectAllFeedbacks = createSelector(
  [selectFeedbackState],
  (feedbackState) => feedbackState.allIds.map(id => feedbackState.byId[id])
);

export const selectFeedbackById = createSelector(
  [selectFeedbackState, (state, id) => id],
  (feedbackState, id) => feedbackState.byId[id]
);

export const selectFeedbacksByInstructorId = createSelector(
  [selectAllFeedbacks, (state, instructorId) => instructorId],
  (feedbacks, instructorId) => feedbacks.filter(f => f.instructorId === instructorId)
);

export const selectFeedbacksByStudentId = createSelector(
  [selectAllFeedbacks, (state, studentId) => studentId],
  (feedbacks, studentId) => feedbacks.filter(f => f.studentId === studentId)
);

export const selectFeedbackLoading = createSelector(
  [selectFeedbackState],
  (state) => state.loading
);

export const selectFeedbackError = createSelector(
  [selectFeedbackState],
  (state) => state.error
);

export const selectFeedbackSubmitting = createSelector(
  [selectFeedbackState],
  (feedbackState) => feedbackState.submitting
);
