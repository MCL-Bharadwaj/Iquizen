import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Save, Calendar, Hash, FileText } from 'lucide-react';
import { assignmentApi, quizApi } from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditAssignment = ({ isDark }) => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [quiz, setQuiz] = useState(null);
  
  const [formData, setFormData] = useState({
    dueDate: '',
    maxAttempts: '',
    maxAge: '',
    notes: ''
  });

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

      // Populate form with existing data
      setFormData({
        dueDate: assignmentData.dueDate ? new Date(assignmentData.dueDate).toISOString().slice(0, 16) : '',
        maxAttempts: assignmentData.maxAttempts || '',
        maxAge: assignmentData.maxAge || '',
        notes: assignmentData.notes || ''
      });
    } catch (error) {
      console.error('Error fetching assignment data:', error);
      toast.error('Failed to load assignment details');
      navigate('/creator/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);

      const updateData = {
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        maxAttempts: formData.maxAttempts ? parseInt(formData.maxAttempts) : null,
        maxAge: formData.maxAge ? parseInt(formData.maxAge) : null,
        notes: formData.notes || null
      };

      await assignmentApi.updateAssignment(assignmentId, updateData);
      toast.success('Assignment updated successfully!');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/creator/assignments');
      }, 1500);
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Failed to update assignment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/creator/assignments');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className={`w-12 h-12 animate-spin mx-auto mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment || !quiz) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className={`rounded-2xl ${isDark ? 'bg-red-950 border-red-900' : 'bg-red-50 border-red-200'} border-2 p-8`}>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            Assignment Not Found
          </h2>
          <p className={`mb-4 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
            The assignment you're trying to edit doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => navigate('/creator/assignments')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <ToastContainer />
      
      {/* Back Button */}
      <button
        onClick={handleCancel}
        className={`mb-6 px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
          isDark
            ? 'bg-gray-800 hover:bg-gray-700 text-white'
            : 'bg-white hover:bg-gray-50 text-gray-900'
        } shadow-md`}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Assignments
      </button>

      {/* Header */}
      <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-8 shadow-lg mb-6`}>
        <h1 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Edit Assignment
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Quiz</p>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {quiz.title}
            </p>
          </div>
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Player</p>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {assignment.userFirstName && assignment.userLastName
                ? `${assignment.userFirstName} ${assignment.userLastName}`
                : assignment.userId}
            </p>
            {assignment.userEmail && (
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{assignment.userEmail}</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-8 shadow-lg`}>
        <div className="space-y-6">
          {/* Due Date */}
          <div>
            <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <Calendar className="w-4 h-4" />
              Due Date
            </label>
            <input
              type="datetime-local"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                  : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
              } focus:outline-none`}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Leave empty for no due date
            </p>
          </div>

          {/* Max Attempts */}
          <div>
            <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <Hash className="w-4 h-4" />
              Maximum Attempts
            </label>
            <input
              type="number"
              name="maxAttempts"
              value={formData.maxAttempts}
              onChange={handleChange}
              min="1"
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                  : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
              } focus:outline-none`}
              placeholder="e.g., 3"
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Leave empty for unlimited attempts
            </p>
          </div>

          {/* Max Age */}
          <div>
            <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <Hash className="w-4 h-4" />
              Maximum Age (hours)
            </label>
            <input
              type="number"
              name="maxAge"
              value={formData.maxAge}
              onChange={handleChange}
              min="1"
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                  : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
              } focus:outline-none`}
              placeholder="e.g., 24"
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Maximum hours allowed to complete the quiz from start. Leave empty for no time limit.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <FileText className="w-4 h-4" />
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                  : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
              } focus:outline-none resize-none`}
              placeholder="Add any additional notes or instructions..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              saving
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAssignment;
