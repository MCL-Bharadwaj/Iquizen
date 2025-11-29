import { createContext, useState, useEffect, useContext } from 'react';
import authApi from '../services/authApi';
import { getRolesFromToken } from '../utils/jwtHelper';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const storedToken = authApi.getToken();
      const storedUser = authApi.getCurrentUser();

      if (storedToken && storedUser) {
        // Always decode roles from token to ensure they're up-to-date
        const rolesFromToken = getRolesFromToken(storedToken);
        const userWithRoles = { ...storedUser, roles: rolesFromToken };
        
        console.log('AuthContext: Initializing with roles from token:', rolesFromToken);
        setToken(storedToken);
        setUser(userWithRoles);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Login user
   */
  const login = async (credentials, rememberMe = false) => {
    try {
      const response = await authApi.login(credentials);
      
      // API returns: { userId, email, firstName, lastName, token, refreshToken, roles }
      if (response.token) {
        setToken(response.token);
        
        // Extract user data (everything except token and refreshToken)
        const { token, refreshToken, ...userData } = response;
        
        // ALWAYS decode roles from JWT token for accuracy
        const rolesFromToken = getRolesFromToken(response.token);
        userData.roles = rolesFromToken;
        
        console.log('AuthContext: Setting user data with roles from token:', userData);
        setUser(userData);
        setIsAuthenticated(true);
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        return { success: true, data: response };
      }
      
      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Register new user
   */
  const register = async (userData) => {
    try {
      const response = await authApi.register(userData);
      return { success: true, data: response };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || 'Registration failed';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    authApi.logout();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Change password
   */
  const changePassword = async (userId, passwords) => {
    try {
      const response = await authApi.changePassword(userId, passwords);
      return { success: true, data: response };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || 'Password change failed';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Request password reset
   */
  const forgotPassword = async (email) => {
    try {
      const response = await authApi.forgotPassword(email);
      return { success: true, data: response };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || 'Password reset request failed';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Reset password with token
   */
  const resetPassword = async (resetData) => {
    try {
      const response = await authApi.resetPassword(resetData);
      return { success: true, data: response };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || 'Password reset failed';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Verify email with token
   */
  const verifyEmail = async (token) => {
    try {
      const response = await authApi.verifyEmail(token);
      return { success: true, data: response };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || 'Email verification failed';
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
