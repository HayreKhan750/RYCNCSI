import './App.css';
import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthState } from './store/slices/authSlice';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import ManagementRoute from './routes/ManagementRoute';
import AuthGuard from './routes/AuthGuard'; // New explicit guard
import GlobalLoader from './components/common/GlobalLoader';
import ThemeProvider from './components/common/ThemeProvider';
import ErrorBoundary from './components/common/ErrorBoundary';
import FoulLanguageModal from './components/modals/FoulLanguageModal';
import GrantManagement from './components/GrantManagement'; // Dev tool (Eager Load)
const PublicLeaderboard = lazy(() => import('./pages/PublicLeaderboard'));
const AuthEntry = lazy(() => import('./components/auth-system/AuthEntry'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminPanelEntry = lazy(() => import('./components/admin-panel/AdminEntry'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminImporter = lazy(() => import('./pages/AdminImporter'));
// Fixed import duplication
const InstructorDashboard = lazy(() => import('./components/instructor/InstructorDashboard'));
const InstructorPublicProfile = lazy(() => import('./components/instructor/InstructorPublicProfile')); // Updated
const InstructorReviewsPage = lazy(() => import('./components/instructor/InstructorReviewsPage'));
const CoursesList = lazy(() => import('./components/instructor/CoursesList'));
const AnalyticsPage = lazy(() => import('./components/instructor/AnalyticsPage')); // Added

const InstructorSettings = lazy(() => import('./components/instructor/InstructorSettings')); // Added
const InstructorSetup = lazy(() => import('./components/instructor/InstructorSetup')); // RECOVERY
const StudentProfile = lazy(() => import('./components/StudentProfile'));
const RatingPage = lazy(() => import('./pages/RatingPage'));
const GrantAdmin = lazy(() => import('./components/GrantAdmin'));
const GrantInstructor = lazy(() => import('./components/GrantInstructor'));
// GrantManagement imported earlier

// Management Components
const ManagementDashboard = lazy(() => import('./components/Management/ManagementDashboard'));
const DepartmentList = lazy(() => import('./components/Management/Department/DepartmentList'));
const DepartmentDetail = lazy(() => import('./components/Management/Department/DepartmentDetail'));
const FacultyRosterPage = lazy(() => import('./components/Management/Department/FacultyRosterPage')); // New Page
const InstructorExecutiveProfile = lazy(() => import('./components/Management/Instructor/InstructorExecutiveProfile'));
const FeedbackConsole = lazy(() => import('./components/Management/Moderation/FeedbackConsole'));


// MFA Components (Lazy load if not critical for initial render, but kept standard for now if small)
const MfaPrompt = lazy(() => import('./components/auth/MfaPrompt'));
const MfaEnroll = lazy(() => import('./components/auth/MfaEnroll'));
const EmailOtpPrompt = lazy(() => import('./components/auth/EmailOtpPrompt'));
const AdminSeeder = lazy(() => import('./components/dev/AdminSeeder'));

export default function App() {
  const dispatch = useDispatch();
  const { authStatus } = useSelector(state => state.auth);

  useEffect(() => {
    // Only check if idle to avoid loops, or let thunk handle dedupe
    dispatch(checkAuthState());
  }, [dispatch]);

  // Global "Halt" until Hydration is done (or explicitly unauthenticated)
  // This prevents the "flash of login" or race condition where ProtectedRoute runs before checkAuthState
  if (authStatus === 'idle' || authStatus === 'checking' || authStatus === 'authenticated') {
       return <GlobalLoader />;
  }

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
              <Route path="/leaderboard" element={<PublicLeaderboard />} />
              
              {/* Protected Routes - Wrapped in AuthGuard logic via ProtectedRoute usually, but we check hydration globally above now.
                  We still keep ProtectedRoute for the Redux 'isAuthenticated' boolean check which logically follows hydration.
               */}
              
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

              <Route path="/instructor/dashboard" element={
                <ProtectedRoute>
                  <InstructorDashboard />
                </ProtectedRoute>
              } />

              <Route path="/instructor/reviews" element={
                <ProtectedRoute>
                  <InstructorReviewsPage />
                </ProtectedRoute>
              } />

              <Route path="/instructor/courses" element={
                <ProtectedRoute>
                  <CoursesList />
                </ProtectedRoute>
              } />

              <Route path="/instructor/analytics" element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              } />

              <Route path="/instructor/settings" element={
                <ProtectedRoute>
                  <InstructorSettings />
                </ProtectedRoute>
              } />

              <Route path="/instructor/setup" element={
                  <ProtectedRoute>
                      <InstructorSetup />
                  </ProtectedRoute>
              } />

              <Route path="/instructor/:id" element={
                <ProtectedRoute>
                  <InstructorPublicProfile />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<Navigate to="/login" replace />} />
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminPanelEntry />
                </AdminRoute>
              } />
              <Route path="/admin/import" element={<AdminImporter />} />

              {/* Management Routes */}
              <Route path="/management/dashboard" element={
                <ManagementRoute>
                  <ManagementDashboard />
                </ManagementRoute>
              } />
              <Route path="/management/departments" element={
                <ManagementRoute>
                  <DepartmentList />
                </ManagementRoute>
              } />
              <Route path="/management/department/:deptName" element={
                <ManagementRoute>
                  <DepartmentDetail />
                </ManagementRoute>
              } />
              <Route path="/management/department/:deptName/roster" element={
                <ManagementRoute>
                  <FacultyRosterPage />
                </ManagementRoute>
              } />
              <Route path="/management/instructor/:id" element={
                <ManagementRoute>
                  <InstructorExecutiveProfile />
                </ManagementRoute>
              } />
              <Route path="/management/moderation" element={
                <ManagementRoute>
                  <FeedbackConsole />
                </ManagementRoute>
              } />


              {/* Utility Routes */}
              <Route path="/grant-admin" element={
                <ProtectedRoute>
                  <GrantAdmin />
                </ProtectedRoute>
              } />
              <Route path="/grant-instructor" element={
                <ProtectedRoute>
                  <GrantInstructor />
                </ProtectedRoute>
              } />
              <Route path="/grant-management" element={
                <ProtectedRoute>
                  <GrantManagement />
                </ProtectedRoute>
              } />
              
              {/* MFA Routes - can be protected or public depending on flow */}
              <Route path="/mfa-enroll" element={<MfaEnroll />} />
              <Route path="/mfa-verify" element={<MfaPrompt />} />
              <Route path="/email-otp" element={<EmailOtpPrompt />} />
              
              {/* Temp Seeder */}
              <Route path="/seed-admin" element={<AdminSeeder />} />

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
