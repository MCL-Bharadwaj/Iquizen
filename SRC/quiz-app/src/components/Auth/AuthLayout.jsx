import { Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, isDark, toggleTheme, title, subtitle }) => {
  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-950' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      {/* Left Side - Branding */}
      <div className={`hidden lg:flex lg:w-1/2 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-600 to-purple-600'} p-12 flex-col justify-between`}>
        <div>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">IQ</span>
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">IQuizen</h1>
              <p className="text-sm opacity-90">Learn. Play. Master.</p>
            </div>
          </Link>
        </div>

        <div className="text-white">
          <h2 className="text-4xl font-bold mb-4">
            {title || 'Welcome Back!'}
          </h2>
          <p className="text-xl opacity-90 mb-8">
            {subtitle || 'Continue your learning journey with interactive quizzes and challenges.'}
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm">✓</span>
              </div>
              <p className="text-lg">Interactive quiz experiences</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm">✓</span>
              </div>
              <p className="text-lg">Track your progress</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm">✓</span>
              </div>
              <p className="text-lg">Compete with others</p>
            </div>
          </div>
        </div>

        <div className="text-white text-sm opacity-75">
          © 2025 IQuizen. All rights reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className={`flex-1 flex flex-col ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        {/* Theme Toggle */}
        <div className="p-6 flex justify-end">
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-lg transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        {/* Mobile Logo */}
        <div className="lg:hidden p-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-gray-800' : 'bg-blue-600'
            }`}>
              <span className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-white'}`}>IQ</span>
            </div>
            <span className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              IQuizen
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
