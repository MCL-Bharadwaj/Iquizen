import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import { getRolesFromToken } from '../utils/jwtHelper';

function LoginPage({ isDark, toggleTheme }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData.username, formData.password);
      
      // Extract roles from token
      const token = response.token || localStorage.getItem('authToken');
      const roles = getRolesFromToken(token);
      
      console.log('Login successful. User roles:', roles);
      
      // Auto-navigate based on roles
      if (roles.length === 1) {
        const role = roles[0];
        if (role === 'Player') {
          navigate('/Player/dashboard');
        } else if (role === 'Tutors' || role === 'Administrator') {
          navigate('/creator/dashboard');
        } else {
          navigate('/role-selector');
        }
      } else if (roles.length > 1) {
        // Multiple roles - show role selector
        navigate('/role-selector');
      } else {
        // No roles - fallback to role selector
        navigate('/role-selector');
      }
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-700'} shadow-md hover:shadow-lg transition-all`}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      <div className={`max-w-md w-full mx-4 p-8 rounded-xl shadow-2xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Welcome Back
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            } text-white shadow-lg hover:shadow-xl`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={`mt-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>Don't have an account? Contact your administrator.</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
