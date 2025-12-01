import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Clock, 
  Plus,
  UserPlus,
  Target,
  Search,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { quizApi, assignmentApi, playerApi } from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

const CreatorAssignments = ({ isDark }) => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quizFilter, setQuizFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, [currentPage, statusFilter, quizFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAssignments(),
        fetchQuizzes(),
        fetchPlayers()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const quizId = quizFilter !== 'all' ? quizFilter : null;
      const status = statusFilter !== 'all' ? statusFilter : null;
      const response = await assignmentApi.getAllAssignments(currentPage, pageSize, quizId, null, status);
      setAssignments(response.assignments || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await quizApi.getQuizzes();
      setQuizzes(response.data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await playerApi.getAllPlayers(1, 100); // Get all players for assignment
      setPlayers(response.players || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      await assignmentApi.deleteAssignment(assignmentId);
      toast.success('Assignment deleted successfully');
      fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'overdue':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.quizTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.userId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Loading assignments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Quiz Assignments</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage quiz assignments for players
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 border rounded-lg ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-3 py-2 border rounded-lg ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="all">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={quizFilter}
                onChange={(e) => setQuizFilter(e.target.value)}
                className={`px-3 py-2 border rounded-lg ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="all">All Quizzes</option>
                {quizzes.map((quiz) => (
                  <option key={quiz.quizId} value={quiz.quizId}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Create Assignment Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Assignment
          </button>
        </div>

        {/* Assignments Table */}
        <div className={`rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quiz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.assignmentId} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BookOpen className="w-5 h-5 text-blue-500 mr-3" />
                        <div>
                          <div className="text-sm font-medium">
                            {assignment.quizTitle}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {assignment.subject} • {assignment.difficulty}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-gray-400 mr-2" />
                        <div className="text-sm">
                          {assignment.userId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(assignment.status)}
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                          {assignment.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {assignment.dueDate ? (
                        <div>
                          {new Date(assignment.dueDate).toLocaleDateString()}
                          {assignment.hoursUntilDue !== null && (
                            <div className={`text-xs ${assignment.hoursUntilDue < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                              {assignment.hoursUntilDue < 0 
                                ? `${Math.abs(assignment.hoursUntilDue).toFixed(0)}h overdue`
                                : `${assignment.hoursUntilDue.toFixed(0)}h remaining`
                              }
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No due date</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        {assignment.maxAttempts ? (
                          <span>{assignment.attemptsUsed}/{assignment.maxAttempts} attempts</span>
                        ) : (
                          <span>{assignment.attemptsUsed} attempts</span>
                        )}
                        {assignment.score !== null && (
                          <div className="text-xs text-green-600">
                            Score: {assignment.score}%
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/creator/assignments/${assignment.assignmentId}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Assignment"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/creator/assignments/${assignment.assignmentId}/edit`)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit Assignment"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(assignment.assignmentId)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-12">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first quiz assignment.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create Assignment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} assignments
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Create Assignment Modal */}
        {showCreateModal && (
          <CreateAssignmentModal
            isDark={isDark}
            quizzes={quizzes}
            players={players}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchAssignments();
              toast.success('Assignment(s) created successfully');
            }}
          />
        )}
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDark ? 'dark' : 'light'}
      />
    </div>
  );
};

// Create Assignment Modal Component
const CreateAssignmentModal = ({ isDark, quizzes, players, onClose, onSuccess }) => {
  const [assignmentType, setAssignmentType] = useState('single'); // 'single' | 'bulk-users' | 'bulk-quizzes'
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [selectedQuizzes, setSelectedQuizzes] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [isMandatory, setIsMandatory] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (assignmentType === 'single') {
        // Single assignment
        await assignmentApi.createAssignment({
          quizId: selectedQuiz,
          userId: selectedPlayer,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          maxAttempts: maxAttempts || null,
          isMandatory,
          notes: notes || null
        });
      } else if (assignmentType === 'bulk-users') {
        // One quiz to multiple users
        await assignmentApi.createBulkAssignments({
          quizId: selectedQuiz,
          userIds: selectedPlayers,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          maxAttempts: maxAttempts || null,
          isMandatory,
          notes: notes || null
        });
      } else if (assignmentType === 'bulk-quizzes') {
        // Multiple quizzes to one user
        for (const quizId of selectedQuizzes) {
          await assignmentApi.createAssignment({
            quizId,
            userId: selectedPlayer,
            dueDate: dueDate ? new Date(dueDate).toISOString() : null,
            maxAttempts: maxAttempts || null,
            isMandatory,
            notes: notes || null
          });
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Create Quiz Assignment</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Assignment Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Assignment Type</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="single"
                  checked={assignmentType === 'single'}
                  onChange={(e) => setAssignmentType(e.target.value)}
                  className="mr-2"
                />
                Single Assignment (1 quiz → 1 player)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="bulk-users"
                  checked={assignmentType === 'bulk-users'}
                  onChange={(e) => setAssignmentType(e.target.value)}
                  className="mr-2"
                />
                Assign to Multiple Players (1 quiz → multiple players)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="bulk-quizzes"
                  checked={assignmentType === 'bulk-quizzes'}
                  onChange={(e) => setAssignmentType(e.target.value)}
                  className="mr-2"
                />
                Multiple Quizzes (multiple quizzes → 1 player)
              </label>
            </div>
          </div>

          {/* Quiz Selection */}
          {(assignmentType === 'single' || assignmentType === 'bulk-users') && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Quiz</label>
              <select
                value={selectedQuiz}
                onChange={(e) => setSelectedQuiz(e.target.value)}
                required
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Choose a quiz...</option>
                {quizzes.map((quiz) => (
                  <option key={quiz.quizId} value={quiz.quizId}>
                    {quiz.title} ({quiz.difficulty})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Multiple Quiz Selection */}
          {assignmentType === 'bulk-quizzes' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Quizzes</label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-3">
                {quizzes.map((quiz) => (
                  <label key={quiz.quizId} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={selectedQuizzes.includes(quiz.quizId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuizzes([...selectedQuizzes, quiz.quizId]);
                        } else {
                          setSelectedQuizzes(selectedQuizzes.filter(id => id !== quiz.quizId));
                        }
                      }}
                      className="mr-2"
                    />
                    {quiz.title} ({quiz.difficulty})
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Player Selection */}
          {(assignmentType === 'single' || assignmentType === 'bulk-quizzes') && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Player</label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                required
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Choose a player...</option>
                {players.map((player) => (
                  <option key={player.playerId} value={player.userId}>
                    {player.fullName || player.username} ({player.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Multiple Player Selection */}
          {assignmentType === 'bulk-users' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Players</label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-3">
                {players.map((player) => (
                  <label key={player.playerId} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(player.userId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlayers([...selectedPlayers, player.userId]);
                        } else {
                          setSelectedPlayers(selectedPlayers.filter(id => id !== player.userId));
                        }
                      }}
                      className="mr-2"
                    />
                    {player.fullName || player.username} ({player.email})
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Due Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Due Date (Optional)</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
              }`}
            />
          </div>

          {/* Max Attempts */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Max Attempts</label>
            <input
              type="number"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(parseInt(e.target.value))}
              min="1"
              className={`w-full px-3 py-2 border rounded-lg ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
              }`}
            />
          </div>

          {/* Mandatory */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isMandatory}
                onChange={(e) => setIsMandatory(e.target.checked)}
                className="mr-2"
              />
              Mandatory Assignment
            </label>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              className={`w-full px-3 py-2 border rounded-lg ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
              }`}
              placeholder="Additional instructions for the assignment..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              Create Assignment{assignmentType !== 'single' ? 's' : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatorAssignments;