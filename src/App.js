import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import Login from './components/Login';
import MfaPrompt from './components/auth/MfaPrompt';
import MfaEnroll from './components/auth/MfaEnroll';
import EmailOtpPrompt from './components/auth/EmailOtpPrompt';
import Signup from './pages/Signup';
import Dashboard from './components/Dashboard';
import AdminImporter from './pages/AdminImporter';
import VerifyEmail from './components/VerifyEmail';
import ForgotPassword from './components/ForgotPassword';
import Settings from './pages/Settings';

export default function App() {
  return (
    <div>
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
        <Route path="/login" element={<Login />} />
        <Route path="/mfa" element={<MfaPrompt />} />
        <Route path="/mfa-enroll" element={<MfaEnroll />} />
        <Route path="/email-otp" element={<EmailOtpPrompt />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/import"
          element={
            <AdminRoute>
              <AdminImporter />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
