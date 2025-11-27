import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quizApi, questionApi } from '../../services/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Save,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const CreatorManageQuestions = ({ isDark }) => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    fetchQuizAndQuestions();
  }, [quizId]);

  const fetchQuizAndQuestions = async () => {
    setLoading(true);
    try {
      const [quizResponse, questionsResponse] = await Promise.all([
        quizApi.getQuizById(quizId),
        quizApi.getQuizQuestions(quizId),
      ]);
      setQuiz(quizResponse);
      setQuestions(questionsResponse.questions || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = () => {
    setEditingQuestion(null);
    setShowCreateForm(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setShowCreateForm(true);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await questionApi.deleteQuestion(questionId);
        fetchQuizAndQuestions();
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question');
      }
    }
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingQuestion(null);
  };

  const handleQuestionSaved = () => {
    fetchQuizAndQuestions();
    handleCloseForm();
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      multiple_choice_single: 'Multiple Choice (Single)',
      multiple_choice_multi: 'Multiple Choice (Multi)',
      fill_in_blank: 'Fill in the Blank',
      fill_in_blank_drag_drop: 'Fill in Blank (Drag & Drop)',
      ordering: 'Ordering',
      matching: 'Matching',
      program_submission: 'Program Submission',
      short_answer: 'Short Answer',
    };
    return labels[type] || type;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className={`
            flex items-center gap-2 mb-4 px-4 py-2 rounded-lg transition-colors
            ${isDark 
              ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }
          `}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quizzes</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {quiz?.title || 'Quiz Questions'}
            </h1>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {quiz?.description || 'Manage questions for this quiz'}
            </p>
            <div className="mt-2 flex gap-4 text-sm">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                <strong>Questions:</strong> {questions.length}
              </span>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                <strong>Total Points:</strong> {questions.reduce((sum, q) => sum + (q.points || 0), 0)}
              </span>
            </div>
          </div>
          <button
            onClick={handleCreateQuestion}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Add Question</span>
          </button>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading questions...
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div className={`
          text-center py-16 rounded-lg
          ${isDark ? 'bg-gray-800' : 'bg-white shadow'}
        `}>
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            No questions yet
          </h3>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Add your first question to get started
          </p>
          <button
            onClick={handleCreateQuestion}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add First Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.questionId}
              question={question}
              index={index}
              isDark={isDark}
              onEdit={handleEditQuestion}
              onDelete={handleDeleteQuestion}
              getQuestionTypeLabel={getQuestionTypeLabel}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Question Modal/Form */}
      {showCreateForm && (
        <QuestionForm
          quizId={quizId}
          question={editingQuestion}
          isDark={isDark}
          onClose={handleCloseForm}
          onSave={handleQuestionSaved}
        />
      )}
    </div>
  );
};

