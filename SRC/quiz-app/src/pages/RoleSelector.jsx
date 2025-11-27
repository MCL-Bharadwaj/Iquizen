import { useNavigate } from 'react-router-dom';
import { BookOpen, UserCheck, PenTool, Moon, Sun } from 'lucide-react';

const RoleSelector = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'Player',
      title: 'Player',
      description: 'View and take quizzes, submit answers, and view your results',
      icon: BookOpen,
      path: '/Player/dashboard',
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: isDark ? 'from-blue-950/50 to-cyan-950/50' : 'from-blue-50 to-cyan-50',
    },
    {
      id: 'creator',
      title: 'Content Creator',
      description: 'Create and manage quizzes, add questions, and organize content',
      icon: PenTool,
      path: '/creator/dashboard',
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: isDark ? 'from-purple-950/50 to-pink-950/50' : 'from-purple-50 to-pink-50',
    },
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
