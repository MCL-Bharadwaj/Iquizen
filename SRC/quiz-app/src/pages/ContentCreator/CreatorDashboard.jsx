import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { quizApi } from '../../services/api';
import { 
  Plus, 
  BookOpen, 
  Clock, 
  BarChart,
  TrendingUp,
  FileText,
  Users,
  Award
} from 'lucide-react';

const CreatorDashboard = ({ isDark }) => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const response = await quizApi.getQuizzes();
      setQuizzes(response.data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalQuizzes = quizzes.length;
  const easyQuizzes = quizzes.filter(q => q.difficulty?.toLowerCase() === 'easy').length;
  const mediumQuizzes = quizzes.filter(q => q.difficulty?.toLowerCase() === 'medium').length;
  const hardQuizzes = quizzes.filter(q => q.difficulty?.toLowerCase() === 'hard').length;
  const totalQuestions = quizzes.reduce((sum, q) => sum + (q.questionCount || 0), 0);
  const avgEstimatedTime = quizzes.length > 0 
    ? Math.round(quizzes.reduce((sum, q) => sum + (q.estimatedMinutes || 0), 0) / quizzes.length)
    : 0;

  // Recent quizzes (last 5)
  const recentQuizzes = [...quizzes]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return isDark ? 'text-green-400 bg-green-900/30' : 'text-green-700 bg-green-100';
      case 'medium':
        return isDark ? 'text-yellow-400 bg-yellow-900/30' : 'text-yellow-700 bg-yellow-100';
      case 'hard':
        return isDark ? 'text-red-400 bg-red-900/30' : 'text-red-700 bg-red-100';
      default:
        return isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-700 bg-gray-200';
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
    <div
      onClick={onClick}
      className={`
        rounded-lg p-6 transition-all duration-300 hover:shadow-xl cursor-pointer
        ${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-2xl shadow'}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div>
        <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {label}
        </p>
        <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </p>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Creator Dashboard
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Overview of your quiz content
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={BookOpen}
              label="Total Quizzes"
              value={totalQuizzes}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              onClick={() => navigate('/creator/quizzes')}
            />
            <StatCard
              icon={FileText}
              label="Total Questions"
              value={totalQuestions}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              onClick={() => navigate('/creator/quizzes')}
            />
            <StatCard
              icon={Clock}
              label="Avg. Duration"
              value={`${avgEstimatedTime} min`}
              color="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              icon={Award}
              label="Quiz Categories"
              value={new Set(quizzes.map(q => q.subject).filter(Boolean)).size}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
              onClick={() => navigate('/creator/quizzes')}
            />
          </div>

          {/* Difficulty Distribution */}
          <div className={`
            rounded-lg p-6 mb-8
            ${isDark ? 'bg-gray-800' : 'bg-white shadow'}
          `}>
            <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Difficulty Distribution
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                    Easy
                  </span>
                  <BarChart className="w-5 h-5 text-green-500" />
                </div>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {easyQuizzes}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {totalQuizzes > 0 ? Math.round((easyQuizzes / totalQuizzes) * 100) : 0}% of total
                </p>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                    Medium
                  </span>
                  <BarChart className="w-5 h-5 text-yellow-500" />
                </div>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {mediumQuizzes}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {totalQuizzes > 0 ? Math.round((mediumQuizzes / totalQuizzes) * 100) : 0}% of total
                </p>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                    Hard
                  </span>
                  <BarChart className="w-5 h-5 text-red-500" />
                </div>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {hardQuizzes}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {totalQuizzes > 0 ? Math.round((hardQuizzes / totalQuizzes) * 100) : 0}% of total
                </p>
              </div>
            </div>
          </div>

          {/* Recent Quizzes */}
          <div className={`
            rounded-lg p-6
            ${isDark ? 'bg-gray-800' : 'bg-white shadow'}
          `}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Recent Quizzes
              </h2>
              <button
                onClick={() => navigate('/creator/quizzes')}
                className={`text-sm font-medium ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                View All →
              </button>
            </div>
            {recentQuizzes.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  No quizzes yet. Create your first quiz to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentQuizzes.map((quiz) => (
                  <div
                    key={quiz.quizId}
                    onClick={() => navigate(`/creator/quiz/${quiz.quizId}/questions`)}
                    className={`
                      p-4 rounded-lg border cursor-pointer transition-all
                      ${isDark 
                        ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-750' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {quiz.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                          {quiz.subject && (
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                              📚 {quiz.subject}
                            </span>
                          )}
                          {quiz.estimatedMinutes && (
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                              ⏱️ {quiz.estimatedMinutes} min
                            </span>
                          )}
                        </div>
                      </div>
                      {quiz.difficulty && (
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                          {quiz.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CreatorDashboard;
