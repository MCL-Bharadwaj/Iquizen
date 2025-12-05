import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, User, Calendar, Clock, Award, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { assignmentApi, quizApi, attemptApi } from '../../services/api';
import { QuestionText } from '../../components/CodeBlock';

const AssignmentResponsesView = ({ isDark }) => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  const [attemptResponses, setAttemptResponses] = useState({});

  useEffect(() => {
    fetchAssignmentData();
  }, [assignmentId]);

  const fetchAssignmentData = async () => {
    try {
      setLoading(true);

      // Fetch assignment details
      const assignmentData = await assignmentApi.getAssignmentById(assignmentId);
      setAssignment(assignmentData);

      // Fetch quiz details
      const quizData = await quizApi.getQuizById(assignmentData.quizId);
      setQuiz(quizData);

      // Fetch questions
      const questionsData = await quizApi.getQuizQuestions(assignmentData.quizId);
      setQuestions(questionsData.questions || []);

      // Fetch all attempts by this user for this quiz
      const attemptsData = await attemptApi.getUserAttempts(assignmentData.userId);
      
      // Filter attempts for this specific quiz and sort by date (newest first)
      const quizAttempts = (attemptsData.attempts || [])
        .filter(a => a.quizId === assignmentData.quizId)
        .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt)); // Oldest first for Attempt 1, 2, 3...
      
      setAttempts(quizAttempts);
    } catch (error) {
      console.error('Error fetching assignment data:', error);
      alert('Failed to load assignment responses. Please try again.');
      navigate('/creator/assignments');
    } finally {
      setLoading(false);
    }
  };

  const toggleAttempt = async (attemptId) => {
    if (expandedAttempt === attemptId) {
      setExpandedAttempt(null);
    } else {
      setExpandedAttempt(attemptId);
      
      // Fetch responses if not already loaded
      if (!attemptResponses[attemptId]) {
        try {
          const responsesData = await attemptApi.getAttemptResponses(attemptId);
          setAttemptResponses(prev => ({
            ...prev,
            [attemptId]: responsesData.data || responsesData.responses || []
          }));
        } catch (error) {
          console.error('Error fetching attempt responses:', error);
        }
      }
    }
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

  const formatDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    const diff = new Date(endDate) - new Date(startDate);
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader2 className={`w-12 h-12 mx-auto mb-4 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (!assignment || !quiz) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Assignment not found</p>
          <button
            onClick={() => navigate('/creator/assignments')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} pb-10`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/creator/assignments')}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Player Response Details
                </h1>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {quiz.title}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Assignment Info Card */}
        <div className={`rounded-xl shadow-lg p-6 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Assignment Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Player</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {assignment.userFirstName} {assignment.userLastName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Assigned Date</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatDate(assignment.assignedAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Award className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {assignment.status}
                </p>
              </div>
            </div>
            {assignment.dueDate && (
              <div className="flex items-center gap-3">
                <Clock className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Due Date</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatDate(assignment.dueDate)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Attempts List */}
        {attempts.length === 0 ? (
          <div className={`rounded-xl shadow-lg p-8 text-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No attempts have been made yet for this assignment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Player Attempts ({attempts.length})
            </h2>
            {attempts.map((attempt, index) => (
              <div key={attempt.attemptId} className={`rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                {/* Attempt Header - Collapsible */}
                <button
                  onClick={() => toggleAttempt(attempt.attemptId)}
                  className={`w-full p-6 flex items-center justify-between hover:bg-opacity-80 transition-colors ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="text-left">
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Attempt {index + 1}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatDate(attempt.startedAt)}
                        </span>
                        {attempt.score !== null && attempt.score !== undefined && (
                          <span className={`text-sm font-semibold ${
                            attempt.score >= 70 ? 'text-green-500' : attempt.score >= 50 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            Score: {attempt.score.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedAttempt === attempt.attemptId ? (
                    <ChevronUp className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  ) : (
                    <ChevronDown className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  )}
                </button>

                {/* Attempt Details - Expandable */}
                {expandedAttempt === attempt.attemptId && (
                  <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    {/* Attempt Summary */}
                    <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Started At</p>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatDate(attempt.startedAt)}
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Completed At</p>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatDate(attempt.completedAt)}
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Duration</p>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatDuration(attempt.startedAt, attempt.completedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Questions and Responses */}
                    <div className="p-6 space-y-6">
                      {attemptResponses[attempt.attemptId] ? (
                        questions.map((question, qIndex) => {
                          const questionId = question.question_id || question.questionId || question.id;
                          const response = attemptResponses[attempt.attemptId].find(r => r.questionId === questionId);
                          return (
                            <QuestionReviewCard
                              key={`${attempt.attemptId}-${questionId || qIndex}`}
                              question={question}
                              response={response}
                              index={qIndex}
                              isDark={isDark}
                            />
                          );
                        })
                      ) : (
                        <div className="text-center py-4">
                          <Loader2 className={`w-8 h-8 mx-auto animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading responses...</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Question Review Card Component
const QuestionReviewCard = ({ question, response, index, isDark }) => {
  const isCorrect = response?.isCorrect;
  const PlayerAnswer = response?.answerPayload;

  const renderPlayerAnswer = () => {
    if (!PlayerAnswer) {
      return (
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
          <p className={`italic ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No answer provided
          </p>
        </div>
      );
    }

    switch (question.questionType) {
      case 'multiple_choice_single':
        const selectedOption = question.content.options.find(opt => opt.id === PlayerAnswer);
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {selectedOption?.text || 'Unknown answer'}
            </p>
          </div>
        );

      case 'multiple_choice_multi':
        const selectedOptions = question.content.options.filter(opt => 
          PlayerAnswer.includes(opt.id)
        );
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            {selectedOptions.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {selectedOptions.map(opt => (
                  <li key={opt.id} className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {opt.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`italic ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No options selected
              </p>
            )}
          </div>
        );

      case 'fill_in_blank':
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            {Array.isArray(PlayerAnswer) && PlayerAnswer.length > 0 ? (
              <div className="space-y-2">
                {PlayerAnswer.map((answer, idx) => (
                  <div key={idx}>
                    <span className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      Blank {idx + 1}:
                    </span>
                    <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {answer || '(empty)'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`italic ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No answers provided
              </p>
            )}
          </div>
        );

      case 'matching':
        const leftItems = question.content.leftItems || question.content.left_items || [];
        const rightItems = question.content.rightItems || question.content.right_items || [];
        const pairs = PlayerAnswer?.pairs || [];
        const correctPairs = question.content.correctPairs || question.content.correct_pairs || [];
        
        const pairCorrectness = pairs.map(pair => {
          return correctPairs.some(cp => cp.left === pair.left && cp.right === pair.right);
        });
        
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            {pairs.length > 0 ? (
              <div className="space-y-3">
                {pairs.map((pair, idx) => {
                  const left = leftItems.find(l => l.id === pair.left);
                  const right = rightItems.find(r => r.id === pair.right);
                  const isCorrect = pairCorrectness[idx];
                  
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                        isCorrect
                          ? isDark ? 'border-green-700 bg-green-900/20' : 'border-green-300 bg-green-50'
                          : isDark ? 'border-red-700 bg-red-900/20' : 'border-red-300 bg-red-50'
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {left?.text || 'Unknown'}
                      </span>
                      <span className={`font-bold ${
                        isCorrect
                          ? isDark ? 'text-green-400' : 'text-green-600'
                          : isDark ? 'text-red-400' : 'text-red-600'
                      }`}>→</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {right?.text || 'Unknown'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={`italic ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No matches provided
              </p>
            )}
          </div>
        );

      case 'ordering':
        const orderItems = question.content.items || [];
        const order = PlayerAnswer?.order || [];
        const correctOrder = question.content.correctOrder || question.content.correct_order || [];
        
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            {order.length > 0 ? (
              <div className="space-y-2">
                {order.map((itemId, idx) => {
                  const item = orderItems.find(i => i.id === itemId);
                  const isCorrectPosition = correctOrder[idx] === itemId;
                  
                  return (
                    <div 
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                        isCorrectPosition
                          ? isDark ? 'border-green-700 bg-green-900/20' : 'border-green-300 bg-green-50'
                          : isDark ? 'border-red-700 bg-red-900/20' : 'border-red-300 bg-red-50'
                      }`}
                    >
                      {isCorrectPosition ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                        isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item?.text || 'Unknown'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={`italic ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No order provided
              </p>
            )}
          </div>
        );

      default:
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
              {JSON.stringify(PlayerAnswer)}
            </p>
          </div>
        );
    }
  };

  const renderCorrectAnswer = () => {
    switch (question.questionType) {
      case 'multiple_choice_single':
        const correctAnswerId = question.content.correct_answer || question.content.correctAnswer;
        const correctOption = question.content.options.find(opt => opt.id === correctAnswerId);
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
            <p className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
              {correctOption?.text || 'Unknown'}
            </p>
          </div>
        );

      case 'multiple_choice_multi':
        const correctAnswerIds = question.content.correct_answers || question.content.correctAnswers || [];
        const correctOptions = question.content.options.filter(opt => correctAnswerIds.includes(opt.id));
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
            <ul className="list-disc list-inside space-y-1">
              {correctOptions.map(opt => (
                <li key={opt.id} className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                  {opt.text}
                </li>
              ))}
            </ul>
          </div>
        );

      case 'fill_in_blank':
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
            <div className="space-y-2">
              {question.content.blanks.map((blank, idx) => (
                <div key={idx}>
                  <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                    Blank {idx + 1}:
                  </span>
                  <span className={`ml-2 ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                    {blank.acceptedAnswers?.join(' or ') || 'No answer specified'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'matching':
        const correctPairs = question.content.correctPairs || question.content.correct_pairs || [];
        const leftItems = question.content.leftItems || question.content.left_items || [];
        const rightItems = question.content.rightItems || question.content.right_items || [];
        
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
            <div className="space-y-2">
              {correctPairs.map((pair, idx) => {
                const left = leftItems.find(l => l.id === pair.left);
                const right = rightItems.find(r => r.id === pair.right);
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                      {left?.text || 'Unknown'}
                    </span>
                    <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>→</span>
                    <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                      {right?.text || 'Unknown'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'ordering':
        const correctOrder = question.content.correctOrder || question.content.correct_order || [];
        const items = question.content.items || [];
        
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
            <div className="space-y-2">
              {correctOrder.map((itemId, idx) => {
                const item = items.find(i => i.id === itemId);
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                      isDark ? 'bg-green-900 text-green-400' : 'bg-green-100 text-green-700'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                      {item?.text || 'Unknown'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 shadow-lg`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
              isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
            }`}>
              Question {index + 1}
            </span>
            {isCorrect !== undefined && (
              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                isCorrect
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {isCorrect ? <CheckCircle className="w-4 h-4 inline mr-1" /> : <XCircle className="w-4 h-4 inline mr-1" />}
                {isCorrect ? 'Correct' : 'Incorrect'}
              </span>
            )}
          </div>
          <QuestionText 
            text={question.questionText || question.content?.text}
            isDark={isDark}
            className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
          />
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {response?.pointsEarned || 0} / {question.points || 10}
          </div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            points
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className={`font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Your Answer:
          </h4>
          {renderPlayerAnswer()}
        </div>

        {!isCorrect && (
          <div>
            <h4 className={`font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Correct Answer:
            </h4>
            {renderCorrectAnswer()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentResponsesView;
