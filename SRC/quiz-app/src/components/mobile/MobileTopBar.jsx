import { useLocation } from 'react-router-dom';
import { GraduationCap, PenTool, UserCheck } from 'lucide-react';

/**
 * MobileTopBar - Simple header for mobile view
 * Shows page title and role branding
 */
const MobileTopBar = ({ isDark, role }) => {
  const location = useLocation();

  const roleConfig = {
    Player: {
      icon: GraduationCap,
      title: 'Player Portal',
      gradient: 'from-blue-500 to-cyan-600',
    },
    tutor: {
      icon: UserCheck,
      title: 'Tutor Portal',
      gradient: 'from-green-500 to-teal-600',
    },
    creator: {
      icon: PenTool,
      title: 'Content Creator',
      gradient: 'from-purple-500 to-pink-600',
    },
  };

  const pageTitles = {
    '/Player/dashboard': 'Dashboard',
    '/Player/quizzes': 'My Quizzes',
    '/Player/attempts': 'My Attempts',
    '/tutor/dashboard': 'Dashboard',
    '/tutor/assignments': 'My Assignments',
    '/creator/dashboard': 'Dashboard',
    '/creator/quizzes': 'All Quizzes',
    '/creator/quiz/create': 'Create Quiz',
  };

  const config = roleConfig[role] || roleConfig.Player;
  const RoleIcon = config.icon;
  const pageTitle = pageTitles[location.pathname] || 'IQuizen';

  return (
    <header 
      className={`sticky top-0 z-40 ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      } border-b shadow-sm`}
    >
      <div className="flex items-center justify-center px-4 py-3">
        {/* Centered: Role Icon + Page Title */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center`}>
            <RoleIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {pageTitle}
            </h1>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {config.title}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileTopBar;
