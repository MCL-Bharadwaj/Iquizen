import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Clock, CheckCircle, XCircle, PlayCircle, Eye, RefreshCw } from 'lucide-react';
import { attemptApi, helpers } from '../../services/api';

const PlayerAttempts = ({ isDark }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = helpers.getUserId('Player');

  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [filter, setFilter] = useState('all'); // all, completed, in_progress
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Check for filter in URL query params
    const filterParam = searchParams.get('filter');
    if (filterParam && ['all', 'completed', 'in_progress'].includes(filterParam)) {
      setFilter(filterParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchAttempts();
  }, [refreshKey]);

  // Refresh data when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Attempts page became visible, refreshing data...');
        fetchAttempts();
      }
    };

    const handleFocus = () => {
      console.log('Attempts page received focus, refreshing data...');
      fetchAttempts();
    };

    // Also listen for navigation events
    const handleNavigation = () => {
      console.log('Navigation detected, refreshing attempts...');
      fetchAttempts();
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

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const data = await attemptApi.getUserAttempts(userId, 50, 0);
      console.log('Attempts data:', data);
      setAttempts(data.data || data.attempts || []);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const filteredAttempts = attempts.filter(attempt => {
    if (filter === 'completed') return attempt.status === 'completed';
    if (filter === 'in_progress') return attempt.status === 'in_progress';
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const minutes = Math.round((end - start) / 60000);
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className={`w-12 h-12 animate-spin mx-auto mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading attempts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            My Attempts
          </h1>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          View all your quiz attempts and scores
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'completed', 'in_progress'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-xl font-medium transition-all ${
              filter === f
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                : isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : f === 'completed' ? 'Completed' : 'In Progress'}
          </button>
        ))}
      </div>

      {/* Attempts List */}
      {filteredAttempts.length === 0 ? (
        <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-12 text-center shadow-lg`}>
          <PlayCircle className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            No Attempts Yet
          </h3>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Start taking quizzes to see your attempts here
          </p>
          <button
            onClick={() => navigate('/Player/quizzes')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Browse Quizzes
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAttempts.map((attempt) => (
            <div
              key={attempt.attemptId}
              className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 shadow-lg hover:shadow-xl transition-all`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {attempt.quizTitle || 'Quiz'}
                  </h3>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className={`px-3 py-1 rounded-lg font-medium ${getStatusColor(attempt.status)}`}>
                      {attempt.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                    {attempt.status === 'completed' && attempt.scorePercentage !== null && (
                      <span className={`font-bold ${getScoreColor(attempt.scorePercentage)}`}>
                        {Math.round(attempt.scorePercentage)}%
                      </span>
                    )}
                  </div>
                </div>

                {attempt.status === 'completed' ? (
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getScoreColor(attempt.scorePercentage || 0)}`}>
                      {attempt.totalScore || 0}/{attempt.maxPossibleScore || 0}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      points
                    </div>
                  </div>
                ) : (
                  <PlayCircle className={`w-12 h-12 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                )}
              </div>

              <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Started</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatDate(attempt.startedAt)}
                  </p>
                </div>
                {attempt.completedAt && (
                  <>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatDate(attempt.completedAt)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Duration</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {calculateDuration(attempt.startedAt, attempt.completedAt)}
                      </p>
                    </div>
                  </>
                )}
                {attempt.status === 'completed' && (
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Grade</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {attempt.scorePercentage >= 80 ? 'A' : attempt.scorePercentage >= 60 ? 'B' : attempt.scorePercentage >= 40 ? 'C' : 'D'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                {attempt.status === 'in_progress' ? (
                  <button
                    onClick={() => navigate(`/Player/quiz/${attempt.quizId}/attempt/${attempt.attemptId}`)}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Continue Quiz
                  </button>
                ) : (
                  <>
                    {/* Only show Retake Quiz button if max attempts not reached */}
                    {(attempt.maxAttempts === null || attempt.maxAttempts === undefined || 
                      attempt.attemptsUsed === null || attempt.attemptsUsed === undefined ||
                      attempt.attemptsUsed < attempt.maxAttempts) && (
                      <button
                        onClick={() => navigate(`/Player/quiz/${attempt.quizId}`)}
                        className={`px-6 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                          isDark
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}
                      >
                        <PlayCircle className="w-4 h-4" />
                        Retake Quiz
                      </button>
                    )}
                    {/* Show max attempts message if limit reached */}
                    {attempt.maxAttempts !== null && attempt.maxAttempts !== undefined &&
                      attempt.attemptsUsed !== null && attempt.attemptsUsed !== undefined &&
                      attempt.attemptsUsed >= attempt.maxAttempts && (
                      <div className={`px-6 py-2 rounded-xl font-medium flex items-center gap-2 ${
                        isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <XCircle className="w-4 h-4" />
                        Max attempts reached ({attempt.attemptsUsed}/{attempt.maxAttempts})
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/Player/attempt/${attempt.attemptId}`)}
                      className={`px-6 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                        isDark
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerAttempts;
