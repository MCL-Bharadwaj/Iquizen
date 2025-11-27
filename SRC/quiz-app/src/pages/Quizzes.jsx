import { useState, useEffect } from 'react';
import { Search, Filter, Plus, BookOpen, Clock, Tag, Loader2, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { quizApi } from '../services/api';

const Quizzes = ({ isDark }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');

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

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = !filterDifficulty || quiz.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

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
              {filteredQuizzes.length} quiz{filteredQuizzes.length !== 1 ? 'zes' : ''} available
            </p>
          </div>
          <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Quiz
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
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
        </div>
      </div>

      {/* Quizzes Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className={`w-20 h-20 mx-auto mb-6 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            No quizzes found
          </h3>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
            {searchTerm || filterDifficulty ? 'Try adjusting your filters' : 'Create your first quiz to get started!'}
          </p>
          {!searchTerm && !filterDifficulty && (
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Your First Quiz
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz, index) => (
            <div
              key={quiz.quiz_id}
              className={`group relative overflow-hidden rounded-2xl ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}
            >
              {/* Gradient Header */}
              <div className={`h-32 bg-gradient-to-br ${
                index % 3 === 0 ? 'from-indigo-500 to-purple-600' :
                index % 3 === 1 ? 'from-green-500 to-emerald-600' :
                'from-orange-500 to-red-600'
              } p-6 flex items-end`}>
                <div className="flex-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    quiz.is_published 
                      ? 'bg-white bg-opacity-30 text-white' 
                      : 'bg-black bg-opacity-30 text-white'
                  }`}>
                    {quiz.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className={`text-xl font-bold mb-2 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {quiz.title}
                </h3>
                <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {quiz.description || 'No description available'}
                </p>

                {/* Meta Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {quiz.estimated_minutes || 0} minutes
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-md ${
                      quiz.difficulty === 'hard' 
                        ? isDark ? 'bg-red-950 text-red-400' : 'bg-red-50 text-red-600'
                        : quiz.difficulty === 'medium'
                        ? isDark ? 'bg-yellow-950 text-yellow-400' : 'bg-yellow-50 text-yellow-600'
                        : isDark ? 'bg-green-950 text-green-400' : 'bg-green-50 text-green-600'
                    }`}>
                      {quiz.difficulty || 'medium'}
                    </span>
                    {quiz.subject && (
                      <span className={`text-xs px-2 py-1 rounded-md ${isDark ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                        {quiz.subject}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {quiz.tags && quiz.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {quiz.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                  <button className={`flex-1 py-2 px-4 rounded-lg ${isDark ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-medium transition-colors`}>
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
      )}
    </div>
  );
};

export default Quizzes;
