import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import {
  Home,
  BookOpen,
  ClipboardList,
  FileEdit,
  CheckCircle,
  UserCheck,
  PenTool,
  LogOut,
  Settings,
  Moon,
  Sun,
  ChevronRight,
  GraduationCap,
  RefreshCw
} from 'lucide-react';

const Sidebar = ({ isDark, toggleTheme, role = 'Player' }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Role-specific menu items
  const menuItemsByRole = {
    Player: [
      { icon: Home, label: 'Dashboard', path: '/Player/dashboard' },
      { icon: BookOpen, label: 'My Quizzes', path: '/Player/quizzes' },
      { icon: ClipboardList, label: 'My Attempts', path: '/Player/attempts' },
    ],
    creator: [
      { icon: Home, label: 'Dashboard', path: '/creator/dashboard' },
      { icon: BookOpen, label: 'All Quizzes', path: '/creator/quizzes' },
      { icon: PenTool, label: 'Create Quiz', path: '/creator/quiz/create' },
    ],
  };

  const roleConfig = {
    Player: {
      icon: GraduationCap,
      title: 'Player Portal',
      subtitle: 'Learning Dashboard',
      gradient: 'from-blue-500 to-cyan-600',
    },
    creator: {
      icon: PenTool,
      title: 'Content Creator',
      subtitle: 'Quiz Management',
      gradient: 'from-purple-500 to-pink-600',
    },
  };

  const menuItems = menuItemsByRole[role] || menuItemsByRole.Player;
  const config = roleConfig[role] || roleConfig.Player;
  const RoleIcon = config.icon;

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleSwitchRole = () => {
    // Navigate back to role selector
    navigate('/');
  };

  return (
    <div
      className={`${
        isCollapsed ? 'w-20' : 'w-72'
      } h-screen ${
        isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      } border-r ${
        isDark ? 'border-gray-800' : 'border-gray-200'
      } transition-all duration-300 flex flex-col`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center text-white`}>
              <RoleIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm">{config.title}</h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {config.subtitle}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-lg ${
            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
          } transition-colors`}
        >
          <ChevronRight
            className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
          />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-2 space-y-1 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : isDark
                  ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className={`p-2 space-y-1 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <button
          onClick={handleSwitchRole}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Switch Role' : ''}
        >
          <RefreshCw className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Switch Role</span>}
        </button>

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
            isDark ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>

        <div
          className={`flex items-center gap-3 px-3 py-3 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          {!isCollapsed && (
            <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </span>
          )}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            title={isCollapsed ? (isDark ? 'Light Mode' : 'Dark Mode') : ''}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
