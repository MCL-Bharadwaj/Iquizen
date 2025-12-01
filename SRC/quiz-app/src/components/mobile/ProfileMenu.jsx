import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, Moon, Sun, User, Mail, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * ProfileMenu - Bottom sheet with user settings
 * Opens from bottom when Profile tab is tapped
 */
const ProfileMenu = ({ isOpen, onClose, isDark, toggleTheme, role }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Support swipe down to close
  useEffect(() => {
    if (!isOpen) return;

    let touchStartY = 0;
    let touchEndY = 0;

    const handleTouchStart = (e) => {
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e) => {
      touchEndY = e.changedTouches[0].screenY;
      if (touchEndY - touchStartY > 50) {
        onClose();
      }
    };

    const menu = document.getElementById('profile-menu');
    menu?.addEventListener('touchstart', handleTouchStart);
    menu?.addEventListener('touchend', handleTouchEnd);

    return () => {
      menu?.removeEventListener('touchstart', handleTouchStart);
      menu?.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSwitchRole = () => {
    navigate('/role-selector');
    onClose();
  };

  return (
    <div
      id="profile-menu"
      className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      } ${isDark ? 'bg-gray-900' : 'bg-white'} rounded-t-3xl shadow-2xl`}
      style={{ maxHeight: '85vh' }}
    >
      {/* Drag Handle */}
      <div className="flex justify-center py-3">
        <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
      </div>

      {/* Header */}
      <div className={`px-6 pb-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Profile & Settings
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg">
                {user.firstName || 'User'} {user.lastName || ''}
              </h3>
              <p className="text-indigo-100 text-sm flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {user.email || 'user@example.com'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="p-4 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center justify-between p-4 rounded-xl ${
            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
          } transition-colors`}
        >
          <div className="flex items-center gap-3">
            {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Theme
            </span>
          </div>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {isDark ? 'Dark' : 'Light'}
          </span>
        </button>

        {/* Switch Role */}
        <button
          onClick={handleSwitchRole}
          className={`w-full flex items-center gap-3 p-4 rounded-xl ${
            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
          } transition-colors`}
        >
          <RefreshCw className="w-5 h-5 text-indigo-600" />
          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Switch Role
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 p-4 rounded-xl ${
            isDark ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'
          } transition-colors font-medium`}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

      {/* Swipe Hint */}
      <div className="text-center py-4">
        <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          Swipe down to close
        </p>
      </div>
    </div>
  );
};

export default ProfileMenu;
