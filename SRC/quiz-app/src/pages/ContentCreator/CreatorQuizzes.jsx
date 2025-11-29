import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { quizApi } from '../../services/api';
import { 
  Edit, 
  Trash2, 
  BookOpen, 
  Clock, 
  BarChart,
  Search,
  Grid,
  List,
  Table as TableIcon,
  LayoutGrid,
  Users,
  Tag,
  Filter,
  Plus
} from 'lucide-react';

const CreatorQuizzes = ({ isDark }) => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterTags, setFilterTags] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, table, compact, detailed

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

  const uniqueSubjects = [...new Set(quizzes.map(q => q.subject).filter(Boolean))];
  const allTags = [...new Set(quizzes.flatMap(q => q.tags || []))];

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          quiz.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || quiz.difficulty === filterDifficulty;
    const matchesSubject = !filterSubject || quiz.subject === filterSubject;
    const matchesTags = filterTags.length === 0 || filterTags.some(tag => quiz.tags?.includes(tag));
    return matchesSearch && matchesDifficulty && matchesSubject && matchesTags;
  });

  const toggleTag = (tag) => {
    setFilterTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const getGradient = (index) => {
    const gradients = [
      'from-indigo-500 to-purple-600',
      'from-green-500 to-emerald-600',
      'from-orange-500 to-red-600',
      'from-blue-500 to-cyan-600',
      'from-pink-500 to-rose-600',
    ];
    return gradients[index % gradients.length];
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredQuizzes.map((quiz, index) => (
        <div
          key={quiz.quizId}
          className={`rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl ${
            isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-2xl shadow'
          }`}
        >
          <div className={`h-32 bg-gradient-to-br ${getGradient(index)} p-6 flex items-end`}>
            <span className={`text-xs px-3 py-1 rounded-full ${
              quiz.isPublished ? 'bg-white bg-opacity-30 text-white' : 'bg-black bg-opacity-30 text-white'
            }`}>
              {quiz.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
          <div className="p-6">
            <h3 className={`text-xl font-bold mb-2 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {quiz.title}
            </h3>
            {quiz.description && (
              <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {quiz.description}
              </p>
            )}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {quiz.estimatedMinutes || 0} minutes
                </span>
              </div>
              {(quiz.ageMin || quiz.ageMax) && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Ages {quiz.ageMin || 0}-{quiz.ageMax || 100}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-md ${getDifficultyColor(quiz.difficulty)}`}>
                  {quiz.difficulty || 'medium'}
                </span>
                {quiz.subject && (
                  <span className={`text-xs px-2 py-1 rounded-md ${isDark ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    {quiz.subject}
                  </span>
                )}
              </div>
            </div>
            {quiz.tags && quiz.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {quiz.tags.map((tag, idx) => (
                  <span key={idx} className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className={`flex gap-2 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => handleEditQuiz(quiz.quizId)}
                className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
              >
                Manage
              </button>
              <button
                onClick={() => handleDeleteQuiz(quiz.quizId)}
                className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-red-600' : 'bg-gray-100 hover:bg-red-100'} transition-colors`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {filteredQuizzes.map((quiz, index) => (
        <div
          key={quiz.quizId}
          className={`overflow-hidden rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white shadow'} transition-all hover:shadow-xl`}
        >
          <div className="flex">
            <div className={`w-48 bg-gradient-to-br ${getGradient(index)} flex items-center justify-center`}>
              <BookOpen className="w-16 h-16 text-white opacity-50" />
            </div>
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {quiz.title}
                  </h3>
                  {quiz.description && (
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {quiz.description}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  quiz.isPublished 
                    ? isDark ? 'bg-green-950 text-green-400' : 'bg-green-50 text-green-600'
                    : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  {quiz.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {quiz.estimatedMinutes || 0} min
                  </span>
                </div>
                {(quiz.ageMin || quiz.ageMax) && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Ages {quiz.ageMin || 0}-{quiz.ageMax || 100}
                    </span>
                  </div>
                )}
                <span className={`text-xs px-2 py-1 rounded-md ${getDifficultyColor(quiz.difficulty)}`}>
                  {quiz.difficulty || 'medium'}
                </span>
                {quiz.subject && (
                  <span className={`text-xs px-2 py-1 rounded-md ${isDark ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    {quiz.subject}
                  </span>
                )}
              </div>
              {quiz.tags && quiz.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {quiz.tags.map((tag, idx) => (
                    <span key={idx} className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditQuiz(quiz.quizId)}
                  className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
                >
                  Manage
                </button>
                <button
                  onClick={() => handleDeleteQuiz(quiz.quizId)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isDark ? 'bg-gray-700 hover:bg-red-600' : 'bg-gray-100 hover:bg-red-100'} transition-colors`}
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className={`overflow-x-auto rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <table className="w-full">
        <thead className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <tr>
            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Title</th>
            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Subject</th>
            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Difficulty</th>
            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Age Group</th>
            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Duration</th>
            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tags</th>
            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
            <th className={`px-6 py-4 text-right text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {filteredQuizzes.map((quiz) => (
            <tr key={quiz.quizId} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
              <td className={`px-6 py-4 ${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{quiz.title}</td>
              <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{quiz.subject || 'N/A'}</td>
              <td className="px-6 py-4">
                <span className={`text-xs px-2 py-1 rounded-md ${getDifficultyColor(quiz.difficulty)}`}>
                  {quiz.difficulty || 'medium'}
                </span>
              </td>
              <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {quiz.ageMin || 0}-{quiz.ageMax || 100}
              </td>
              <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{quiz.estimatedMinutes || 0} min</td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {quiz.tags?.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className={`text-xs px-2 py-1 rounded-md ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      {tag}
                    </span>
                  ))}
                  {quiz.tags?.length > 2 && (
                    <span className={`text-xs px-2 py-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      +{quiz.tags.length - 2}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  quiz.isPublished 
                    ? isDark ? 'bg-green-950 text-green-400' : 'bg-green-50 text-green-600'
                    : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  {quiz.isPublished ? 'Published' : 'Draft'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleEditQuiz(quiz.quizId)}
                    className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.quizId)}
                    className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-red-600' : 'bg-gray-100 hover:bg-red-100'} transition-colors`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCompactView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredQuizzes.map((quiz, index) => (
        <div
          key={quiz.quizId}
          className={`rounded-xl overflow-hidden transition-all ${isDark ? 'bg-gray-800' : 'bg-white shadow'} hover:shadow-lg`}
        >
          <div className={`h-20 bg-gradient-to-br ${getGradient(index)} p-4 flex items-end`}>
            <span className={`text-xs px-2 py-1 rounded-full ${
              quiz.isPublished ? 'bg-white bg-opacity-30 text-white' : 'bg-black bg-opacity-30 text-white'
            }`}>
              {quiz.isPublished ? '✓' : '•'}
            </span>
          </div>
          <div className="p-4">
            <h3 className={`text-sm font-bold mb-2 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {quiz.title}
            </h3>
            <div className="space-y-1">
              <span className={`text-xs px-2 py-1 rounded-md inline-block ${getDifficultyColor(quiz.difficulty)}`}>
                {quiz.difficulty || 'medium'}
              </span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {quiz.estimatedMinutes || 0}m
                </span>
              </div>
              {(quiz.ageMin || quiz.ageMax) && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-gray-400" />
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {quiz.ageMin || 0}-{quiz.ageMax || 100}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDetailedView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {filteredQuizzes.map((quiz, index) => (
        <div
          key={quiz.quizId}
          className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white shadow'} transition-all hover:shadow-2xl`}
        >
          <div className={`h-40 bg-gradient-to-br ${getGradient(index)} p-8 flex items-center justify-between`}>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{quiz.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                quiz.isPublished ? 'bg-white bg-opacity-30 text-white' : 'bg-black bg-opacity-30 text-white'
              }`}>
                {quiz.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <BookOpen className="w-16 h-16 text-white opacity-30" />
          </div>
          <div className="p-8">
            {quiz.description && (
              <p className={`text-base mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {quiz.description}
              </p>
            )}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <Clock className="w-6 h-6 text-indigo-500 mb-2" />
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Duration</div>
                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {quiz.estimatedMinutes || 0} min
                </div>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <Filter className="w-6 h-6 text-purple-500 mb-2" />
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Difficulty</div>
                <div className={`text-lg font-bold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {quiz.difficulty || 'medium'}
                </div>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <BookOpen className="w-6 h-6 text-green-500 mb-2" />
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Subject</div>
                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {quiz.subject || 'N/A'}
                </div>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <Users className="w-6 h-6 text-orange-500 mb-2" />
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Age Group</div>
                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {quiz.ageMin || 0}-{quiz.ageMax || 100}
                </div>
              </div>
            </div>
            {quiz.tags && quiz.tags.length > 0 && (
              <div className="mb-6">
                <div className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Tag className="w-4 h-4" />
                  Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {quiz.tags.map((tag, idx) => (
                    <span key={idx} className={`text-sm px-3 py-1 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => handleEditQuiz(quiz.quizId)}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
              >
                Manage Quiz
              </button>
              <button
                onClick={() => handleDeleteQuiz(quiz.quizId)}
                className={`p-3 rounded-xl ${isDark ? 'bg-gray-700 hover:bg-red-600' : 'bg-gray-100 hover:bg-red-100'} transition-colors`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

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
            onClick={() => navigate('/creator/quiz/create')}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Create New Quiz
          </button>
        </div>
      </div>

      {/* Search and View Modes */}
      <div className="mb-4 flex gap-4 items-center">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-3 rounded-xl border transition-colors
                ${isDark 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                }
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20
              `}
            />
          </div>
        </div>

        {/* View Mode Toggles */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white'
                : isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Grid View"
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white'
                : isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="List View"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'table'
                ? 'bg-indigo-600 text-white'
                : isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Table View"
          >
            <TableIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'compact'
                ? 'bg-indigo-600 text-white'
                : isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Compact View"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'detailed'
                ? 'bg-indigo-600 text-white'
                : isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Detailed View"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="mb-4 flex gap-4 flex-wrap">
        {/* Difficulty Filter */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border min-w-[200px] ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className={`bg-transparent border-none outline-none flex-1 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Subject Filter */}
        {uniqueSubjects.length > 0 && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border min-w-[200px] ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <BookOpen className="w-5 h-5 text-gray-400" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className={`bg-transparent border-none outline-none flex-1 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              <option value="">All Subjects</option>
              {uniqueSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center ml-auto">
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {filteredQuizzes.length} quiz{filteredQuizzes.length !== 1 ? 'zes' : ''} found
          </span>
        </div>
      </div>

      {/* Active Filters */}
      {(filterDifficulty !== 'all' || filterSubject || filterTags.length > 0) && (
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <span className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Active Filters:
          </span>
          {filterDifficulty !== 'all' && (
            <button
              onClick={() => setFilterDifficulty('all')}
              className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 transition-all ${
                isDark ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <Filter className="w-3 h-3" />
              {filterDifficulty}
              <span className="text-xs">✕</span>
            </button>
          )}
          {filterSubject && (
            <button
              onClick={() => setFilterSubject('')}
              className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 transition-all ${
                isDark ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              {filterSubject}
              <span className="text-xs">✕</span>
            </button>
          )}
          {filterTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 transition-all ${
                isDark ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Tag className="w-3 h-3" />
              {tag}
              <span className="text-xs">✕</span>
            </button>
          ))}
          <button
            onClick={() => {
              setFilterDifficulty('all');
              setFilterSubject('');
              setFilterTags([]);
            }}
            className={`px-3 py-1 rounded-full text-xs transition-all ${
              isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Clear All
          </button>
        </div>
      )}

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
        <>
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'list' && renderListView()}
          {viewMode === 'table' && renderTableView()}
          {viewMode === 'compact' && renderCompactView()}
          {viewMode === 'detailed' && renderDetailedView()}
        </>
      )}
    </div>
  );
};

export default CreatorQuizzes;
