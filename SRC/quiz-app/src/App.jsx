import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ResponsiveLayout from './components/ResponsiveLayout';

// Auth Pages
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import VerifyEmailPage from './pages/Auth/VerifyEmailPage';

// Player Pages
import PlayerDashboard from './pages/Player/PlayerDashboard';
import PlayerQuizzes from './pages/Player/PlayerQuizzes';
import TakeQuiz from './pages/Player/TakeQuiz';
import PlayerAttempts from './pages/Player/PlayerAttempts';
import AttemptDetails from './pages/Player/AttemptDetails';

// Content Creator Pages
import CreatorDashboard from './pages/ContentCreator/CreatorDashboard';
import CreatorQuizzes from './pages/ContentCreator/CreatorQuizzes';
import CreatorCreateQuiz from './pages/ContentCreator/CreatorCreateQuiz';
import CreatorManageQuestions from './pages/ContentCreator/CreatorManageQuestions';
import CreatorAssignments from './pages/ContentCreator/CreatorAssignments';
import AssignmentResponsesView from './pages/ContentCreator/AssignmentResponsesView';
import EditAssignment from './pages/ContentCreator/EditAssignment';

// Tutor Pages
import TutorDashboard from './pages/Tutor/TutorDashboard';
import TutorAssignments from './pages/Tutor/TutorAssignments';

// Questions Page
import Questions from './pages/Questions';

// Landing Page
import RoleSelector from './pages/RoleSelector';

import './index.css';

function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDark));
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Root - Redirect to login if not authenticated */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage isDark={isDark} toggleTheme={toggleTheme} />} />
          <Route path="/register" element={<RegisterPage isDark={isDark} toggleTheme={toggleTheme} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage isDark={isDark} toggleTheme={toggleTheme} />} />
          <Route path="/reset-password" element={<ResetPasswordPage isDark={isDark} toggleTheme={toggleTheme} />} />
          <Route path="/verify-email" element={<VerifyEmailPage isDark={isDark} toggleTheme={toggleTheme} />} />

          {/* Role Selection Page (Protected) */}
          <Route path="/role-selector" element={
            <ProtectedRoute>
              <RoleSelector isDark={isDark} toggleTheme={toggleTheme} />
            </ProtectedRoute>
          } />

          {/* Player ROUTES (Protected) */}
          <Route path="/Player/*" element={
            <ProtectedRoute requiredRole={['Player', 'Administrator']}>
              <div className={isDark ? 'bg-gray-950' : 'bg-gray-50'}>
                <ResponsiveLayout isDark={isDark} toggleTheme={toggleTheme} role="Player">
                  <Routes>
                    <Route path="/" element={<Navigate to="/Player/dashboard" replace />} />
                    <Route path="/dashboard" element={<PlayerDashboard isDark={isDark} />} />
                    <Route path="/quizzes" element={<PlayerQuizzes isDark={isDark} />} />
                    <Route path="/quiz/:quizId" element={<TakeQuiz isDark={isDark} />} />
                    <Route path="/quiz/:quizId/attempt/:attemptId" element={<TakeQuiz isDark={isDark} />} />
                    <Route path="/attempts" element={<PlayerAttempts isDark={isDark} />} />
                    <Route path="/attempt/:attemptId" element={<AttemptDetails isDark={isDark} />} />
                  </Routes>
                </ResponsiveLayout>
              </div>
            </ProtectedRoute>
          } />

          {/* Content Creator ROUTES (Protected) */}
          <Route path="/creator/*" element={
            <ProtectedRoute requiredRole={['ContentCreator', 'Administrator']}>
              <div className={isDark ? 'bg-gray-950' : 'bg-gray-50'}>
                <ResponsiveLayout isDark={isDark} toggleTheme={toggleTheme} role="creator">
                  <Routes>
                    <Route path="/" element={<Navigate to="/creator/dashboard" replace />} />
                    <Route path="/dashboard" element={<CreatorDashboard isDark={isDark} />} />
                    <Route path="/quizzes" element={<CreatorQuizzes isDark={isDark} />} />
                    <Route path="/assignments" element={<CreatorAssignments isDark={isDark} />} />
                    <Route path="/assignments/:assignmentId" element={<AssignmentResponsesView isDark={isDark} />} />
                    <Route path="/assignments/:assignmentId/edit" element={<EditAssignment isDark={isDark} />} />
                    <Route path="/quiz/create" element={<CreatorCreateQuiz isDark={isDark} />} />
                    <Route path="/quiz/:quizId/questions" element={<CreatorManageQuestions isDark={isDark} />} />
                    <Route path="/questions" element={<Questions isDark={isDark} />} />
                  </Routes>
                </ResponsiveLayout>
              </div>
            </ProtectedRoute>
          } />

          {/* Tutor ROUTES (Protected) */}
          <Route path="/tutor/*" element={
            <ProtectedRoute requiredRole={['Tutors', 'Administrator']}>
              <div className={isDark ? 'bg-gray-950' : 'bg-gray-50'}>
                <ResponsiveLayout isDark={isDark} toggleTheme={toggleTheme} role="tutor">
                  <Routes>
                    <Route path="/" element={<Navigate to="/tutor/dashboard" replace />} />
                    <Route path="/dashboard" element={<TutorDashboard isDark={isDark} />} />
                    <Route path="/assignments" element={<TutorAssignments isDark={isDark} />} />
                    <Route path="/assignments/:assignmentId" element={<AssignmentResponsesView isDark={isDark} />} />
                    <Route path="/assignments/:assignmentId/edit" element={<EditAssignment isDark={isDark} />} />
                  </Routes>
                </ResponsiveLayout>
              </div>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
