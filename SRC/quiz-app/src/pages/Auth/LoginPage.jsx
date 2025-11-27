import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, LogIn, AlertCircle } from 'lucide-react';
import AuthLayout from '../../components/Auth/AuthLayout';
import FormInput from '../../components/Auth/FormInput';
import PasswordInput from '../../components/Auth/PasswordInput';
import { useAuth } from '../../context/AuthContext';

const LoginPage = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    
    try {
      const result = await login({
        email: formData.email,
        password: formData.password
      }, formData.rememberMe);

      if (result.success) {
        // Redirect to role selector or dashboard
        navigate('/');
      } else {
        setApiError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      isDark={isDark}
      toggleTheme={toggleTheme}
      title="Welcome Back!"
      subtitle="Sign in to continue your learning journey"
    >
      <div className="mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Sign In
        </h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Enter your credentials to access your account
        </p>
      </div>

      {/* API Error Message */}
      {apiError && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          isDark ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'
        }`}>
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
            {apiError}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <FormInput
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="you@example.com"
          required
          isDark={isDark}
          icon={Mail}
          autoComplete="email"
        />

        {/* Password Input */}
        <PasswordInput
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Enter your password"
          required
          isDark={isDark}
          autoComplete="current-password"
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Remember me
            </span>
          </label>

          <Link
            to="/forgot-password"
            className={`text-sm font-medium ${
              isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`
            w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold
            transition-all shadow-lg hover:shadow-xl
            ${loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            }
            text-white
          `}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      {/* Sign Up Link */}
      <div className={`mt-8 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Don't have an account?{' '}
        <Link
          to="/register"
          className={`font-semibold ${
            isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          Sign up for free
        </Link>
      </div>

      {/* Divider */}
      <div className="mt-8 relative">
        <div className={`absolute inset-0 flex items-center ${isDark ? 'opacity-20' : ''}`}>
          <div className={`w-full border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className={`px-4 ${isDark ? 'bg-gray-950 text-gray-500' : 'bg-white text-gray-500'}`}>
            Quick access
          </span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-6 text-center">
        <Link
          to="/"
          className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
        >
          ← Back to home
        </Link>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
