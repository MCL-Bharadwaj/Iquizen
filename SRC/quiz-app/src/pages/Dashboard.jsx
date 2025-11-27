import { useState, useEffect } from 'react';
import { TrendingUp, Award, Target, Clock, Star, CheckCircle2, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { quizApi, statsApi } from '../services/api';

const Dashboard = ({ isDark }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    completed: 0,
    completionRate: 0,
    averageScore: 0,
  });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quizApi.getQuizzes({ limit: 10 });
      setQuizzes(data.quizzes || []);
      
      // Calculate stats from fetched data
      if (data.quizzes && data.quizzes.length > 0) {
        const calculatedStats = statsApi.calculateStats(data.quizzes);
        setStats(calculatedStats);
      }
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
      setError('Failed to load quizzes. Please make sure the API is running.');
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    {
      title: 'Total Quizzes',
      value: stats.totalQuizzes.toString(),
      change: `${stats.completed} published`,
      icon: BookOpen,
      gradient: 'from-indigo-500 to-purple-600',
      bgLight: 'bg-indigo-50',
      bgDark: 'bg-indigo-950',
    },
    {
      title: 'Published',
      value: stats.completed.toString(),
      change: `${stats.completionRate}% of total`,
      icon: CheckCircle2,
      gradient: 'from-green-500 to-emerald-600',
      bgLight: 'bg-green-50',
      bgDark: 'bg-green-950',
    },
    {
      title: 'Avg Duration',
      value: `${stats.averageScore}min`,
      change: 'Estimated time',
      icon: Award,
      gradient: 'from-purple-500 to-pink-600',
      bgLight: 'bg-purple-50',
      bgDark: 'bg-purple-950',
    },
  ];

  // Transform quizzes to activity format
  const recentActivity = quizzes.slice(0, 5).map((quiz) => ({
    id: quiz.quiz_id,
    title: quiz.title,
    description: quiz.description,
    difficulty: quiz.difficulty || 'medium',
    subject: quiz.subject || 'General',
    tags: quiz.tags || [],
    estimatedMinutes: quiz.estimated_minutes || 0,
    isPublished: quiz.is_published,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className={`w-12 h-12 animate-spin mx-auto mb-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading quizzes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className={`rounded-2xl p-8 ${isDark ? 'bg-red-950 border-red-900' : 'bg-red-50 border-red-200'} border-2`}>
          <div className="flex items-center gap-4">
            <AlertCircle className={`w-12 h-12 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            <div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                Error Loading Data
              </h3>
              <p className={`${isDark ? 'text-red-300' : 'text-red-700'} mb-4`}>{error}</p>
              <button
                onClick={fetchQuizzes}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all duration-300"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Welcome back! 👋
        </h1>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Here's your quiz library overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statsConfig.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-2xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border ${
                isDark ? 'border-gray-700' : 'border-gray-100'
              }`}
            >
              {/* Gradient Background */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
              
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${isDark ? stat.bgDark : stat.bgLight}`}>
                    <Icon className={`w-6 h-6 bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`} style={{ strokeWidth: 2.5 }} />
                  </div>
                  <div className={`text-sm font-medium px-3 py-1 rounded-full ${isDark ? 'bg-gray-700 text-green-400' : 'bg-green-50 text-green-600'} flex items-center gap-1`}>
                    <TrendingUp className="w-3 h-3" />
                    <span>Active</span>
                  </div>
                </div>
                
                <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.title}
                </h3>
                <p className={`text-4xl font-bold mb-2 bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
                <p className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  <span>{stat.change}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div
        className={`rounded-2xl ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-100'} overflow-hidden`}
      >
        <div className="p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Recent Activity
              </h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Your latest quiz attempts
              </p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all duration-300 hover:scale-105">
              View All
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No quizzes available yet
              </p>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Create your first quiz to get started!
              </p>
            </div>
          ) : (
            recentActivity.map((activity, i) => (
              <div
                key={activity.id}
                className={`group p-5 rounded-xl ${
                  isDark ? 'bg-gray-750 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                } border ${isDark ? 'border-gray-700' : 'border-gray-200'} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${i === 0 ? 'from-indigo-500 to-purple-600' : i === 1 ? 'from-green-500 to-emerald-600' : 'from-orange-500 to-red-600'} flex items-center justify-center text-white font-bold shadow-lg`}>
                      {activity.estimatedMinutes || '?'}
                    </div>
                    <div>
                      <h4 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {activity.title}
                      </h4>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-1`}>
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Clock className="w-3 h-3" />
                          {activity.estimatedMinutes} min
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-md ${isDark ? 'bg-gray-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                          {activity.subject}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-md ${
                          activity.difficulty === 'hard' 
                            ? isDark ? 'bg-red-950 text-red-400' : 'bg-red-50 text-red-600'
                            : activity.difficulty === 'medium'
                            ? isDark ? 'bg-yellow-950 text-yellow-400' : 'bg-yellow-50 text-yellow-600'
                            : isDark ? 'bg-green-950 text-green-400' : 'bg-green-50 text-green-600'
                        }`}>
                          {activity.difficulty}
                        </span>
                        {activity.isPublished && (
                          <span className={`text-xs px-2 py-1 rounded-md ${isDark ? 'bg-green-950 text-green-400' : 'bg-green-50 text-green-600'}`}>
                            Published
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {activity.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {activity.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-1 rounded-md ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors opacity-0 group-hover:opacity-100`}>
                      <Target className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
