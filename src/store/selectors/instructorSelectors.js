import { createSelector } from '@reduxjs/toolkit';

const selectInstructorState = (state) => state.instructors;

export const selectAllInstructors = createSelector(
  [selectInstructorState],
  (instructorState) => {
      // Return array from normalized state
      return instructorState.allIds.map(id => instructorState.byId[id]);
  }
);

export const selectInstructorById = createSelector(
  [selectInstructorState, (state, id) => id],
  (instructorState, id) => instructorState.byId[id]
);

export const selectInstructorsLoading = createSelector(
  [selectInstructorState],
  (instructorState) => instructorState.loading
);

export const selectActiveProfile = createSelector(
  [selectInstructorState],
  (instructorState) => {
      const { data, ratings, replies, loading, error } = instructorState.activeProfile;
      
      // Merge replies into ratings
      const mergedRatings = (ratings || []).map(r => ({
          ...r,
          replies: replies && replies[r.id] ? replies[r.id] : []
      }));

      return {
          data,
          ratings: mergedRatings,
          replies,
          loading,
          error
      };
  }
);

export const selectTopInstructors = createSelector(
  [selectAllInstructors],
  (instructors) => {
      // Return top 8 instructors sorted by rating
      return [...instructors]
          .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
          .slice(0, 8);
  }
);
