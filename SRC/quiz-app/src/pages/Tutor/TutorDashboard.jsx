import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Users, Award, Loader2, Calendar, CheckCircle, AlertCircle, Target } from 'lucide-react';
import { assignmentApi } from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TutorDashboard = ({ isDark }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    activeAssignments: 0,
    completedAssignments: 0,
    upcomingDeadlines: 0,
  });
  const [recentAssignments, setRecentAssignments] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Dashboard became visible, refreshing data...');
        fetchDashboardData();
      }
    };

    const handleFocus = () => {
      console.log('Dashboard received focus, refreshing data...');
      fetchDashboardData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch my assignments
      const assignmentsData = await assignmentApi.getMyAssignments();
      console.log('Tutor Assignments data:', assignmentsData);
      
      // Handle array response
      const assignments = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData.assignments || []);
      
      // Filter assignments based on status
      const activeAssignments = assignments.filter(a => a.status === 'assigned' || a.status === 'in_progress');
      const completedAssignments = assignments.filter(a => a.status === 'completed');
      
      // Count upcoming deadlines (within next 7 days)
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingDeadlines = assignments.filter(a => {
        if (!a.dueDate) return false;
        const dueDate = new Date(a.dueDate);
        return dueDate >= now && dueDate <= weekFromNow && (a.status === 'assigned' || a.status === 'in_progress');
      }).length;
      
      setRecentAssignments(assignments.slice(0, 5));
      
      setStats({
        totalAssignments: assignments.length,
        activeAssignments: activeAssignments.length,
        completedAssignments: completedAssignments.length,
        upcomingDeadlines: upcomingDeadlines,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      assigned: { label: 'Active', color: 'bg-blue-500/20 text-blue-400' },
      completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400' },
      cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400' },
      expired: { label: 'Expired', color: 'bg-gray-500/20 text-gray-400' },
    };
    const config = statusConfig[status] || statusConfig.assigned;
    return (
      <span className={`text-xs px-2 py-1 rounded ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className={`w-12 h-12 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <ToastContainer position="top-right" autoClose={3000} theme={isDark ? 'dark' : 'light'} />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Tutor Dashboard
        </h1>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Monitor your assigned quizzes and track progress
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={BookOpen}
          label="Total Assignments"
          value={stats.totalAssignments}
          gradient="from-blue-500 to-cyan-600"
          isDark={isDark}
          onClick={() => navigate('/tutor/assignments')}
        />
        <StatCard
          icon={CheckCircle}
          label="Active Assignments"
          value={stats.activeAssignments}
          gradient="from-green-500 to-emerald-600"
          isDark={isDark}
          onClick={() => navigate('/tutor/assignments')}
        />
        <StatCard
          icon={Award}
          label="Completed"
          value={stats.completedAssignments}
          gradient="from-purple-500 to-pink-600"
          isDark={isDark}
          onClick={() => navigate('/tutor/assignments')}
        />
        <StatCard
          icon={AlertCircle}
          label="Due This Week"
          value={stats.upcomingDeadlines}
          gradient="from-orange-500 to-red-600"
          isDark={isDark}
          onClick={() => navigate('/tutor/assignments')}
        />
      </div>

      {/* Recent Assignments */}
      <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg p-6 mb-8`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Recent Assignments
          </h2>
          <button
            onClick={() => navigate('/tutor/assignments')}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            View All
          </button>
        </div>

        {recentAssignments.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No assignments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentAssignments.map((assignment) => (
              <div
                key={assignment.assignmentId}
                onClick={() => navigate('/tutor/assignments')}
                className={`p-4 rounded-xl ${
                  isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                } cursor-pointer transition-all`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {assignment.quizTitle}
                    </h3>
                    <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {assignment.quizDescription || 'No description'}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {assignment.estimatedMinutes || 0} mins
                        </span>
                      </div>
                      {assignment.dueDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(assignment.status)}
                    {assignment.isMandatory && (
                      <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400">
                        Mandatory
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, gradient, isDark, onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl ${
      isDark ? 'bg-gray-800' : 'bg-white'
    } shadow-lg p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
  >
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <p className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {value}
    </p>
    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
  </div>
);

export default TutorDashboard;
