import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, UserRole } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminDepartments } from './pages/admin/AdminDepartments';
import { AdminSubjects } from './pages/admin/AdminSubjects';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminProctoring } from './pages/admin/AdminProctoring';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { FacultyExams } from './pages/faculty/FacultyExams';
import { FacultyQuestionBank } from './pages/faculty/FacultyQuestionBank';
import { FacultySubmissions } from './pages/faculty/FacultySubmissions';
import { FacultyAnalytics } from './pages/faculty/FacultyAnalytics';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentResults } from './pages/student/StudentResults';
import { ExamRoom } from './pages/exam/ExamRoom';

const ProtectedRoute: React.FC<{
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center text-white">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's proper portal
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
};

const RoleRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RoleRedirect />} />

            {/* Admin Portal */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="departments" element={<AdminDepartments />} />
              <Route path="subjects" element={<AdminSubjects />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="proctoring" element={<AdminProctoring />} />
              <Route path="audit" element={<AdminAuditLogs />} />
            </Route>

            {/* Faculty Portal */}
            <Route
              path="/faculty"
              element={
                <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/faculty/dashboard" replace />} />
              <Route path="dashboard" element={<FacultyDashboard />} />
              <Route path="exams" element={<FacultyExams />} />
              <Route path="questions" element={<FacultyQuestionBank />} />
              <Route path="submissions" element={<FacultySubmissions />} />
              <Route path="analytics" element={<FacultyAnalytics />} />
            </Route>

            {/* Student Portal */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="results" element={<StudentResults />} />
            </Route>

            {/* Live Distraction-Free Examination Room */}
            <Route
              path="/exam/:attemptId"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'ADMIN']}>
                  <ExamRoom />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<RoleRedirect />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
