import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { quizApi } from '../../services/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Clock, 
  BarChart,
  Search
} from 'lucide-react';

const CreatorQuizzes = ({ isDark }) => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

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

  const handleCreateQuiz = () => {
    navigate('/creator/quiz/create');
  };

  const handleEditQuiz = (quizId) => {
    navigate(`/creator/quiz/${quizId}/questions`);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await quizApi.deleteQuiz(quizId);
        fetchQuizzes();
      } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('Failed to delete quiz');
      }
    }
  };

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

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          quiz.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || quiz.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              All Quizzes
            </h1>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage all your quizzes
            </p>
          </div>
          <button
            onClick={handleCreateQuiz}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Create New Quiz</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`
        mb-6 p-4 rounded-lg flex flex-wrap gap-4
        ${isDark ? 'bg-gray-800' : 'bg-white shadow'}
      `}>
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2 rounded-lg border transition-colors
                ${isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500/20
              `}
            />
          </div>
        </div>

        {/* Difficulty Filter */}
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className={`
            px-4 py-2 rounded-lg border transition-colors
            ${isDark 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500/20
          `}
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Quiz List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className={`
          text-center py-20 rounded-lg
          ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600 shadow'}
        `}>
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl font-semibold mb-2">
            {searchQuery || filterDifficulty !== 'all' ? 'No quizzes found' : 'No quizzes yet'}
          </p>
          <p className="text-sm">
            {searchQuery || filterDifficulty !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Create your first quiz to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.quizId}
              className={`
                rounded-lg p-6 transition-all duration-300 hover:shadow-xl
                ${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-2xl shadow'}
              `}
            >
              {/* Quiz Header */}
              <div className="mb-4">
                <h3 className={`text-xl font-bold mb-2 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {quiz.title}
                </h3>
                {quiz.description && (
                  <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {quiz.description}
                  </p>
                )}
              </div>

              {/* Quiz Metadata */}
              <div className="space-y-2 mb-4">
                {quiz.subject && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {quiz.subject}
                    </span>
                  </div>
                )}
                {quiz.estimatedMinutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {quiz.estimatedMinutes} minutes
                    </span>
                  </div>
                )}
                {quiz.difficulty && (
                  <div className="flex items-center gap-2">
                    <BarChart className="w-4 h-4 text-purple-500" />
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                      {quiz.difficulty}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className={`flex gap-2 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => handleEditQuiz(quiz.quizId)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm font-medium">Manage</span>
                </button>
                <button
                  onClick={() => handleDeleteQuiz(quiz.quizId)}
                  className={`
                    p-2 rounded-lg transition-colors
                    ${isDark 
                      ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' 
                      : 'bg-red-100 hover:bg-red-200 text-red-700'
                    }
                  `}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreatorQuizzes;
