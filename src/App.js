import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
// import { ThemeProvider } from './contexts/ThemeContext';
import GlobalLoader from './components/common/GlobalLoader';

// New Auth System Entry
import AuthEntry from './components/auth-system/AuthEntry';

// Admin Panel Entry
import AdminPanelEntry from './components/admin-panel/AdminEntry';

import MfaPrompt from './components/auth/MfaPrompt';
import MfaEnroll from './components/auth/MfaEnroll';
import EmailOtpPrompt from './components/auth/EmailOtpPrompt';
import Dashboard from './components/Dashboard';
import AdminImporter from './pages/AdminImporter';
import Settings from './pages/Settings';
import InstructorProfile from './components/instructor-profile/InstructorProfile';
import RatingPage from './pages/RatingPage';
import AdminLogin from './pages/AdminLogin';
import GrantAdmin from './components/GrantAdmin';
import GrantInstructor from './components/GrantInstructor';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuthState } from './store/slices/authSlice';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuthState());
  }, [dispatch]);

  return (
    <>
      <GlobalLoader />
      <div className="app-container">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<AuthEntry />} />
          <Route path="/signup" element={<AuthEntry />} />
          <Route path="/verify" element={<AuthEntry />} />
          <Route path="/forgot-password" element={<AuthEntry />} />

          {/* MFA related routes (keep existing) */}
          <Route path="/mfa" element={<MfaPrompt />} />
          <Route path="/mfa-enroll" element={<MfaEnroll />} />
          <Route path="/email-otp" element={<EmailOtpPrompt />} />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanelEntry />
              </AdminRoute>
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/import"
            element={
              <AdminRoute>
                <AdminImporter />
              </AdminRoute>
            }
          />
          <Route
            path="/instructor/:id"
            element={
              <ProtectedRoute>
                <InstructorProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/rate/:instructorId" element={<RatingPage />} />
          <Route path="/grant-admin" element={<GrantAdmin />} />
          <Route path="/grant-instructor" element={<GrantInstructor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
