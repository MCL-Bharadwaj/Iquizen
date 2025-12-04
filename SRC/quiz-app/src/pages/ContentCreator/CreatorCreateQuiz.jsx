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
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Quiz JSON <span className="text-red-500">*</span>
              </label>
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
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className={`
                px-6 py-3 rounded-lg font-medium transition-colors
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
              onClick={handleBatchImport}
              disabled={batchLoading}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
                ${batchLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
                }
                text-white
              `}
            >
              <Upload className="w-5 h-5" />
              <span>{batchLoading ? 'Importing...' : 'Import Quiz'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorCreateQuiz;
