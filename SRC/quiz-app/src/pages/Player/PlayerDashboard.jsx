import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, TrendingUp, Award, Play, Loader2, Lock } from 'lucide-react';
import { quizApi, attemptApi, assignmentApi, helpers } from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PlayerDashboard = ({ isDark }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    completedAttempts: 0,
    inProgressAttempts: 0,
    averageScore: 0,
  });
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [userAttempts, setUserAttempts] = useState([]);
  const userId = helpers.getUserId('Player');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh data when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Dashboard became visible, refreshing data...');
        fetchDashboardData();
      }
    };

    const handleFocus = () => {
      console.log('Dashboard received focus, refreshing data...');
      fetchDashboardData();
    };

    // Also listen for navigation events
    const handleNavigation = () => {
      console.log('Navigation detected, refreshing dashboard...');
      fetchDashboardData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('popstate', handleNavigation);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch assigned quizzes (assignments with quiz details)
      const assignmentsData = await assignmentApi.getMyAssignments();
      console.log('Assignments data:', assignmentsData); // Debug log
      
      // Fetch user attempts first (needed for max attempts check)
      const attemptsData = await attemptApi.getUserAttempts(userId);
      console.log('Attempts data:', attemptsData); // Debug log
      setUserAttempts(attemptsData || []);
      
      // Transform assignments to quiz format for display
      const assignedQuizzes = assignmentsData.map(assignment => ({
        quizId: assignment.quizId,
        title: assignment.quizTitle,
        description: assignment.quizDescription,
        subject: assignment.subject,
        difficulty: assignment.difficulty,
        estimatedMinutes: assignment.estimatedMinutes,
        assignmentId: assignment.assignmentId,
        assignedAt: assignment.assignedAt,
        dueDate: assignment.dueDate,
        status: assignment.status,
        isMandatory: assignment.isMandatory,
        maxAttempts: assignment.maxAttempts,
        attemptsUsed: assignment.attemptsUsed,
      }));
      
      setRecentQuizzes(assignedQuizzes);

      // Process attempts for recent attempts display
      console.log('Total attempts received:', attemptsData.attempts?.length);
      
      const attempts = attemptsData.attempts || [];
      console.log('Attempts array:', attempts);
      console.log('Status breakdown:', {
        total: attempts.length,
        inProgress: attempts.filter(a => a.status === 'in_progress').length,
        completed: attempts.filter(a => a.status === 'completed').length,
        statuses: attempts.map(a => ({ id: a.attemptId, status: a.status }))
      });
      
      setRecentAttempts(attempts.slice(0, 5));

      // Calculate stats based on assignments
      const attemptStats = helpers.calculateAttemptStats(attempts);
      console.log('Calculated stats:', attemptStats);
      
      setStats({
        totalQuizzes: assignedQuizzes.length,
        completedAttempts: attemptStats.completed,
        inProgressAttempts: attemptStats.inProgress,
        averageScore: attemptStats.averageScore,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className={`w-12 h-12 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Player Dashboard
        </h1>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Welcome back! Ready to learn?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={BookOpen}
          label="Available Quizzes"
          value={stats.totalQuizzes}
          gradient="from-blue-500 to-cyan-600"
          isDark={isDark}
          onClick={() => navigate('/Player/quizzes')}
        />
        <StatCard
          icon={Clock}
          label="In Progress"
          value={stats.inProgressAttempts}
          gradient="from-orange-500 to-red-600"
          isDark={isDark}
          onClick={() => navigate('/Player/attempts?filter=in_progress')}
        />
        <StatCard
          icon={Award}
          label="Completed"
          value={stats.completedAttempts}
          gradient="from-green-500 to-emerald-600"
          isDark={isDark}
          onClick={() => navigate('/Player/attempts?filter=completed')}
        />
        <StatCard
          icon={TrendingUp}
          label="Average Score"
          value={`${stats.averageScore}%`}
          gradient="from-purple-500 to-pink-600"
          isDark={isDark}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Quizzes */}
        <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 shadow-lg`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Available Quizzes
            </h2>
            <button
              onClick={() => navigate('/Player/quizzes')}
              className="text-blue-500 hover:text-blue-600 font-medium text-sm"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentQuizzes.slice(0, 5).map((quiz) => {
              const isMaxAttemptsReached = quiz.maxAttempts && quiz.attemptsUsed >= quiz.maxAttempts;
              
              const handleQuizClick = () => {
                if (isMaxAttemptsReached) {
                  toast.error(`Maximum attempts (${quiz.maxAttempts}) reached for this quiz`, {
                    position: 'top-right',
                    autoClose: 3000,
                    theme: isDark ? 'dark' : 'light',
                  });
                  return;
                }
                navigate(`/Player/quiz/${quiz.quizId}`);
              };
              
              return (
              <div
                key={quiz.quizId}
                className={`p-4 rounded-xl ${
                  isMaxAttemptsReached
                    ? isDark ? 'bg-gray-700 opacity-60 cursor-not-allowed' : 'bg-gray-50 opacity-60 cursor-not-allowed'
                    : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors ${
                  isMaxAttemptsReached ? '' : 'cursor-pointer'
                }`}
                onClick={handleQuizClick}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {quiz.title}
                    </h3>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 text-sm">
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {quiz.estimatedMinutes || 0} mins
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          quiz.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                          quiz.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {quiz.difficulty || 'medium'}
                        </span>
                        {quiz.isMandatory && (
                          <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400">
                            Mandatory
                          </span>
                        )}
                      </div>
                      {quiz.dueDate && (
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          Due: {new Date(quiz.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    {quiz.maxAttempts && (
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {quiz.attemptsUsed || 0}/{quiz.maxAttempts}
                      </span>
                    )}
                    {isMaxAttemptsReached ? (
                      <Lock className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Play className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* Recent Attempts */}
        <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 shadow-lg`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              My Recent Attempts
            </h2>
            <button
              onClick={() => navigate('/Player/attempts')}
              className="text-blue-500 hover:text-blue-600 font-medium text-sm"
            >
              View All
            </button>
          </div>
          {recentAttempts.length > 0 ? (
            <div className="space-y-3">
              {recentAttempts.map((attempt) => {
                const handleStatusClick = (e) => {
                  e.stopPropagation();
                  if (attempt.status === 'in_progress') {
                    // Redirect to continue the quiz
                    navigate(`/Player/quiz/${attempt.quizId}?attemptId=${attempt.attemptId}`);
                  } else if (attempt.status === 'completed') {
                    // Redirect to view attempt details
                    navigate(`/Player/attempt/${attempt.attemptId}`);
                  }
                };

                return (
                <div
                  key={attempt.attemptId}
                  className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {attempt.quizTitle || 'Quiz'}
                      </span>
                      <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(attempt.startedAt).toLocaleDateString()} at {new Date(attempt.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button
                      onClick={handleStatusClick}
                      className={`text-xs px-2 py-1 rounded transition-all duration-200 cursor-pointer ${
                        attempt.status === 'completed' 
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:scale-105'
                          : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:scale-105'
                      }`}
                      title={attempt.status === 'in_progress' ? 'Click to continue quiz' : 'Click to view details'}
                    >
                      {attempt.status}
                    </button>
                  </div>
                  {attempt.status === 'completed' && attempt.scorePercentage !== null && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {Math.round(attempt.scorePercentage)}%
                      </div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Score
                      </span>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No attempts yet. Start a quiz!
              </p>
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, gradient, isDark, onClick }) => {
  return (
    <div 
      className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 shadow-lg ${onClick ? 'cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {label}
          </p>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
