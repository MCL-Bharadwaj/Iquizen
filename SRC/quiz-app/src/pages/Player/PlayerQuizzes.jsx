import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, BookOpen, Clock, Loader2, AlertCircle, Play, Lock } from 'lucide-react';
import { quizApi, assignmentApi, attemptApi, helpers } from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PlayerQuizzes = ({ isDark }) => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [userAttempts, setUserAttempts] = useState([]);
  const userId = helpers.getUserId('Player');

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch assigned quizzes from assignments API
      const assignmentsData = await assignmentApi.getMyAssignments();
      console.log('Fetched assignments:', assignmentsData); // Debug log
      
      // Fetch user attempts to check max_attempts
      const attemptsData = await attemptApi.getUserAttempts(userId);
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
      
      setQuizzes(assignedQuizzes);
    } catch (err) {
      console.error('Failed to fetch assigned quizzes:', err);
      setError('Failed to load assigned quizzes. Please make sure the API is running.');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = !filterDifficulty || quiz.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className={`w-12 h-12 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className={`rounded-2xl p-8 ${isDark ? 'bg-red-950 border-red-900' : 'bg-red-50 border-red-200'} border-2`}>
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-600">{error}</p>
          <button onClick={fetchQuizzes} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Available Quizzes
        </h1>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {filteredQuizzes.length} quiz{filteredQuizzes.length !== 1 ? 'zes' : ''} available
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`bg-transparent border-none outline-none flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
            />
          </div>
        </div>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} min-w-[200px]`}>
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className={`bg-transparent border-none outline-none flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuizzes.map((quiz) => {
          const isMaxAttemptsReached = quiz.maxAttempts && quiz.attemptsUsed >= quiz.maxAttempts;
          const handleQuizClick = () => {
            if (isMaxAttemptsReached) {
              toast.error(`Maximum attempts (${quiz.maxAttempts}) reached for this quiz`, {
                position: 'top-center',
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
            className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg transition-all duration-300 overflow-hidden ${
              isMaxAttemptsReached 
                ? 'opacity-60 cursor-not-allowed' 
                : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
            }`}
            onClick={handleQuizClick}
          >
            {/* Header with gradient */}
            <div className="h-32 bg-gradient-to-br from-blue-500 to-cyan-600 p-6 flex items-end">
              <span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-medium">
                {quiz.subject || 'General'}
              </span>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {quiz.title}
              </h3>
              <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {quiz.description || 'No description available'}
              </p>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {quiz.estimatedMinutes || 0} mins
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
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

              {/* Assignment-specific info */}
              {quiz.dueDate && (
                <div className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Due: {new Date(quiz.dueDate).toLocaleDateString()}
                </div>
              )}

              {quiz.maxAttempts && (
                <div className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Attempts: {quiz.attemptsUsed || 0} / {quiz.maxAttempts}
                </div>
              )}

              <button 
                className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  isMaxAttemptsReached
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:shadow-lg'
                }`}
                disabled={isMaxAttemptsReached}
              >
                {isMaxAttemptsReached ? (
                  <>
                    <Lock className="w-5 h-5" />
                    Max Attempts Reached
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Quiz
                  </>
                )}
              </button>
            </div>
          </div>
          );
        })}
      </div>
      <ToastContainer />
    </div>
  );
};

export default PlayerQuizzes;
