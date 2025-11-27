import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  history: [], // Stack of visited routes: [{ path, timestamp }]
  scrollPositions: {}, // Map: { '/path': 120 }
  context: {}, // Map: { '/path': { filter: '...', search: '...' } }
  currentPath: '/',
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    pushRoute: (state, action) => {
      const { path } = action.payload;
      // Avoid pushing duplicates if clicking same link
      if (state.currentPath !== path) {
          state.history.push({ path: state.currentPath, timestamp: Date.now() });
          state.currentPath = path;
      }
    },
    popRoute: (state) => {
      if (state.history.length > 0) {
        const previous = state.history.pop();
        state.currentPath = previous.path;
      }
    },
    saveScrollPosition: (state, action) => {
      const { path, position } = action.payload;
      state.scrollPositions[path] = position;
    },
    saveContext: (state, action) => {
      const { path, context } = action.payload;
      state.context[path] = { ...state.context[path], ...context };
    },
    resetNavigation: (state) => {
        state.history = [];
        state.scrollPositions = {};
        state.context = {};
        state.currentPath = '/';
    }
  },
});

export const { pushRoute, popRoute, saveScrollPosition, saveContext, resetNavigation } = navigationSlice.actions;

// Selectors
export const selectNavigationHistory = (state) => state.navigation.history;
export const selectScrollPosition = (state, path) => state.navigation.scrollPositions[path] || 0;
export const selectRouteContext = (state, path) => state.navigation.context[path] || {};
export const selectPreviousRoute = (state) => state.navigation.history[state.navigation.history.length - 1]?.path || '/';

export default navigationSlice.reducer;
