import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, User, Phone, MapPin, Calendar, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import AuthLayout from '../../components/Auth/AuthLayout';
import FormInput from '../../components/Auth/FormInput';
import PasswordInput from '../../components/Auth/PasswordInput';
import { useAuth } from '../../context/AuthContext';

const RegisterPage = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  const [formData, setFormData] = useState({
    // Step 1: Account Info
    email: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Personal Info
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    gender: '',
    
    // Step 3: Address & DOB
    dateOfBirth: {
      year: '',
      month: '',
      day: ''
    },
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested dateOfBirth object
    if (name.startsWith('dob-')) {
      const field = name.replace('dob-', '');
      setFormData(prev => ({
        ...prev,
        dateOfBirth: {
          ...prev.dateOfBirth,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    return newErrors;
  };

  const validateStep3 = () => {
    const newErrors = {};
    
    if (!formData.dateOfBirth.year || !formData.dateOfBirth.month || !formData.dateOfBirth.day) {
      newErrors.dateOfBirth = 'Complete date of birth is required';
    } else {
      const year = parseInt(formData.dateOfBirth.year);
      const month = parseInt(formData.dateOfBirth.month);
      const day = parseInt(formData.dateOfBirth.day);
      
      if (year < 1900 || year > new Date().getFullYear()) {
        newErrors.dateOfBirth = 'Invalid year';
      } else if (month < 1 || month > 12) {
        newErrors.dateOfBirth = 'Invalid month';
      } else if (day < 1 || day > 31) {
        newErrors.dateOfBirth = 'Invalid day';
      }
    }
    
    if (!formData.address1) {
      newErrors.address1 = 'Address is required';
    }
    
    if (!formData.city) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.country) {
      newErrors.country = 'Country is required';
    }
    
    if (!formData.postalCode) {
      newErrors.postalCode = 'Postal code is required';
    }
    
    return newErrors;
  };

  const handleNext = () => {
    let newErrors = {};
    
    if (currentStep === 1) {
      newErrors = validateStep1();
    } else if (currentStep === 2) {
      newErrors = validateStep2();
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    const newErrors = validateStep3();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    
    try {
      // Prepare data for API
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        middleName: formData.middleName || '',
        lastName: formData.lastName,
        phone: formData.phone,
        dateOfBirth: {
          year: parseInt(formData.dateOfBirth.year),
          month: parseInt(formData.dateOfBirth.month),
          day: parseInt(formData.dateOfBirth.day),
          dayOfWeek: 0, // Will be calculated by backend
          dayOfYear: 0, // Will be calculated by backend
          dayNumber: 0  // Will be calculated by backend
        },
        gender: formData.gender,
        address1: formData.address1,
        address2: formData.address2 || '',
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
      };

      const result = await register(registrationData);

      if (result.success) {
        setSuccess(true);
        // Don't navigate immediately, show success message
      } else {
        setApiError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success View
  if (success) {
    return (
      <AuthLayout isDark={isDark} toggleTheme={toggleTheme}>
        <div className="text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Registration Successful!
            </h2>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Your account has been created successfully.
            </p>
          </div>

          <div className={`p-6 rounded-lg mb-6 ${isDark ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
            <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              📧 We've sent a verification email to <strong>{formData.email}</strong>
            </p>
            <p className={`text-sm mt-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              Please check your inbox and verify your email address to activate your account.
            </p>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            Go to Login
          </button>

          <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Didn't receive the email?{' '}
            <button className={`font-semibold ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
              Resend verification email
            </button>
          </p>
        </div>
      </AuthLayout>
    );
  }

  // Step indicators
  const steps = [
    { number: 1, title: 'Account' },
    { number: 2, title: 'Personal' },
    { number: 3, title: 'Address' }
  ];

  return (
    <AuthLayout
      isDark={isDark}
      toggleTheme={toggleTheme}
      title="Join Us Today!"
      subtitle="Create your account and start learning"
    >
      <div className="mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Create Account
        </h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Step {currentStep} of {totalSteps}: {steps[currentStep - 1].title} Information
        </p>

        {/* Progress Bar */}
        <div className="mt-4 flex gap-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex-1 h-2 rounded-full transition-all ${
                step.number <= currentStep
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                  : isDark
                  ? 'bg-gray-700'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
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
        {/* Step 1: Account Information */}
        {currentStep === 1 && (
          <>
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

            <PasswordInput
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Create a strong password"
              required
              isDark={isDark}
              showStrength={true}
              autoComplete="new-password"
            />

            <PasswordInput
              label="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Re-enter your password"
              required
              isDark={isDark}
              autoComplete="new-password"
            />
          </>
        )}

        {/* Step 2: Personal Information */}
        {currentStep === 2 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="First Name"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                placeholder="John"
                required
                isDark={isDark}
                icon={User}
              />

              <FormInput
                label="Last Name"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                placeholder="Doe"
                required
                isDark={isDark}
              />
            </div>

            <FormInput
              label="Middle Name"
              type="text"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              placeholder="Optional"
              isDark={isDark}
            />

            <FormInput
              label="Phone Number"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder="+1 (555) 123-4567"
              required
              isDark={isDark}
              icon={Phone}
            />

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Male', 'Female', 'Other'].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => handleChange({ target: { name: 'gender', value: gender } })}
                    className={`
                      px-4 py-3 rounded-lg border-2 transition-all font-medium
                      ${formData.gender === gender
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : isDark
                        ? 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }
                    `}
                  >
                    {gender}
                  </button>
                ))}
              </div>
              {errors.gender && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.gender}
                </p>
              )}
            </div>
          </>
        )}

        {/* Step 3: Address & Date of Birth */}
        {currentStep === 3 && (
          <>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <FormInput
                  type="number"
                  name="dob-month"
                  value={formData.dateOfBirth.month}
                  onChange={handleChange}
                  placeholder="MM"
                  min="1"
                  max="12"
                  required
                  isDark={isDark}
                />
                <FormInput
                  type="number"
                  name="dob-day"
                  value={formData.dateOfBirth.day}
                  onChange={handleChange}
                  placeholder="DD"
                  min="1"
                  max="31"
                  required
                  isDark={isDark}
                />
                <FormInput
                  type="number"
                  name="dob-year"
                  value={formData.dateOfBirth.year}
                  onChange={handleChange}
                  placeholder="YYYY"
                  min="1900"
                  max={new Date().getFullYear()}
                  required
                  isDark={isDark}
                />
              </div>
              {errors.dateOfBirth && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.dateOfBirth}
                </p>
              )}
            </div>

            <FormInput
              label="Address Line 1"
              type="text"
              name="address1"
              value={formData.address1}
              onChange={handleChange}
              error={errors.address1}
              placeholder="Street address"
              required
              isDark={isDark}
              icon={MapPin}
            />

            <FormInput
              label="Address Line 2"
              type="text"
              name="address2"
              value={formData.address2}
              onChange={handleChange}
              placeholder="Apt, suite, unit, etc. (optional)"
              isDark={isDark}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="City"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                error={errors.city}
                placeholder="City"
                required
                isDark={isDark}
              />

              <FormInput
                label="State/Province"
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                error={errors.state}
                placeholder="State"
                required
                isDark={isDark}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Country"
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                error={errors.country}
                placeholder="Country"
                required
                isDark={isDark}
              />

              <FormInput
                label="Postal Code"
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                error={errors.postalCode}
                placeholder="ZIP/Postal"
                required
                isDark={isDark}
              />
            </div>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className={`
                flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold
                transition-all border-2
                ${isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className={`
                flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold
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
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Sign In Link */}
      <div className={`mt-8 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Already have an account?{' '}
        <Link
          to="/login"
          className={`font-semibold ${
            isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          Sign in instead
        </Link>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
