import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, ClipboardList, PenTool, User, Users } from 'lucide-react';

/**
 * BottomTabBar - Fixed bottom navigation with profile tab
 * Native mobile app experience
 */
const BottomTabBar = ({ isDark, role, onProfileClick }) => {
  const location = useLocation();

  const tabItemsByRole = {
    Player: [
      { icon: Home, label: 'Dashboard', path: '/Player/dashboard' },
      { icon: BookOpen, label: 'Quizzes', path: '/Player/quizzes' },
      { icon: ClipboardList, label: 'Attempts', path: '/Player/attempts' },
    ],
    tutor: [
      { icon: Home, label: 'Dashboard', path: '/tutor/dashboard' },
      { icon: ClipboardList, label: 'Assignments', path: '/tutor/assignments' },
    ],
    creator: [
      { icon: Home, label: 'Dashboard', path: '/creator/dashboard' },
      { icon: BookOpen, label: 'Quizzes', path: '/creator/quizzes' },
      { icon: Users, label: 'Assignments', path: '/creator/assignments' },
      { icon: PenTool, label: 'Create', path: '/creator/quiz/create' },
    ],
  };

  const tabItems = tabItemsByRole[role] || tabItemsByRole.Player;
  const isActive = (path) => location.pathname === path;

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 z-30 ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      } border-t shadow-lg`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {/* Navigation Tabs */}
        {tabItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[70px] ${
                active
                  ? 'bg-indigo-600 text-white'
                  : isDark
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? 'scale-110' : ''} transition-transform`} />
              <span className={`text-xs font-medium ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        
        {/* Profile Tab */}
        <button
          onClick={onProfileClick}
          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[70px] ${
            isDark
              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <User className="w-6 h-6 transition-transform" />
          <span className="text-xs font-medium">Profile</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomTabBar;
