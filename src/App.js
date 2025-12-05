import './App.css';
import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuthState } from './store/slices/authSlice';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import GlobalLoader from './components/common/GlobalLoader';
import ThemeProvider from './components/common/ThemeProvider';
import ErrorBoundary from './components/common/ErrorBoundary';
import FoulLanguageModal from './components/modals/FoulLanguageModal';

// Lazy Load Components
const AuthEntry = lazy(() => import('./components/auth-system/AuthEntry'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminPanelEntry = lazy(() => import('./components/admin-panel/AdminEntry'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminImporter = lazy(() => import('./pages/AdminImporter'));
const InstructorProfile = lazy(() => import('./components/instructor-profile/InstructorProfile'));
const StudentProfile = lazy(() => import('./components/StudentProfile'));
const RatingPage = lazy(() => import('./pages/RatingPage'));
const GrantAdmin = lazy(() => import('./components/GrantAdmin'));
const GrantInstructor = lazy(() => import('./components/GrantInstructor'));

// MFA Components (Lazy load if not critical for initial render, but kept standard for now if small)
const MfaPrompt = lazy(() => import('./components/auth/MfaPrompt'));
const MfaEnroll = lazy(() => import('./components/auth/MfaEnroll'));
const EmailOtpPrompt = lazy(() => import('./components/auth/EmailOtpPrompt'));

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuthState());
  }, [dispatch]);

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <GlobalLoader />
        <div className="app-container">
          <Suspense fallback={<div className="suspense-loader">Loading...</div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<AuthEntry />} />
              <Route path="/login" element={<AuthEntry />} />
              <Route path="/signup" element={<AuthEntry />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <StudentProfile />
                </ProtectedRoute>
              } />

              <Route path="/student/:id" element={
                <ProtectedRoute>
                  <StudentProfile />
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />

              <Route path="/rate/:instructorId" element={
                <ProtectedRoute>
                  <RatingPage />
                </ProtectedRoute>
              } />

              <Route path="/instructor/:id" element={
                <ProtectedRoute>
                  <InstructorProfile />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminPanelEntry />
                </AdminRoute>
              } />
              <Route path="/admin/import" element={
                <AdminRoute>
                  <AdminImporter />
                </AdminRoute>
              } />

              {/* Utility Routes */}
              <Route path="/grant-admin" element={<GrantAdmin />} />
              <Route path="/grant-instructor" element={<GrantInstructor />} />
              
              {/* MFA Routes - can be protected or public depending on flow */}
              <Route path="/mfa-enroll" element={<MfaEnroll />} />
              <Route path="/mfa-verify" element={<MfaPrompt />} />
              <Route path="/email-otp" element={<EmailOtpPrompt />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </ErrorBoundary>
      <FoulLanguageModal />
    </ThemeProvider>
  );
}
