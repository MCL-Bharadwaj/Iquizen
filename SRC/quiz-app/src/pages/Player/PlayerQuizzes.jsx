import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, BookOpen, Clock, Loader2, AlertCircle, Play, Lock, Grid, List, Table as TableIcon, LayoutGrid } from 'lucide-react';
import { quizApi, assignmentApi, attemptApi, helpers } from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PlayerQuizzes = ({ isDark }) => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterSubject, setFilterSubject] = useState('');
  const [viewMode, setViewMode] = useState('grid');
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
    const matchesDifficulty = filterDifficulty === 'all' || quiz.difficulty === filterDifficulty;
    const matchesSubject = !filterSubject || quiz.subject === filterSubject;
    return matchesSearch && matchesDifficulty && matchesSubject;
  });

  // Sort quizzes: incomplete/new at top, completed at bottom
  const sortedQuizzes = [...filteredQuizzes].sort((a, b) => {
    // Determine if quiz is completed/locked
    const isALocked = a.maxAttempts && a.attemptsUsed >= a.maxAttempts;
    const isBLocked = b.maxAttempts && b.attemptsUsed >= b.maxAttempts;
    
    // Priority: active quizzes (not locked) come first
    if (isALocked !== isBLocked) {
      return isALocked ? 1 : -1; // Not locked (false/0) comes before locked (true/1)
    }
    
    // If both have same lock status, sort by dueDate (earlier due dates first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    
    // If only one has a due date, prioritize the one with due date
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    
    // Otherwise maintain original order
    return 0;
  });

  const uniqueSubjects = [...new Set(quizzes.map(q => q.subject).filter(Boolean))];

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

  const renderQuizCard = (quiz, index) => {
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
        className={`rounded-xl overflow-hidden transition-all duration-300 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } ${isMaxAttemptsReached ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl cursor-pointer'}`}
        onClick={handleQuizClick}
      >
        <div className={`h-20 bg-gradient-to-r ${getGradient(index)} p-4 flex items-center justify-between`}>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
            quiz.isMandatory ? 'bg-orange-400 text-white' : 'bg-white bg-opacity-30 text-white'
          }`}>
            {quiz.isMandatory ? 'Mandatory' : quiz.subject || 'General'}
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
            className={`w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isMaxAttemptsReached
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : isDark 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
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
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedQuizzes.map((quiz, index) => renderQuizCard(quiz, index))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {sortedQuizzes.map((quiz, index) => {
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
            className={`overflow-hidden rounded-xl transition-all cursor-pointer ${
              isDark ? 'bg-gray-800' : 'bg-white shadow'
            } ${isMaxAttemptsReached ? 'opacity-60' : 'hover:shadow-xl'}`}
            onClick={handleQuizClick}
          >
            <div className="flex">
              <div className={`w-32 bg-gradient-to-br ${getGradient(index)} flex items-center justify-center flex-shrink-0`}>
                <BookOpen className="w-12 h-12 text-white opacity-60" />
              </div>
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {quiz.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-md ${getDifficultyColor(quiz.difficulty)}`}>
                      {quiz.difficulty || 'medium'}
                    </span>
                    {quiz.isMandatory && (
                      <span className={`text-xs px-2 py-1 rounded-md ${isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
                        Mandatory
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {quiz.estimatedMinutes || 0} mins
                    </span>
                  </div>
                  {quiz.subject && (
                    <span className={`text-sm px-2 py-1 rounded-md ${isDark ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                      {quiz.subject}
                    </span>
                  )}
                  {quiz.dueDate && (
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Due: {new Date(quiz.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  {quiz.maxAttempts && (
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Attempts: {quiz.attemptsUsed || 0} / {quiz.maxAttempts}
                    </span>
                  )}
                </div>
                <button
                  className={`py-2 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    isMaxAttemptsReached
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
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
          </div>
        );
      })}
    </div>
  );

  const renderTableView = () => (
    <div className={`overflow-x-auto rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <table className="w-full">
        <thead>
          <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} border-b ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
            <th className={`px-6 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Quiz Title</th>
            <th className={`px-6 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Subject</th>
            <th className={`px-6 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Difficulty</th>
            <th className={`px-6 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Duration</th>
            <th className={`px-6 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Due Date</th>
            <th className={`px-6 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Attempts</th>
            <th className={`px-6 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedQuizzes.map((quiz) => {
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
              <tr
                key={quiz.quizId}
                className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
              >
                <td className={`px-6 py-4 font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {quiz.title}
                </td>
                <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {quiz.subject || '-'}
                </td>
                <td className={`px-6 py-4`}>
                  <span className={`text-xs px-2 py-1 rounded-md ${getDifficultyColor(quiz.difficulty)}`}>
                    {quiz.difficulty || 'medium'}
                  </span>
                </td>
                <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {quiz.estimatedMinutes || 0} mins
                </td>
                <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {quiz.dueDate ? new Date(quiz.dueDate).toLocaleDateString() : '-'}
                </td>
                <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {quiz.maxAttempts ? `${quiz.attemptsUsed || 0} / ${quiz.maxAttempts}` : '-'}
                </td>
                <td className={`px-6 py-4`}>
                  <button
                    onClick={handleQuizClick}
                    disabled={isMaxAttemptsReached}
                    className={`py-2 px-4 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      isMaxAttemptsReached
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    Start
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderCompactView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {sortedQuizzes.map((quiz, index) => {
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
            className={`rounded-lg p-4 transition-all cursor-pointer ${
              isDark ? 'bg-gray-800' : 'bg-white shadow'
            } ${isMaxAttemptsReached ? 'opacity-60' : 'hover:shadow-lg'}`}
            onClick={handleQuizClick}
          >
            <div className={`h-12 bg-gradient-to-r ${getGradient(index)} rounded-md mb-3`} />
            <h4 className={`font-bold text-sm mb-2 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {quiz.title}
            </h4>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {quiz.estimatedMinutes || 0}m
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${getDifficultyColor(quiz.difficulty)}`}>
                {quiz.difficulty || 'med'}
              </span>
            </div>
            <button
              onClick={handleQuizClick}
              disabled={isMaxAttemptsReached}
              className={`w-full py-1.5 text-xs rounded font-medium transition-all ${
                isMaxAttemptsReached
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isMaxAttemptsReached ? 'Max' : 'Start'}
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Available Quizzes
        </h1>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {sortedQuizzes.length} quiz{sortedQuizzes.length !== 1 ? 'zes' : ''} available
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`bg-transparent border-none outline-none flex-1 ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
          />
        </div>
      </div>

      {/* Filter and View Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex gap-4 flex-1">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} min-w-[180px]`}>
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className={`bg-transparent border-none outline-none flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} min-w-[180px]`}>
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className={`bg-transparent border-none outline-none flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              <option value="">All Subjects</option>
              {uniqueSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className={`flex items-center gap-2 p-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? isDark
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : isDark
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-600 hover:text-gray-700'
            }`}
            title="Grid view"
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? isDark
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : isDark
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-600 hover:text-gray-700'
            }`}
            title="List view"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'table'
                ? isDark
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : isDark
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-600 hover:text-gray-700'
            }`}
            title="Table view"
          >
            <TableIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'compact'
                ? isDark
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : isDark
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-600 hover:text-gray-700'
            }`}
            title="Compact view"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* No Results Message */}
      {sortedQuizzes.length === 0 && (
        <div className={`rounded-xl p-8 text-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <BookOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            No quizzes found
          </p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* View Rendering */}
      {sortedQuizzes.length > 0 && (
        <>
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'list' && renderListView()}
          {viewMode === 'table' && renderTableView()}
          {viewMode === 'compact' && renderCompactView()}
        </>
      )}

      <ToastContainer />
    </div>
  );
};

export default PlayerQuizzes;