// Question Card Component
const QuestionCard = ({ question, index, isDark, onEdit, onDelete, getQuestionTypeLabel }) => {
  const [expanded, setExpanded] = useState(false);

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

  return (
    <div className={`
      rounded-lg overflow-hidden transition-all
      ${isDark ? 'bg-gray-800' : 'bg-white shadow'}
    `}>
      <div className="p-6">
        {/* Question Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`
                px-3 py-1 rounded-full text-sm font-bold
                ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}
              `}>
                Q{index + 1}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                {question.difficulty || 'Medium'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                {getQuestionTypeLabel(question.questionType)}
              </span>
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {question.questionText}
            </h3>
            <div className="flex gap-4 text-sm">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                <strong>Points:</strong> {question.points || 10}
              </span>
              {question.estimatedSeconds && (
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  <strong>Time:</strong> {Math.floor(question.estimatedSeconds / 60)}m {question.estimatedSeconds % 60}s
                </span>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className={`
                p-2 rounded-lg transition-colors
                ${isDark 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            <button
              onClick={() => onEdit(question)}
              className={`
                p-2 rounded-lg transition-colors
                ${isDark 
                  ? 'hover:bg-blue-600/20 text-blue-400' 
                  : 'hover:bg-blue-100 text-blue-600'
                }
              `}
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(question.questionId)}
              className={`
                p-2 rounded-lg transition-colors
                ${isDark 
                  ? 'hover:bg-red-600/20 text-red-400' 
                  : 'hover:bg-red-100 text-red-600'
                }
              `}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expanded Content Preview */}
        {expanded && (
          <div className={`
            mt-4 p-4 rounded-lg border
            ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}
          `}>
            <pre className={`text-sm overflow-auto ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {JSON.stringify(question.content, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// Question Form Component (simplified - will be enhanced later)
const QuestionForm = ({ quizId, question, isDark, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    questionType: question?.questionType || 'multiple_choice_single',
    questionText: question?.questionText || '',
    difficulty: question?.difficulty || 'medium',
    points: question?.points || 10,
    estimatedSeconds: question?.estimatedSeconds || 60,
    subject: question?.subject || '',
    content: question?.content || {},
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'points' || name === 'estimatedSeconds'
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let savedQuestion;
      if (question) {
        // Update existing question
        console.log('[QuestionForm] Updating question:', question.questionId);
        savedQuestion = await questionApi.updateQuestion(question.questionId, formData);
        console.log('[QuestionForm] Question updated:', savedQuestion);
      } else {
        // Create new question
        console.log('[QuestionForm] Creating question for quiz:', quizId);
        savedQuestion = await questionApi.createQuestion(formData);
        console.log('[QuestionForm] Question created:', savedQuestion);
        
        // Add question to quiz
        console.log('[QuestionForm] Adding question to quiz:', {
          quizId,
          questionId: savedQuestion.questionId
        });
        const linkResult = await questionApi.addQuestionToQuiz(quizId, savedQuestion.questionId);
        console.log('[QuestionForm] Question linked to quiz:', linkResult);
      }
      onSave();
    } catch (error) {
      console.error('[QuestionForm] Error saving question:', error);
      console.error('[QuestionForm] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert(`Failed to save question: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`
        max-w-4xl w-full max-h-[90vh] overflow-auto rounded-lg
        ${isDark ? 'bg-gray-800' : 'bg-white'}
      `}>
        <div className={`
          sticky top-0 p-6 border-b flex items-center justify-between
          ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        `}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {question ? 'Edit Question' : 'Create Question'}
          </h2>
          <button
            onClick={onClose}
            className={`
              p-2 rounded-lg transition-colors
              ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}
            `}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Question Type */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Question Type
            </label>
            <select
              name="questionType"
              value={formData.questionType}
              onChange={handleChange}
              className={`
                w-full px-4 py-2 rounded-lg border transition-colors
                ${isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
                }
              `}
            >
              <option value="multiple_choice_single">Multiple Choice (Single Answer)</option>
              <option value="multiple_choice_multi">Multiple Choice (Multiple Answers)</option>
              <option value="fill_in_blank">Fill in the Blank</option>
              <option value="fill_in_blank_drag_drop">Fill in Blank (Drag & Drop)</option>
              <option value="ordering">Ordering</option>
              <option value="matching">Matching</option>
              <option value="program_submission">Program Submission</option>
              <option value="short_answer">Short Answer</option>
            </select>
          </div>

          {/* Question Text */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Question Text <span className="text-red-500">*</span>
            </label>
            <textarea
              name="questionText"
              value={formData.questionText}
              onChange={handleChange}
              rows={4}
              required
              placeholder="Enter the question"
              className={`
                w-full px-4 py-2 rounded-lg border transition-colors resize-none
                ${isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }
              `}
            />
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Difficulty
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className={`
                  w-full px-4 py-2 rounded-lg border
                  ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                `}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Points
              </label>
              <input
                type="number"
                name="points"
                value={formData.points}
                onChange={handleChange}
                min="0"
                step="0.5"
                className={`
                  w-full px-4 py-2 rounded-lg border
                  ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                `}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Time (seconds)
              </label>
              <input
                type="number"
                name="estimatedSeconds"
                value={formData.estimatedSeconds}
                onChange={handleChange}
                min="1"
                className={`
                  w-full px-4 py-2 rounded-lg border
                  ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                `}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g., Python"
                className={`
                  w-full px-4 py-2 rounded-lg border
                  ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                `}
              />
            </div>
          </div>

          {/* Content (to be enhanced with type-specific forms) */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Question Content (JSON)
            </label>
            <textarea
              value={JSON.stringify(formData.content, null, 2)}
              onChange={(e) => {
                try {
                  setFormData((prev) => ({ ...prev, content: JSON.parse(e.target.value) }));
                } catch (err) {
                  // Invalid JSON, ignore
                }
              }}
              rows={10}
              className={`
                w-full px-4 py-2 rounded-lg border font-mono text-sm resize-none
                ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
              `}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Note: Enhanced question type editors will be added in the next phase
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className={`
                px-6 py-3 rounded-lg font-medium transition-colors
                ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
              `}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
                ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                text-white
              `}
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Saving...' : question ? 'Update Question' : 'Create Question'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatorManageQuestions;
