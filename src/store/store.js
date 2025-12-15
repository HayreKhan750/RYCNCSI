import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import instructorReducer from './slices/instructorSlice';
import uiReducer from './slices/uiSlice';
import themeReducer from './slices/themeSlice';
import userReducer from './slices/userSlice';
import feedbackReducer from './slices/feedbackSlice';
import adminReducer from './slices/adminSlice';
import notificationReducer from './slices/notificationSlice';
import navigationReducer from './slices/navigationSlice';
import managementReducer from './slices/managementSlice';

import { combineReducers } from '@reduxjs/toolkit';

const appReducer = combineReducers({
    auth: authReducer,
    instructors: instructorReducer,
    ui: uiReducer,
    theme: themeReducer,
    user: userReducer,
    feedbacks: feedbackReducer,
    admin: adminReducer,
    notifications: notificationReducer,
    navigation: navigationReducer,
    management: managementReducer,
});

const rootReducer = (state, action) => {
  if (action.type === 'auth/logout/fulfilled') {
    // Clear state on logout (preserve theme if desired, distinct logic if needed)
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/setUser', 'instructors/fetchProfile/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});
