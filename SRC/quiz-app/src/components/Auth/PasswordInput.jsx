import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const PasswordInput = ({
  label,
  name,
  value,
  onChange,
  error,
  placeholder = 'Enter password',
  required = false,
  isDark = false,
  showStrength = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const levels = [
      { strength: 0, text: '', color: '' },
      { strength: 1, text: 'Weak', color: 'bg-red-500' },
      { strength: 2, text: 'Fair', color: 'bg-orange-500' },
      { strength: 3, text: 'Good', color: 'bg-yellow-500' },
      { strength: 4, text: 'Strong', color: 'bg-green-500' },
      { strength: 5, text: 'Very Strong', color: 'bg-green-600' },
    ];

    return levels[strength];
  };

  const passwordStrength = showStrength ? getPasswordStrength(value) : null;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-4 py-3 pr-12 rounded-lg border transition-colors
            ${error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : isDark
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500/20
          `}
          {...props}
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={`
            absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded
            ${isDark ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}
            transition-colors
          `}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Password Strength Indicator */}
      {showStrength && value && passwordStrength && (
        <div className="mt-2">
          <div className="flex gap-1 mb-1">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index < passwordStrength.strength
                    ? passwordStrength.color
                    : isDark
                    ? 'bg-gray-700'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          {passwordStrength.text && (
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Password strength: <span className="font-medium">{passwordStrength.text}</span>
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}

      {/* Password Requirements */}
      {showStrength && (
        <div className={`mt-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="font-medium mb-1">Password must contain:</p>
          <ul className="space-y-1 ml-4 list-disc">
            <li className={value && value.length >= 8 ? 'text-green-500' : ''}>
              At least 8 characters
            </li>
            <li className={value && /[a-z]/.test(value) && /[A-Z]/.test(value) ? 'text-green-500' : ''}>
              Uppercase and lowercase letters
            </li>
            <li className={value && /\d/.test(value) ? 'text-green-500' : ''}>
              At least one number
            </li>
            <li className={value && /[^a-zA-Z0-9]/.test(value) ? 'text-green-500' : ''}>
              At least one special character
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
