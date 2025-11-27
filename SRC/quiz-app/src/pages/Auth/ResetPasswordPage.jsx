import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import AuthLayout from '../../components/Auth/AuthLayout';
import PasswordInput from '../../components/Auth/PasswordInput';
import { useAuth } from '../../context/AuthContext';

const ResetPasswordPage = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setApiError('Invalid or missing reset token');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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

    if (!token) {
      setApiError('Invalid or missing reset token');
      return;
    }

    setLoading(true);
    
    try {
      const result = await resetPassword({
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setApiError(result.error || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout isDark={isDark} toggleTheme={toggleTheme}>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Password Reset Successful!
          </h2>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Your password has been reset successfully. Redirecting to login...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      isDark={isDark}
      toggleTheme={toggleTheme}
      title="Reset Password"
      subtitle="Create a new password for your account"
    >
      <div className="mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Create New Password
        </h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Enter your new password below
        </p>
      </div>

      {apiError && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          isDark ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'
        }`}>
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <PasswordInput
          label="New Password"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          placeholder="Enter new password"
          required
          isDark={isDark}
          showStrength={true}
        />

        <PasswordInput
          label="Confirm New Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="Re-enter new password"
          required
          isDark={isDark}
        />

        <button
          type="submit"
          disabled={loading || !token}
          className={`
            w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold
            transition-all shadow-lg hover:shadow-xl
            ${loading || !token
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            }
            text-white
          `}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Resetting...</span>
            </>
          ) : (
            <span>Reset Password</span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
