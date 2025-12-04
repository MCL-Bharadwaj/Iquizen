import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { quizApi, attemptApi, responseApi, helpers } from '../../services/api';
import OrderingQuestion from '../../components/QuestionTypes/OrderingQuestion';
import MatchingQuestion from '../../components/QuestionTypes/MatchingQuestion';
import FillInBlankDragDrop from '../../components/QuestionTypes/FillInBlankDragDrop';
import { QuestionText } from '../../components/CodeBlock';

// Helper function to shuffle array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const TakeQuiz = ({ isDark }) => {
  const { quizId, attemptId: urlAttemptId } = useParams();
  const navigate = useNavigate();
  const userId = helpers.getUserId('Player');

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [attemptCreated, setAttemptCreated] = useState(false);
  const attemptCreationInProgress = useRef(false);
  const [saving, setSaving] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const questionNavRef = useRef(null);

  useEffect(() => {
    // Only load quiz data, don't create attempt yet
    if (quizId && !quiz) {
      loadQuizData();
    }
  }, [quizId]);

  // Auto-scroll to current question in navigation
  useEffect(() => {
    if (questionNavRef.current && questions.length > 0) {
      const container = questionNavRef.current;
      const buttons = container.getElementsByTagName('button');
      if (buttons[currentQuestionIndex]) {
        buttons[currentQuestionIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentQuestionIndex, questions.length]);

  const loadQuizData = async () => {
    try {
      setLoading(true);

      // Fetch quiz details
      const quizData = await quizApi.getQuizById(quizId);
      setQuiz(quizData);

      // Fetch questions
      const questionsData = await quizApi.getQuizQuestions(quizId);
      setQuestions(questionsData.questions || []);

      // Check if attemptId is provided in URL (resuming existing attempt)
      if (urlAttemptId) {
        setAttemptId(urlAttemptId);
        setAttemptCreated(true);
        console.log('Resuming attempt from URL:', urlAttemptId);
        await loadSavedResponses(urlAttemptId, questionsData.questions || []);
      } else {
        // Check for existing in-progress attempt (to resume)
        try {
          const existingAttempts = await attemptApi.getUserAttempts(userId, 100, 0);
          const inProgressAttempt = existingAttempts?.attempts?.find(
            attempt => attempt.quizId === quizId && attempt.status === 'in_progress'
          );

          if (inProgressAttempt) {
            // Resume existing in-progress attempt
            setAttemptId(inProgressAttempt.attemptId);
            setAttemptCreated(true);
            console.log('Resuming existing attempt:', inProgressAttempt.attemptId);
            await loadSavedResponses(inProgressAttempt.attemptId, questionsData.questions || []);
          }
        } catch (attemptError) {
          console.error('Error checking existing attempts:', attemptError);
        }
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      alert('Failed to load quiz. Please try again.');
      navigate('/Player/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const ensureAttemptCreated = async () => {
    // Only create attempt if user actually starts answering
    if (attemptId || attemptCreated) {
      console.log('[ensureAttemptCreated] Attempt already exists:', attemptId);
      return attemptId;
    }

    // Prevent duplicate creation due to concurrent calls
    if (attemptCreationInProgress.current) {
      console.log('[ensureAttemptCreated] Attempt creation already in progress, waiting...');
      // Wait for the in-progress creation to complete
      let waitCount = 0;
      while (attemptCreationInProgress.current && waitCount < 50) { // Max 5 seconds
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
      console.log('[ensureAttemptCreated] Wait complete, returning attemptId:', attemptId);
      return attemptId;
    }

    try {
      attemptCreationInProgress.current = true;
      console.log('[ensureAttemptCreated] Creating new attempt for quiz:', quizId, 'user:', userId);
      const attempt = await attemptApi.startAttempt(quizId, userId, {
        startedAt: new Date().toISOString(),
      });
      setAttemptId(attempt.attemptId);
      setAttemptCreated(true);
      console.log('[ensureAttemptCreated] ✓ Created new attempt:', attempt.attemptId);
      return attempt.attemptId;
    } catch (error) {
      // Check if this is a max attempts error (silently fail)
      const isMaxAttemptsError = error?.response?.status === 400 && 
        error?.response?.data?.message?.includes('Maximum attempts');
      
      if (!isMaxAttemptsError) {
        console.error('[ensureAttemptCreated] ✗ Error creating attempt:', error);
      }
      // This error is now prevented at the quiz list level
      // Silently fail for max attempts errors
      throw error;
    } finally {
      attemptCreationInProgress.current = false;
      console.log('[ensureAttemptCreated] Released creation lock');
    }
  };

  const loadSavedResponses = async (attemptIdToLoad, questionsToCheck) => {
    try {
      console.log('[loadSavedResponses] Loading saved responses for attempt:', attemptIdToLoad);
      const responsesData = await responseApi.getAttemptResponses(attemptIdToLoad);
      
      if (responsesData?.responses && responsesData.responses.length > 0) {
        // Build answers object from saved responses
        const savedAnswers = {};
        const answeredSet = new Set();
        
        responsesData.responses.forEach(response => {
          savedAnswers[response.questionId] = {
            answer: response.answerPayload,
            metadata: null
          };
          
          // Only add to answeredSet if answer is not empty
          // This prevents skipped questions from showing orange highlight
          const hasAnswer = response.answerPayload !== null && 
                           response.answerPayload !== '' && 
                           response.answerPayload !== undefined &&
                           !(Array.isArray(response.answerPayload) && response.answerPayload.length === 0) &&
                           !(typeof response.answerPayload === 'object' && Object.keys(response.answerPayload).length === 0);
          
          if (hasAnswer) {
            answeredSet.add(response.questionId);
          }
        });
        
        setAnswers(savedAnswers);
        setAnsweredQuestions(answeredSet);
        
        // Find first unanswered question to resume from
        const firstUnanswered = questionsToCheck.findIndex(q => !answeredSet.has(q.questionId));
        if (firstUnanswered !== -1) {
          setCurrentQuestionIndex(firstUnanswered);
          console.log('[loadSavedResponses] Resuming from question index:', firstUnanswered);
        } else {
          // All questions answered, stay at last question
          setCurrentQuestionIndex(questionsToCheck.length - 1);
          console.log('[loadSavedResponses] All questions answered');
        }
        
        console.log('[loadSavedResponses] ✓ Loaded', responsesData.responses.length, 'saved responses');
      }
    } catch (error) {
      console.error('[loadSavedResponses] Error loading saved responses:', error);
      // Don't block quiz if we can't load responses
    }
  };

  const handleAnswerChange = (questionId, answer, metadata = null) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { answer, metadata },
    }));
    
    // Mark question as answered
    setAnsweredQuestions(prev => new Set(prev).add(questionId));
  };

  const prepareAnswerForSubmission = (question, answerData) => {
    if (!answerData) return null;
    
    const { answer, metadata } = answerData;
    
    // For matching and ordering, the answer is already in the correct format
    if (question.questionType === 'matching' || question.questionType === 'ordering') {
      return answer;
    }
    
    // For other question types, return the answer as-is
    return answer;
  };

  const submitAnswer = async (questionId, answerData, points) => {
    try {
      // Ensure attempt is created before submitting answer
      const currentAttemptId = await ensureAttemptCreated();
      console.log('[submitAnswer] Using attemptId:', currentAttemptId, 'for question:', questionId);
      
      const question = questions.find(q => q.questionId === questionId);
      const preparedAnswer = prepareAnswerForSubmission(question, answerData);
      
      if (preparedAnswer !== null) {
        console.log('[submitAnswer] Submitting answer to backend...');
        await responseApi.submitAnswer(currentAttemptId, questionId, preparedAnswer, points);
        console.log('[submitAnswer] ✓ Answer submitted successfully');
      }
    } catch (error) {
      // Silently fail for max attempts errors
      const isMaxAttemptsError = error?.response?.status === 400;
      if (!isMaxAttemptsError) {
        console.error('[submitAnswer] ✗ Error submitting answer:', error);
      }
    }
  };

  const submitSkippedAnswer = async (questionId, points) => {
    try {
      const currentAttemptId = await ensureAttemptCreated();
      console.log('[submitSkippedAnswer] Submitting skipped answer for question:', questionId);
      
      const question = questions.find(q => q.questionId === questionId);
      let emptyAnswer = null;
      
      // Create appropriate empty answer based on question type
      switch (question.questionType) {
        case 'multiple_choice_single':
          emptyAnswer = '';
          break;
        case 'multiple_choice_multi':
          emptyAnswer = [];
          break;
        case 'fill_in_blank':
          emptyAnswer = [];
          break;
        case 'matching':
        case 'ordering':
          emptyAnswer = [];
          break;
        case 'fill_in_blank_drag_drop':
          emptyAnswer = {};
          break;
        default:
          emptyAnswer = '';
      }
      
      await responseApi.submitAnswer(currentAttemptId, questionId, emptyAnswer, points);
      console.log('[submitSkippedAnswer] ✓ Skipped answer recorded');
    } catch (error) {
      const isMaxAttemptsError = error?.response?.status === 400;
      if (!isMaxAttemptsError) {
        console.error('[submitSkippedAnswer] ✗ Error submitting skipped answer:', error);
      }
    }
  };

  const saveCurrentAnswer = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const answerData = answers[currentQuestion.questionId];

    if (!answerData) {
      alert('Please answer the current question before saving.');
      return false;
    }

    try {
      setSaving(true);
      await submitAnswer(currentQuestion.questionId, answerData, currentQuestion.points);
      console.log('[saveCurrentAnswer] ✓ Answer saved successfully');
      return true;
    } catch (error) {
      console.error('[saveCurrentAnswer] ✗ Error saving answer:', error);
      alert('Failed to save answer. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const answerData = answers[currentQuestion.questionId];

    // If question is unanswered, submit empty answer (skip without confirmation)
    if (!answerData) {
      setSaving(true);
      try {
        await submitSkippedAnswer(currentQuestion.questionId, currentQuestion.points);
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        }
      } catch (error) {
        console.error('[handleNext] Error submitting skipped answer:', error);
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        }
      } finally {
        setSaving(false);
      }
      return;
    }

    // Auto-save on navigation when answered
    setSaving(true);
    try {
      await submitAnswer(currentQuestion.questionId, answerData, currentQuestion.points);
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error('[handleNext] Error saving answer:', error);
      // Continue navigation even if save fails
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!window.confirm('Are you sure you want to submit the quiz? You cannot change answers after submission.')) {
      return;
    }

    try {
      setSubmitting(true);

      // Ensure attempt exists before completing
      const currentAttemptId = await ensureAttemptCreated();
      
      console.log('[handleSubmitQuiz] ========== SUBMITTING QUIZ ==========');
      console.log('[handleSubmitQuiz] Current attemptId:', currentAttemptId);
      console.log('[handleSubmitQuiz] State attemptId:', attemptId);

      if (!currentAttemptId) {
        throw new Error('No attempt ID available');
      }

      // Submit any remaining answers
      const currentQuestion = questions[currentQuestionIndex];
      const answerData = answers[currentQuestion.questionId];
      if (answerData) {
        console.log('[handleSubmitQuiz] Submitting final answer for question:', currentQuestion.questionId);
        await submitAnswer(currentQuestion.questionId, answerData, currentQuestion.points);
      }

      // Complete attempt
      console.log('[handleSubmitQuiz] Calling completeAttempt for:', currentAttemptId);
      const completedAttempt = await attemptApi.completeAttempt(currentAttemptId);
      console.log('[handleSubmitQuiz] ✓ Attempt completed:', completedAttempt);
      console.log('[handleSubmitQuiz] Score:', completedAttempt.totalScore, '/', completedAttempt.maxPossibleScore, '=', completedAttempt.scorePercentage, '%');
      setResult(completedAttempt);
      setSubmitted(true);
    } catch (error) {
      // Silently fail for max attempts errors
      const isMaxAttemptsError = error?.response?.status === 400;
      if (!isMaxAttemptsError) {
        console.error('[handleSubmitQuiz] ✗ Error submitting quiz:', error);
        alert('Failed to submit quiz. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className={`w-12 h-12 animate-spin mx-auto mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-8 shadow-lg text-center`}>
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Quiz Completed!
          </h1>
          <p className={`text-lg mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Great job completing the quiz. Your score:
          </p>
          <div className="mb-8">
            <div className={`text-6xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {result.scorePercentage ? Math.round(result.scorePercentage) : 0}%
            </div>
            <div className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {result.totalScore || 0} / {result.maxPossibleScore || 0} points
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/Player/attempts')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              View All Attempts
            </button>
            <button
              onClick={() => navigate('/Player/quizzes')}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
            >
              Take Another Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className={`rounded-2xl ${isDark ? 'bg-red-950 border-red-900' : 'bg-red-50 border-red-200'} border-2 p-8`}>
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            No Questions Available
          </h2>
          <p className={`mb-4 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
            This quiz doesn't have any questions yet.
          </p>
          <button
            onClick={() => navigate('/Player/quizzes')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleQuestionClick = (index) => {
    setCurrentQuestionIndex(index);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {quiz?.title}
        </h1>
        
        {/* Question Grid Navigation */}
        <div className="mb-4">
          <div className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Questions ({answeredQuestions.size} / {questions.length} answered)
          </div>
          <div className="flex items-center gap-2">
            {/* Left Arrow */}
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                currentQuestionIndex === 0
                  ? 'opacity-30 cursor-not-allowed'
                  : isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
              title="Previous question"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Question Numbers - Scrollable Container */}
            <div ref={questionNavRef} className="flex-1 overflow-x-auto hide-scrollbar">
              <div className="flex gap-2 transition-all duration-300">
                {questions.map((q, index) => {
                  const isAnswered = answeredQuestions.has(q.questionId);
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={q.questionId}
                      onClick={() => handleQuestionClick(index)}
                      className={`
                        flex-shrink-0 w-12 h-12 rounded-lg font-semibold text-sm transition-all duration-200
                        ${isCurrent 
                          ? 'border-2 border-blue-500 shadow-lg' 
                          : ''
                        }
                        ${isAnswered
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : isDark
                          ? 'bg-gray-800 text-white border-2 border-gray-600 hover:bg-gray-700'
                          : 'bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50'
                        }
                      `}
                      title={`Question ${index + 1}${isAnswered ? ' (answered)' : ' (unanswered)'}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Arrow */}
            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                currentQuestionIndex === questions.length - 1
                  ? 'opacity-30 cursor-not-allowed'
                  : isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
              title="Next question"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <style jsx>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .hide-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </div>
      </div>

      {/* Question Card */}
      <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-8 shadow-lg mb-6`}>
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <QuestionText 
                text={currentQuestion.questionText}
                isDark={isDark}
                className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
              />
            </div>
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
              {currentQuestion.points} points
            </span>
          </div>
        </div>

        {/* Render question based on type */}
        <QuestionRenderer
          question={currentQuestion}
          answer={answers[currentQuestion.questionId]}
          onChange={(answer) => handleAnswerChange(currentQuestion.questionId, answer)}
          isDark={isDark}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
            currentQuestionIndex === 0
              ? 'opacity-50 cursor-not-allowed'
              : isDark
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>
        
        <button
          onClick={saveCurrentAnswer}
          disabled={saving}
          className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
            saving
              ? 'opacity-50 cursor-not-allowed'
              : isDark
              ? 'bg-purple-700 hover:bg-purple-600 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save
            </>
          )}
        </button>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Submit Quiz
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={saving}
            className={`px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2 ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {saving ? 'Saving...' : 'Next'}
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

// Question Renderer Component
const QuestionRenderer = ({ question, answer, onChange, isDark }) => {
  switch (question.questionType) {
    case 'multiple_choice_single':
      return (
        <div className="space-y-3">
          {question.content.options.map((option) => (
            <label
              key={option.id}
              className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                answer?.answer === option.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : isDark
                  ? 'border-gray-700 hover:border-gray-600 bg-gray-700/50'
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name={question.questionId}
                value={option.id}
                checked={answer?.answer === option.id}
                onChange={(e) => onChange(e.target.value)}
                className="w-5 h-5 text-blue-600"
              />
              <span className={`ml-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {option.text}
              </span>
            </label>
          ))}
        </div>
      );

    case 'multiple_choice_multi':
      return (
        <div className="space-y-3">
          {question.content.options.map((option) => (
            <label
              key={option.id}
              className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                answer?.answer?.includes(option.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : isDark
                  ? 'border-gray-700 hover:border-gray-600 bg-gray-700/50'
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                value={option.id}
                checked={answer?.answer?.includes(option.id) || false}
                onChange={(e) => {
                  const currentAnswers = answer?.answer || [];
                  if (e.target.checked) {
                    onChange([...currentAnswers, option.id]);
                  } else {
                    onChange(currentAnswers.filter(id => id !== option.id));
                  }
                }}
                className="w-5 h-5 text-blue-600"
              />
              <span className={`ml-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {option.text}
              </span>
            </label>
          ))}
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Select all that apply
          </p>
        </div>
      );

    case 'fill_in_blank':
      return (
        <div className="space-y-4">
          {question.content.blanks.map((blank, index) => (
            <div key={index} className="space-y-2">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Blank {index + 1}: {blank.hint}
              </label>
              <input
                type="text"
                value={answer?.answer?.[index] || ''}
                onChange={(e) => {
                  const newAnswers = answer?.answer || [];
                  newAnswers[index] = e.target.value;
                  onChange([...newAnswers]);
                }}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                placeholder={`Enter answer for blank ${index + 1}`}
              />
            </div>
          ))}
        </div>
      );

    case 'matching':
      return (
        <MatchingQuestion
          question={question}
          answer={answer}
          onChange={onChange}
          isDark={isDark}
        />
      );

    case 'ordering':
      return (
        <OrderingQuestion
          question={question}
          answer={answer}
          onChange={onChange}
          isDark={isDark}
        />
      );

    case 'fill_in_blank_drag_drop':
      return (
        <FillInBlankDragDrop
          question={question}
          answer={answer}
          onChange={onChange}
          isDark={isDark}
        />
      );

    default:
      return (
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Question type not supported: {question.questionType}
          </p>
        </div>
      );
  }
};

export default TakeQuiz;
