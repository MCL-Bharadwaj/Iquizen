import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import AuthLayout from '../../components/Auth/AuthLayout';
import FormInput from '../../components/Auth/FormInput';
import { useAuth } from '../../context/AuthContext';

const ForgotPasswordPage = ({ isDark, toggleTheme }) => {
  const { forgotPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    
    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
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
            Check Your Email
          </h2>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className={`text-sm mb-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Click the link in the email to reset your password. The link expires in 24 hours.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      isDark={isDark}
      toggleTheme={toggleTheme}
      title="Forgot Password?"
      subtitle="Don't worry, we'll help you reset it"
    >
      <div className="mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Reset Password
        </h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      {error && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          isDark ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'
        }`}>
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          label="Email Address"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          isDark={isDark}
          icon={Mail}
        />

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
              <span>Sending...</span>
            </>
          ) : (
            <span>Send Reset Link</span>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link
          to="/login"
          className={`inline-flex items-center gap-2 text-sm ${
            isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
