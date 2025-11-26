import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import instructorReducer from './slices/instructorSlice';
import uiReducer from './slices/uiSlice';
import themeReducer from './slices/themeSlice';
import userReducer from './slices/userSlice';
import feedbackReducer from './slices/feedbackSlice';
import adminReducer from './slices/adminSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    instructors: instructorReducer,
    ui: uiReducer,
    theme: themeReducer,
    user: userReducer,
    feedbacks: feedbackReducer,
    admin: adminReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable for Firestore timestamps/objects if needed
    }),
});
