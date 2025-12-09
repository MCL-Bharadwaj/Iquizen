import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, ArrowLeft, Clock, Award } from 'lucide-react';
import { attemptApi, quizApi, helpers } from '../../services/api';
import { QuestionText } from '../../components/CodeBlock';

const AttemptDetails = ({ isDark }) => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const userId = helpers.getUserId('Player');

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [allAttempts, setAllAttempts] = useState([]);
  const [canRetake, setCanRetake] = useState(true);

  useEffect(() => {
    fetchAttemptDetails();
  }, [attemptId]);

  const fetchAttemptDetails = async () => {
    try {
      setLoading(true);

      // Fetch attempt details
      const attemptData = await attemptApi.getAttemptById(attemptId);
      setAttempt(attemptData);

      // Fetch quiz details
      const quizData = await quizApi.getQuizById(attemptData.quizId);
      setQuiz(quizData);

      // Fetch questions
      const questionsData = await quizApi.getQuizQuestions(attemptData.quizId);
      setQuestions(questionsData.questions || []);

      // Fetch responses
      const responsesData = await attemptApi.getAttemptResponses(attemptId);
      setResponses(responsesData.data || responsesData.responses || []);

      // Fetch all user attempts to check if retake is allowed
      const userAttemptsData = await attemptApi.getUserAttempts(userId);
      const attemptsForThisQuiz = (userAttemptsData.attempts || []).filter(
        a => a.quizId === attemptData.quizId && a.status === 'completed'
      );
      setAllAttempts(attemptsForThisQuiz);

      // Check if user can retake (based on quiz maxAttempts setting)
      const maxAttempts = quizData.maxAttempts || Infinity;
      const completedAttempts = attemptsForThisQuiz.length;
      setCanRetake(completedAttempts < maxAttempts);
    } catch (error) {
      console.error('Error fetching attempt details:', error);
      alert('Failed to load attempt details. Please try again.');
      navigate('/Player/attempts');
    } finally {
      setLoading(false);
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

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const minutes = Math.round((end - start) / 60000);
    return `${minutes} min`;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className={`w-12 h-12 animate-spin mx-auto mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading attempt details...</p>
        </div>
      </div>
    );
  }

  if (!attempt || !quiz) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className={`rounded-2xl ${isDark ? 'bg-red-950 border-red-900' : 'bg-red-50 border-red-200'} border-2 p-8`}>
          <XCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            Attempt Not Found
          </h2>
          <p className={`mb-4 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
            The attempt you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => navigate('/Player/attempts')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Back to Attempts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/Player/attempts')}
        className={`mb-6 px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
          isDark
            ? 'bg-gray-800 hover:bg-gray-700 text-white'
            : 'bg-white hover:bg-gray-50 text-gray-900'
        } shadow-md`}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Attempts
      </button>

      {/* Header Card */}
      <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-8 shadow-lg mb-6`}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {quiz.title}
            </h1>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {quiz.description}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-bold mb-2 ${getScoreColor(attempt.scorePercentage || 0)}`}>
              {attempt.scorePercentage ? Math.round(attempt.scorePercentage) : 0}%
            </div>
            <div className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {attempt.totalScore || 0} / {attempt.maxPossibleScore || 0} points
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Started</p>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatDate(attempt.startedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatDate(attempt.completedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Award className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Duration</p>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {calculateDuration(attempt.startedAt, attempt.completedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Questions and Answers */}
      <div className="space-y-6">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Questions & Answers
        </h2>

        {questions.map((question, index) => {
          const response = responses.find(r => r.questionId === question.questionId);
          return (
            <QuestionReviewCard
              key={question.questionId}
              question={question}
              response={response}
              index={index}
              isDark={isDark}
            />
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-4 justify-center">
        {canRetake ? (
          <button
            onClick={() => navigate(`/Player/quiz/${quiz.quizId}`)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Retake Quiz
          </button>
        ) : (
          <div className="text-center">
            <button
              disabled
              className="px-6 py-3 bg-gray-400 text-gray-200 rounded-xl font-medium cursor-not-allowed opacity-60"
            >
              Retake Quiz
            </button>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Maximum attempts reached ({allAttempts.length}/{quiz.maxAttempts || '∞'})
            </p>
          </div>
        )}
        <button
          onClick={() => navigate('/Player/attempts')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            isDark
              ? 'bg-gray-800 hover:bg-gray-700 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
          }`}
        >
          View All Attempts
        </button>
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
        const blanksForFillIn = question.content.blanks || [];
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            {Array.isArray(PlayerAnswer) && PlayerAnswer.length > 0 ? (
              <div className="space-y-2">
                {PlayerAnswer.map((answer, idx) => {
                  const blank = blanksForFillIn[idx];
                  return (
                    <div key={idx}>
                      <span className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        Blank {blank?.position !== undefined ? blank.position + 1 : idx + 1}:
                      </span>
                      <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {answer || '(empty)'}
                      </span>
                      {blank?.hint && (
                        <span className={`ml-2 text-sm italic ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          (hint: {blank.hint})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={`italic ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No answers provided
              </p>
            )}
          </div>
        );

      case 'fill_in_blank_drag_drop':
        // Handle nested content structure for drag_drop questions
        const nestedContentForDisplay = question.content.content || question.content;
        const blanksData = nestedContentForDisplay.blanks || [];
        const wordBankForDisplay = nestedContentForDisplay.wordBank || nestedContentForDisplay.word_bank || [];
        
        // Handle multiple answer formats
        let selectedItemsMap = {};
        
        if (Array.isArray(PlayerAnswer)) {
          // New format: Simple array ["gte", "lte"] - matches fill_in_blank format
          PlayerAnswer.forEach((answerId, idx) => {
            if (answerId) {
              const wordItem = wordBankForDisplay.find(w => 
                w.id === answerId || 
                w.value === answerId || 
                w.label === answerId
              );
              if (wordItem) {
                selectedItemsMap[idx] = wordItem;
              }
            }
          });
        } else if (PlayerAnswer?.selectedItems) {
          // Object format: { selectedItems: { 0: {id, text}, 1: {id, text} } }
          selectedItemsMap = PlayerAnswer.selectedItems;
        } else if (PlayerAnswer?.blanks) {
          // Old format: { blanks: [{position: 1, selected_id: "add_assign"}] }
          PlayerAnswer.blanks.forEach(blank => {
            const wordItem = wordBankForDisplay.find(w => 
              w.id === blank.selected_id || 
              w.value === blank.selected_id ||
              w.label === blank.selected_id
            );
            if (wordItem) {
              selectedItemsMap[blank.position] = wordItem;
            }
          });
        }
        
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            {Object.keys(selectedItemsMap).length > 0 ? (
              <div className="space-y-2">
                {blanksData.map((blank, idx) => {
                  const selectedItem = selectedItemsMap[idx] || selectedItemsMap[blank.position];
                  return (
                    <div key={idx}>
                      <span className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        Blank {blank.position + 1}:
                      </span>
                      <span className={`ml-2 px-3 py-1 rounded ${isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                        {selectedItem?.label || selectedItem?.text || '(empty)'}
                      </span>
                      {blank.hint && (
                        <span className={`ml-2 text-sm italic ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          (hint: {blank.hint})
                        </span>
                      )}
                    </div>
                  );
                })}
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
        
        // Check if each pair is correct
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
        // Handle both formats: array of IDs directly, or object with order property
        const order = Array.isArray(PlayerAnswer) ? PlayerAnswer : (PlayerAnswer?.order || []);
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
        const fillInBlanks = question.content.blanks || [];
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
            <div className="space-y-2">
              {fillInBlanks.map((blank, idx) => {
                // Handle both accepted_answers and acceptedAnswers (snake_case and camelCase)
                const acceptedAnswers = blank.accepted_answers || blank.acceptedAnswers || [];
                return (
                  <div key={idx}>
                    <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                      Blank {blank.position !== undefined ? blank.position + 1 : idx + 1}:
                    </span>
                    <span className={`ml-2 ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                      {acceptedAnswers.length > 0 ? acceptedAnswers.join(' or ') : 'No answer specified'}
                    </span>
                    {blank.hint && (
                      <span className={`ml-2 text-sm italic ${isDark ? 'text-green-600' : 'text-green-600'}`}>
                        (hint: {blank.hint})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'fill_in_blank_drag_drop':
        // Handle nested content structure for drag_drop questions
        const nestedContent = question.content.content || question.content;
        const dragDropBlanks = nestedContent.blanks || [];
        const wordBank = nestedContent.wordBank || nestedContent.word_bank || [];
        
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
            <div className="space-y-2">
              {dragDropBlanks.map((blank, idx) => {
                // Get correct answer from accepted_answers array or correctAnswer field
                const correctAnswerIds = blank.accepted_answers || blank.acceptedAnswers || [];
                const correctAnswerId = blank.correctAnswer || correctAnswerIds[0];
                
                // Find the word from word bank by matching value or id
                const correctWord = wordBank.find(word => 
                  word.id === correctAnswerId || 
                  word.value === correctAnswerId ||
                  word.label === correctAnswerId
                );
                
                return (
                  <div key={idx}>
                    <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                      Blank {blank.position + 1}:
                    </span>
                    <span className={`ml-2 px-3 py-1 rounded ${isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800'}`}>
                      {correctWord?.label || correctWord?.text || correctAnswerId || 'No answer specified'}
                    </span>
                    {blank.hint && (
                      <span className={`ml-2 text-sm italic ${isDark ? 'text-green-600' : 'text-green-600'}`}>
                        (hint: {blank.hint})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'matching':
        const leftItems = question.content.leftItems || question.content.left_items || [];
        const rightItems = question.content.rightItems || question.content.right_items || [];
        const correctPairs = question.content.correctPairs || question.content.correct_pairs || [];
        
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
            <div className="space-y-2">
              {correctPairs.map((pair, idx) => {
                const left = leftItems.find(l => l.id === pair.left);
                const right = rightItems.find(r => r.id === pair.right);
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                      {left?.text || 'Unknown'}
                    </span>
                    <span className={isDark ? 'text-green-400' : 'text-green-600'}>→</span>
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
        const orderItems = question.content.items || [];
        const correctOrder = question.content.correctOrder || question.content.correct_order || [];
        
        return (
          <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'} border`}>
            <ol className="list-decimal list-inside space-y-1">
              {correctOrder.map((itemId, idx) => {
                const item = orderItems.find(i => i.id === itemId);
                return (
                  <li key={idx} className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                    {item?.text || 'Unknown'}
                  </li>
                );
              })}
            </ol>
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
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
              isCorrect
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {isCorrect ? <CheckCircle className="w-4 h-4 inline mr-1" /> : <XCircle className="w-4 h-4 inline mr-1" />}
              {isCorrect ? 'Correct' : 'Incorrect'}
            </span>
          </div>
          <QuestionText 
            text={question.questionText}
            isDark={isDark}
            className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
          />
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {response?.pointsEarned || 0} / {question.points}
          </div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            points
          </div>
        </div>
      </div>

      {/* Render template for fill_in_blank and fill_in_blank_drag_drop questions */}
      {(question.questionType === 'fill_in_blank' || question.questionType === 'fill_in_blank_drag_drop') && question.content.template && (
        <div className="mb-4">
          {(() => {
            const template = question.content.template;
            const codeBlockMatch = template.match(/```(\w+)?\n([\s\S]*?)```/);
            
            if (codeBlockMatch) {
              const language = codeBlockMatch[1] || '';
              const codeContent = codeBlockMatch[2];
              
              return (
                <div className={`
                  font-mono text-sm leading-relaxed p-6 rounded-lg
                  ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-900'}
                  overflow-x-auto
                `}>
                  {language && (
                    <div className={`text-xs mb-3 pb-2 border-b ${isDark ? 'text-gray-500 border-gray-700' : 'text-gray-600 border-gray-300'}`}>
                      {language}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{codeContent.replace(/___/g, '____')}</div>
                </div>
              );
            }
            
            return (
              <div className={`p-4 rounded-xl text-lg ${
                isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
              }`}>
                {template.replace(/___/g, '____')}
              </div>
            );
          })()}
        </div>
      )}

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

export default AttemptDetails;
