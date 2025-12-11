import { useNavigate } from 'react-router-dom';
import { BookOpen, UserCheck, PenTool, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const RoleSelector = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [availableRoles, setAvailableRoles] = useState([]);

  // All possible roles in the system
  const allRoles = [
    {
      id: 'Player',
      title: 'Player',
      description: 'View and take quizzes, submit answers, and view your results',
      icon: BookOpen,
      path: '/Player/dashboard',
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: isDark ? 'from-blue-950/50 to-cyan-950/50' : 'from-blue-50 to-cyan-50',
      requiredRole: ['Player', 'Administrator'],
    },
    {
      id: 'tutor',
      title: 'Tutor',
      description: 'View assigned quizzes, monitor student progress, and track assignments',
      icon: UserCheck,
      path: '/tutor/dashboard',
      gradient: 'from-green-500 to-teal-600',
      bgGradient: isDark ? 'from-green-950/50 to-teal-950/50' : 'from-green-50 to-teal-50',
      requiredRole: ['Tutors', 'Administrator'],
    },
    {
      id: 'creator',
      title: 'Content Creator',
      description: 'Create and manage quizzes, add questions, and organize content',
      icon: PenTool,
      path: '/creator/dashboard',
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: isDark ? 'from-purple-950/50 to-pink-950/50' : 'from-purple-50 to-pink-50',
      requiredRole: ['ContentCreator', 'Administrator'],
    },
  ];

  // Filter roles based on user's roles from JWT token
  useEffect(() => {
    if (user && user.roles) {
      const userRoles = user.roles; // Array of roles from decoded JWT
      console.log('RoleSelector - User roles from token:', userRoles);
      console.log('RoleSelector - Full user object:', user);

      const filtered = allRoles.filter((role) => {
        if (Array.isArray(role.requiredRole)) {
          // Check if user has any of the required roles
          const hasMatch = role.requiredRole.some((reqRole) => userRoles.includes(reqRole));
          console.log(`RoleSelector - Checking ${role.title}:`, {
            requiredRoles: role.requiredRole,
            userRoles: userRoles,
            hasMatch: hasMatch
          });
          return hasMatch;
        } else {
          // Check if user has the single required role
          const hasMatch = userRoles.includes(role.requiredRole);
          console.log(`RoleSelector - Checking ${role.title}:`, {
            requiredRole: role.requiredRole,
            userRoles: userRoles,
            hasMatch: hasMatch
          });
          return hasMatch;
        }
      });

      setAvailableRoles(filtered);
      console.log('RoleSelector - Available roles for user:', filtered.map(r => r.title));
      console.log('RoleSelector - Number of available roles:', filtered.length);

      // Auto-navigate if user has only one available role
      if (filtered.length === 1) {
        console.log('RoleSelector - Single role detected, auto-navigating to:', filtered[0].path);
        navigate(filtered[0].path, { replace: true });
      } else if (filtered.length > 1) {
        console.log('RoleSelector - Multiple roles available, showing selector');
      } else {
        console.log('RoleSelector - No roles available for user');
      }
    }
  }, [user, navigate, isDark]);

  const roles = availableRoles;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'} flex items-center justify-center p-8`}>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 p-3 rounded-xl ${
          isDark ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-700'
        } shadow-lg hover:scale-110 transition-all duration-300`}
      >
        {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>

      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Welcome to Quiz Platform
          </h1>
          <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Select your role to continue
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => navigate(role.path)}
                className={`group relative overflow-hidden rounded-3xl ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                } border-2 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 p-8 text-left`}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${role.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity`}></div>
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`mb-6 p-4 rounded-2xl bg-gradient-to-br ${role.gradient} w-fit`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {role.title}
                  </h3>

                  {/* Description */}
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {role.description}
                  </p>

                  {/* Arrow */}
                  <div className="mt-6 flex items-center gap-2">
                    <span className={`text-sm font-medium bg-gradient-to-r ${role.gradient} bg-clip-text text-transparent`}>
                      Continue as {role.title}
                    </span>
                    <svg 
                      className={`w-4 h-4 group-hover:translate-x-2 transition-transform bg-gradient-to-r ${role.gradient} text-transparent`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className={`text-center mt-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <p className="text-sm">
            Click on a role card to access the corresponding dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
