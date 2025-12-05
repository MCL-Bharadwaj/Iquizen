import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizApi } from '../../services/api';
import { ArrowLeft, Save, X, Upload, FileJson } from 'lucide-react';

const CreatorCreateQuiz = ({ isDark }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'batch'

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    difficulty: 'medium',
    estimatedMinutes: 30,
    ageMin: 8,
    ageMax: 15,
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Batch import state
  const [quizJson, setQuizJson] = useState('');
  const [questionsJson, setQuestionsJson] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchErrors, setBatchErrors] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'estimatedMinutes' || name === 'ageMin' || name === 'ageMax'
        ? parseInt(value) || 0
        : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (formData.ageMin > formData.ageMax) {
      newErrors.ageRange = 'Minimum age must be less than or equal to maximum age';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const quizData = {
        ...formData,
        tags: formData.tags.length > 0 ? formData.tags : null,
      };
      
      const response = await quizApi.createQuiz(quizData);
      
      // Navigate to the question management page
      navigate(`/creator/quiz/${response.quizId}/questions`);
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Failed to create quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/creator/dashboard');
  };

  const handleEdit = () => {
    try {
      // Parse questions JSON
      const questions = JSON.parse(questionsJson);
      if (!Array.isArray(questions)) {
        setBatchErrors(prev => ({ ...prev, questions: 'Questions must be an array' }));
        return;
      }
      setParsedQuestions(questions);
      setEditMode(true);
      setBatchErrors({});
    } catch (e) {
      setBatchErrors(prev => ({ ...prev, questions: 'Invalid JSON format for questions' }));
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...parsedQuestions];
    if (field.includes('.')) {
      // Handle nested fields like content.correctAnswer
      const [parent, child] = field.split('.');
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        [parent]: {
          ...updatedQuestions[index][parent],
          [child]: value
        }
      };
    } else {
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        [field]: value
      };
    }
    setParsedQuestions(updatedQuestions);
    // Update the JSON textarea
    setQuestionsJson(JSON.stringify(updatedQuestions, null, 2));
  };

  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    const updatedQuestions = [...parsedQuestions];
    const options = [...(updatedQuestions[questionIndex].content?.options || [])];
    options[optionIndex] = {
      ...options[optionIndex],
      [field]: value
    };
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      content: {
        ...updatedQuestions[questionIndex].content,
        options
      }
    };
    setParsedQuestions(updatedQuestions);
    // Update the JSON textarea
    setQuestionsJson(JSON.stringify(updatedQuestions, null, 2));
  };

  const handleAddOption = (questionIndex) => {
    const updatedQuestions = [...parsedQuestions];
    const options = [...(updatedQuestions[questionIndex].content?.options || [])];
    options.push({ value: '', label: '' });
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      content: {
        ...updatedQuestions[questionIndex].content,
        options
      }
    };
    setParsedQuestions(updatedQuestions);
    setQuestionsJson(JSON.stringify(updatedQuestions, null, 2));
  };

  const handleRemoveOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...parsedQuestions];
    const options = [...(updatedQuestions[questionIndex].content?.options || [])];
    options.splice(optionIndex, 1);
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      content: {
        ...updatedQuestions[questionIndex].content,
        options
      }
    };
    setParsedQuestions(updatedQuestions);
    setQuestionsJson(JSON.stringify(updatedQuestions, null, 2));
  };

  const handleBatchImport = async () => {
    setBatchLoading(true);
    setBatchErrors({});

    try {
      // Validate and parse JSON
      let quizData;
      let questionsData;

      try {
        quizData = JSON.parse(quizJson);
      } catch (e) {
        setBatchErrors(prev => ({ ...prev, quiz: 'Invalid JSON format for quiz' }));
        setBatchLoading(false);
        return;
      }

      try {
        questionsData = JSON.parse(questionsJson);
        if (!Array.isArray(questionsData)) {
          throw new Error('Questions must be an array');
        }
      } catch (e) {
        setBatchErrors(prev => ({ ...prev, questions: 'Invalid JSON format for questions (must be an array)' }));
        setBatchLoading(false);
        return;
      }

      // Send batch import request
      const response = await quizApi.batchImport({ quiz: quizData, questions: questionsData });

      if (response.success) {
        navigate('/creator/quizzes');
      }
    } catch (error) {
      console.error('Batch import error:', error);
      setBatchErrors({ 
        general: error.response?.data?.message || 'Failed to import quiz and questions' 
      });
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleCancel}
          className={`
            flex items-center gap-2 mb-4 px-4 py-2 rounded-lg transition-colors
            ${isDark 
              ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }
          `}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Create New Quiz
        </h1>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Fill in the details to create a new quiz
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={`flex border-b mb-6 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeTab === 'manual'
              ? `border-b-2 border-blue-600 ${isDark ? 'text-blue-400' : 'text-blue-600'}`
              : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Manual Entry
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('batch')}
          className={`px-6 py-3 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'batch'
              ? `border-b-2 border-blue-600 ${isDark ? 'text-blue-400' : 'text-blue-600'}`
              : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          Batch Import
        </button>
      </div>

      {/* Manual Entry Form */}
      {activeTab === 'manual' && (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`
          p-6 rounded-lg space-y-6
          ${isDark ? 'bg-gray-800' : 'bg-white shadow'}
        `}>
          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter quiz title"
              className={`
                w-full px-4 py-2 rounded-lg border transition-colors
                ${isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                }
                ${errors.title ? 'border-red-500' : ''}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20
              `}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Enter quiz description"
              className={`
                w-full px-4 py-2 rounded-lg border transition-colors resize-none
                ${isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500/20
              `}
            />
          </div>

          {/* Subject and Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g., Python, Mathematics"
                className={`
                  w-full px-4 py-2 rounded-lg border transition-colors
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20
                `}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Difficulty
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className={`
                  w-full px-4 py-2 rounded-lg border transition-colors cursor-pointer
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20
                `}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Age Range and Estimated Minutes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Min Age
              </label>
              <input
                type="number"
                name="ageMin"
                value={formData.ageMin}
                onChange={handleChange}
                min="3"
                max="18"
                className={`
                  w-full px-4 py-2 rounded-lg border transition-colors
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  }
                  ${errors.ageRange ? 'border-red-500' : ''}
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20
                `}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Max Age
              </label>
              <input
                type="number"
                name="ageMax"
                value={formData.ageMax}
                onChange={handleChange}
                min="3"
                max="18"
                className={`
                  w-full px-4 py-2 rounded-lg border transition-colors
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  }
                  ${errors.ageRange ? 'border-red-500' : ''}
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20
                `}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Est. Minutes
              </label>
              <input
                type="number"
                name="estimatedMinutes"
                value={formData.estimatedMinutes}
                onChange={handleChange}
                min="1"
                className={`
                  w-full px-4 py-2 rounded-lg border transition-colors
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20
                `}
              />
            </div>
          </div>
          {errors.ageRange && <p className="text-red-500 text-sm -mt-4">{errors.ageRange}</p>}

          {/* Tags */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag and press Enter"
                className={`
                  flex-1 px-4 py-2 rounded-lg border transition-colors
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20
                `}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`
                      inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm
                      ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}
                    `}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className={`
              px-6 py-3 rounded-lg font-medium transition-colors
              ${isDark 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
              ${loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
              }
              text-white
            `}
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Creating...' : 'Create Quiz'}</span>
          </button>
        </div>
      </form>
      )}

      {/* Batch Import Form */}
      {activeTab === 'batch' && (
        <div className="space-y-6">
          <div className={`
            p-6 rounded-lg space-y-6
            ${isDark ? 'bg-gray-800' : 'bg-white shadow'}
          `}>
            {/* Info Box */}
            <div className={`
              p-4 rounded-lg border flex items-start gap-3
              ${isDark ? 'bg-blue-900/20 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'}
            `}>
              <FileJson className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Batch Import Instructions</p>
                <p>Enter valid JSON for the quiz and questions. Existing questions (by questionId) will be reused, new ones will be created.</p>
              </div>
            </div>

            {/* General Error */}
            {batchErrors.general && (
              <div className={`
                p-4 rounded-lg border flex items-start gap-3
                ${isDark ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-800'}
              `}>
                <p className="text-sm">{batchErrors.general}</p>
              </div>
            )}

            {/* Quiz JSON */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Quiz JSON <span className="text-red-500">*</span>
                </label>
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className={`
                      px-4 py-2 rounded-lg font-medium transition-colors text-sm
                      ${isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }
                    `}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className={`
                      px-4 py-2 rounded-lg font-medium transition-colors text-sm
                      ${isDark 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }
                    `}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchImport}
                    disabled={batchLoading}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm
                      ${batchLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                      }
                      text-white
                    `}
                  >
                    <Upload className="w-4 h-4" />
                    <span>{batchLoading ? 'Importing...' : 'Import Quiz'}</span>
                  </button>
                </div>
              </div>
              <textarea
                value={quizJson}
                onChange={(e) => setQuizJson(e.target.value)}
                placeholder={`{\n  "title": "Sample Quiz",\n  "description": "Quiz description",\n  "subject": "Mathematics",\n  "difficulty": "medium",\n  "ageMin": 12,\n  "ageMax": 15,\n  "estimatedMinutes": 10,\n  "tags": ["math", "algebra"]\n}`}
                rows={8}
                className={`
                  w-full px-4 py-2 rounded-lg border transition-colors font-mono text-sm
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }
                `}
              />
              {batchErrors.quiz && (
                <p className="mt-1 text-sm text-red-500">{batchErrors.quiz}</p>
              )}
            </div>

            {/* Questions JSON Array */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Questions JSON Array <span className="text-red-500">*</span>
              </label>
              <textarea
                value={questionsJson}
                onChange={(e) => setQuestionsJson(e.target.value)}
                placeholder={`[\n  {\n    "questionText": "What is 2+2?",\n    "questionType": "multiple_choice_single",\n    "difficulty": "easy",\n    "points": 10,\n    "content": {\n      "options": [\n        { "value": "3", "label": "3" },\n        { "value": "4", "label": "4" }\n      ],\n      "correctAnswer": "4"\n    }\n  }\n]`}
                rows={12}
                className={`
                  w-full px-4 py-2 rounded-lg border transition-colors font-mono text-sm
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }
                `}
              />
              {batchErrors.questions && (
                <p className="mt-1 text-sm text-red-500">{batchErrors.questions}</p>
              )}
            </div>

            {/* Parsed Questions Editor */}
            {editMode && parsedQuestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Edit Questions ({parsedQuestions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className={`text-sm px-3 py-1 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                  >
                    Hide Editor
                  </button>
                </div>

                {parsedQuestions.map((question, qIndex) => (
                  <div
                    key={qIndex}
                    className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="space-y-4">
                      {/* Question Header */}
                      <div className="flex items-start justify-between">
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Question {qIndex + 1}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                          {question.questionType}
                        </span>
                      </div>

                      {/* Question Text */}
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Question Text
                        </label>
                        <textarea
                          value={question.questionText || ''}
                          onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                          rows={2}
                          className={`w-full px-3 py-2 rounded-lg border text-sm ${
                            isDark
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                      </div>

                      {/* Question Metadata */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Difficulty
                          </label>
                          <select
                            value={question.difficulty || 'medium'}
                            onChange={(e) => handleQuestionChange(qIndex, 'difficulty', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border text-sm ${
                              isDark
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Points
                          </label>
                          <input
                            type="number"
                            value={question.points || 10}
                            onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value) || 0)}
                            className={`w-full px-3 py-2 rounded-lg border text-sm ${
                              isDark
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Correct Answer
                          </label>
                          <input
                            type="text"
                            value={question.content?.correctAnswer || ''}
                            onChange={(e) => handleQuestionChange(qIndex, 'content.correctAnswer', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border text-sm ${
                              isDark
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Options */}
                      {question.content?.options && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              Options
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAddOption(qIndex)}
                              className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                            >
                              + Add Option
                            </button>
                          </div>
                          <div className="space-y-2">
                            {question.content.options.map((option, oIndex) => (
                              <div key={oIndex} className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Value"
                                  value={option.value || ''}
                                  onChange={(e) => handleOptionChange(qIndex, oIndex, 'value', e.target.value)}
                                  className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                                    isDark
                                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                  }`}
                                />
                                <input
                                  type="text"
                                  placeholder="Label"
                                  value={option.label || ''}
                                  onChange={(e) => handleOptionChange(qIndex, oIndex, 'label', e.target.value)}
                                  className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                                    isDark
                                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(qIndex, oIndex)}
                                  className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorCreateQuiz;
