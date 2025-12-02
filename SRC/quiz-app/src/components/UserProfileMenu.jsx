import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, User, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * UserProfileMenu - Top-right corner profile menu (Google-style)
 * Shows user initials in a circular avatar with dropdown menu
 */
const UserProfileMenu = ({ isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const menuRef = useRef(null);

  // Get user initials
  const getInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.firstName?.[0]?.toUpperCase() || '';
    const lastInitial = user.lastName?.[0]?.toUpperCase() || '';
    return firstInitial + lastInitial || 'U';
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSwitchRole = () => {
    navigate('/role-selector');
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center
          bg-gradient-to-br from-indigo-600 to-purple-600
          text-white font-semibold text-sm
          hover:shadow-lg transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
          ${isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'}
        `}
        title={`${user.firstName || ''} ${user.lastName || ''}`}
      >
        {getInitials()}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute right-0 mt-2 w-72 rounded-xl shadow-2xl border z-50
            ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
            animate-in fade-in slide-in-from-top-2 duration-200
          `}
        >
          {/* User Info Header */}
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {getInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user.firstName || 'User'} {user.lastName || ''}
                </h3>
                <p className={`text-sm flex items-center gap-1 truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  {user.email || 'user@example.com'}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {/* Switch Role */}
            {user?.roles && user.roles.length > 1 && (
              <button
                onClick={handleSwitchRole}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left
                  ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}
                `}
              >
                <RefreshCw className="w-5 h-5 text-indigo-600" />
                <span className="font-medium">Switch Role</span>
              </button>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left
                ${isDark ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'}
              `}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileMenu;
