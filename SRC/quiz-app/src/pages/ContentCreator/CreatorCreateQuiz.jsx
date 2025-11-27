import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizApi } from '../../services/api';
import { ArrowLeft, Save, X } from 'lucide-react';

const CreatorCreateQuiz = ({ isDark }) => {
  const navigate = useNavigate();

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

      {/* Form */}
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
    </div>
  );
};

export default CreatorCreateQuiz;
