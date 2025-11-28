import { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, HelpCircle, Loader2, AlertCircle, Edit, Trash2, Grid, List, Table as TableIcon, Tag } from 'lucide-react';
import { questionApi } from '../services/api';

const Questions = ({ isDark }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid, list, table

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await questionApi.getQuestions({ limit: 100 });
      console.log('API Response:', data);
      console.log('API Response type:', typeof data);
      console.log('Is Array:', Array.isArray(data));
      
      // Handle different response formats
      let questionsList = [];
      
      if (Array.isArray(data)) {
        // If data is directly an array
        questionsList = data;
      } else if (data && typeof data === 'object') {
        // If data is an object, look for questions property or any array property
        if (Array.isArray(data.questions)) {
          questionsList = data.questions;
        } else if (Array.isArray(data.data)) {
          questionsList = data.data;
        } else if (Array.isArray(data.items)) {
          questionsList = data.items;
        } else {
          // Check all properties for an array
          const arrayProp = Object.values(data).find(val => Array.isArray(val));
          if (arrayProp) {
            questionsList = arrayProp;
          }
        }
      }
      
      console.log('Questions list:', questionsList);
      console.log('Questions count:', questionsList.length);
      
      // Normalize data to handle both camelCase and snake_case
      const normalizedQuestions = questionsList.map(q => ({
        question_id: q.question_id || q.questionId,
        question_text: q.question_text || q.questionText,
        question_type: q.question_type || q.questionType,
        content: q.content || {},
        subject: q.subject,
        difficulty: q.difficulty,
        points: q.points,
      }));
      
      console.log('Normalized questions:', normalizedQuestions);
      setQuestions(normalizedQuestions);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setError('Failed to load questions. Please make sure the API is running.');
    } finally {
      setLoading(false);
    }
  };

  // Get unique question types for filter
  const uniqueTypes = [...new Set(questions.map(q => q.question_type).filter(Boolean))];

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch = question.question_text?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || question.question_type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type) => {
    const colors = {
      'multiple_choice': isDark ? 'bg-blue-950 text-blue-400' : 'bg-blue-50 text-blue-600',
      'true_false': isDark ? 'bg-green-950 text-green-400' : 'bg-green-50 text-green-600',
      'short_answer': isDark ? 'bg-purple-950 text-purple-400' : 'bg-purple-50 text-purple-600',
      'essay': isDark ? 'bg-orange-950 text-orange-400' : 'bg-orange-50 text-orange-600',
    };
    return colors[type] || (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600');
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'multiple_choice':
        return '✓';
      case 'true_false':
        return '⊤⊥';
      case 'short_answer':
        return '📝';
      case 'essay':
        return '📄';
      default:
        return '?';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className={`w-12 h-12 animate-spin mx-auto mb-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading questions...</p>
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
                onClick={fetchQuestions}
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

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredQuestions.map((question, index) => (
        <div
          key={question.question_id}
          className={`rounded-2xl ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 p-6`}
        >
          <div className="flex items-start justify-between mb-4">
            <span className={`text-2xl`}>{getTypeIcon(question.question_type)}</span>
            <span className={`text-xs px-3 py-1 rounded-full ${getTypeColor(question.question_type)}`}>
              {question.question_type?.replace('_', ' ')}
            </span>
          </div>
          
          <h3 className={`text-lg font-bold mb-3 line-clamp-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {question.question_text}
          </h3>

          {question.content?.options && Array.isArray(question.content.options) && question.content.options.length > 0 && (
            <div className="mb-4">
              <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Options:</p>
              <div className="space-y-1">
                {question.content.options.slice(0, 2).map((opt, idx) => (
                  <div key={idx} className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                    • {typeof opt === 'string' ? opt : opt.text || opt.label || JSON.stringify(opt)}
                  </div>
                ))}
                {question.content.options.length > 2 && (
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    +{question.content.options.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={`flex gap-2 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors text-sm">
              View Details
            </button>
            <button className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
              <Edit className="w-4 h-4" />
            </button>
            <button className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-red-600' : 'bg-gray-100 hover:bg-red-100'} transition-colors`}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {filteredQuestions.map((question) => (
        <div
          key={question.question_id}
          className={`rounded-xl ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border p-6 hover:shadow-lg transition-all`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
              isDark ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
              {getTypeIcon(question.question_type)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {question.question_text}
                </h3>
                <span className={`text-xs px-3 py-1 rounded-full ${getTypeColor(question.question_type)} ml-4`}>
                  {question.question_type?.replace('_', ' ')}
                </span>
              </div>
              
              {question.content?.options && Array.isArray(question.content.options) && question.content.options.length > 0 && (
                <div className="mb-4">
                  <p className={`text-sm mb-2 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Options:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {question.content.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`text-sm px-3 py-2 rounded-lg ${
                          isDark ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {idx + 1}. {typeof opt === 'string' ? opt : opt.text || opt.label || JSON.stringify(opt)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors text-sm">
                  View Details
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
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className={`rounded-xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border overflow-hidden`}>
      <table className="w-full">
        <thead className={isDark ? 'bg-gray-900' : 'bg-gray-50'}>
          <tr>
            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Type</th>
            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Question</th>
            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Options</th>
            <th className={`px-6 py-4 text-right text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredQuestions.map((question) => (
            <tr
              key={question.question_id}
              className={`${isDark ? 'hover:bg-gray-750 border-gray-700' : 'hover:bg-gray-50 border-gray-200'} border-t`}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getTypeIcon(question.question_type)}</span>
                  <span className={`text-xs px-2 py-1 rounded-md ${getTypeColor(question.question_type)}`}>
                    {question.question_type?.replace('_', ' ')}
                  </span>
                </div>
              </td>
              <td className={`px-6 py-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <div className="font-semibold line-clamp-2">{question.question_text}</div>
              </td>
              <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {question.content?.options && Array.isArray(question.content.options) ? `${question.content.options.length} options` : '-'}
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2 justify-end">
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Questions
            </h1>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your question bank
            </p>
          </div>
        </div>

        {/* Search, Filters and View Modes */}
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border`}>
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
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
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex gap-4 flex-wrap">
            {uniqueTypes.length > 0 && (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border min-w-[200px]`}>
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className={`bg-transparent border-none outline-none flex-1 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  <option value="">All Types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>
                      {type?.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center ml-auto">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Display */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-20">
          <HelpCircle className={`w-20 h-20 mx-auto mb-6 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            No questions found
          </h3>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {searchTerm || filterType ? 'Try adjusting your filters' : 'Create your first question to get started!'}
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'list' && renderListView()}
          {viewMode === 'table' && renderTableView()}
        </>
      )}
    </div>
  );
};

export default Questions;
