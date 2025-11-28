import { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Clock, Tag, Loader2, AlertCircle, Edit, Trash2, Grid, List, LayoutGrid, Table as TableIcon, Users } from 'lucide-react';
import { quizApi } from '../services/api';

const Quizzes = ({ isDark }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterTags, setFilterTags] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, table, compact, detailed

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quizApi.getQuizzes({ limit: 100 });
      setQuizzes(data.quizzes || []);
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
      setError('Failed to load quizzes. Please make sure the API is running.');
    } finally {
      setLoading(false);
    }
  };

  // Get unique subjects and tags for filters
  const uniqueSubjects = [...new Set(quizzes.map(q => q.subject).filter(Boolean))];
  const allTags = [...new Set(quizzes.flatMap(q => q.tags || []))];

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = !filterDifficulty || quiz.difficulty === filterDifficulty;
    const matchesSubject = !filterSubject || quiz.subject === filterSubject;
    const matchesTags = filterTags.length === 0 || filterTags.some(tag => quiz.tags?.includes(tag));
    return matchesSearch && matchesDifficulty && matchesSubject && matchesTags;
  });

  const toggleTag = (tag) => {
    setFilterTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty === 'hard') return isDark ? 'bg-red-950 text-red-400' : 'bg-red-50 text-red-600';
    if (difficulty === 'medium') return isDark ? 'bg-yellow-950 text-yellow-400' : 'bg-yellow-50 text-yellow-600';
    return isDark ? 'bg-green-950 text-green-400' : 'bg-green-50 text-green-600';
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
          key={quiz.quiz_id}
          className={`group relative overflow-hidden rounded-2xl ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}
        >
          <div className={`h-32 bg-gradient-to-br ${getGradient(index)} p-6 flex items-end`}>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              quiz.is_published ? 'bg-white bg-opacity-30 text-white' : 'bg-black bg-opacity-30 text-white'
            }`}>
              {quiz.is_published ? 'Published' : 'Draft'}
            </span>
          </div>
          <div className="p-6">
            <h3 className={`text-xl font-bold mb-2 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {quiz.title}
            </h3>
            <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {quiz.description || 'No description available'}
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {quiz.estimated_minutes || 0} minutes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Ages {quiz.age_min || 0}-{quiz.age_max || 100}
                </span>
              </div>
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
              <button className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors">
                Start Quiz
              </button>
              <button className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                <Edit className="w-5 h-5" />
              </button>
              <button className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-red-600' : 'bg-gray-100 hover:bg-red-100'} transition-colors`}>
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
          key={quiz.quiz_id}
          className={`group relative overflow-hidden rounded-2xl ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border shadow-lg hover:shadow-2xl transition-all duration-300`}
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
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {quiz.description || 'No description available'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  quiz.is_published 
                    ? isDark ? 'bg-green-950 text-green-400' : 'bg-green-50 text-green-600'
                    : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  {quiz.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {quiz.estimated_minutes || 0} min
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Ages {quiz.age_min || 0}-{quiz.age_max || 100}
                  </span>
                </div>
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
                <button className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors">
                  Start Quiz
                </button>
                <button className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors flex items-center gap-2`}>
                  <Edit className="w-5 h-5" />
                  Edit
                </button>
                <button className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-red-600' : 'bg-gray-100 hover:bg-red-100'} transition-colors flex items-center gap-2`}>
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
            <tr key={quiz.quiz_id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
              <td className={`px-6 py-4 ${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{quiz.title}</td>
              <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{quiz.subject || 'N/A'}</td>
              <td className="px-6 py-4">
                <span className={`text-xs px-2 py-1 rounded-md ${getDifficultyColor(quiz.difficulty)}`}>
                  {quiz.difficulty || 'medium'}
                </span>
              </td>
              <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {quiz.age_min || 0}-{quiz.age_max || 100}
              </td>
              <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{quiz.estimated_minutes || 0} min</td>
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
                  quiz.is_published 
                    ? isDark ? 'bg-green-950 text-green-400' : 'bg-green-50 text-green-600'
                    : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  {quiz.is_published ? 'Published' : 'Draft'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-red-600' : 'bg-gray-100 hover:bg-red-100'} transition-colors`}>
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
          key={quiz.quiz_id}
          className={`group relative overflow-hidden rounded-xl ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border shadow hover:shadow-lg transition-all duration-300`}
        >
          <div className={`h-20 bg-gradient-to-br ${getGradient(index)} p-4 flex items-end`}>
            <span className={`text-xs px-2 py-1 rounded-full ${
              quiz.is_published ? 'bg-white bg-opacity-30 text-white' : 'bg-black bg-opacity-30 text-white'
            }`}>
              {quiz.is_published ? '✓' : '•'}
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
                  {quiz.estimated_minutes || 0}m
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-gray-400" />
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {quiz.age_min || 0}-{quiz.age_max || 100}
                </span>
              </div>
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
          key={quiz.quiz_id}
          className={`group relative overflow-hidden rounded-2xl ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border shadow-lg hover:shadow-2xl transition-all duration-300`}
        >
          <div className={`h-40 bg-gradient-to-br ${getGradient(index)} p-8 flex items-center justify-between`}>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{quiz.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                quiz.is_published ? 'bg-white bg-opacity-30 text-white' : 'bg-black bg-opacity-30 text-white'
              }`}>
                {quiz.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
            <BookOpen className="w-16 h-16 text-white opacity-30" />
          </div>
          <div className="p-8">
            <p className={`text-base mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {quiz.description || 'No description available'}
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <Clock className="w-6 h-6 text-indigo-500 mb-2" />
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Duration</div>
                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {quiz.estimated_minutes || 0} min
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
                  {quiz.age_min || 0}-{quiz.age_max || 100}
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
              <button className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors">
                Start Quiz
              </button>
              <button className={`p-3 rounded-xl ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                <Edit className="w-5 h-5" />
              </button>
              <button className={`p-3 rounded-xl ${isDark ? 'bg-gray-700 hover:bg-red-600' : 'bg-gray-100 hover:bg-red-100'} transition-colors`}>
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              All Quizzes
            </h1>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage all your quizzes
            </p>
          </div>
        </div>

        {/* Search, Filters and View Modes */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border`}>
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search quizzes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`bg-transparent border-none outline-none flex-1 ${
                    isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>

            {/* View Mode Toggles */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white'
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
                    ? isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white'
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
                    ? isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white'
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
                    ? isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white'
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
                    ? isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white'
                    : isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Detailed View"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex gap-4 flex-wrap">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border min-w-[200px]`}>
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className={`bg-transparent border-none outline-none flex-1 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {uniqueSubjects.length > 0 && (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border min-w-[200px]`}>
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

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    filterTags.includes(tag)
                      ? isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white'
                      : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Tag className="w-3 h-3 inline mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quizzes Display */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className={`w-20 h-20 mx-auto mb-6 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            No quizzes found
          </h3>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
            {searchTerm || filterDifficulty || filterSubject || filterTags.length > 0 
              ? 'Try adjusting your filters' 
              : 'Create your first quiz to get started!'}
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

export default Quizzes;
