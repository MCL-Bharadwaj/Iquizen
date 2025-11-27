import axios from 'axios';

// External LMS API - Use environment variable or fallback to dev server
const BASE_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:7072/api';

const authClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for adding auth token
authClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track if we're currently refreshing to avoid multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add response interceptor for handling errors and token refresh
authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return authClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // No refresh token, logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Try to refresh the token
        const response = await authClient.post('/v1/auth/refresh-token', { refreshToken });
        
        if (response.data?.token) {
          const newToken = response.data.token;
          localStorage.setItem('authToken', newToken);
          
          // Update refresh token if provided
          if (response.data?.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
          
          // Update authorization header
          authClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Process queued requests
          processQueue(null, newToken);
          isRefreshing = false;
          
          // Retry original request
          return authClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// ==================== AUTHENTICATION API ====================

export const authApi = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise}
   */
  register: async (userData) => {
    try {
      const response = await authClient.post('/v1/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  /**
   * Login with email and password
   * @param {Object} credentials - { email, password }
   * @returns {Promise}
   */
  login: async (credentials) => {
    try {
      const response = await authClient.post('/v1/auth/login', credentials);
      
      // Store token, refresh token, and user data
      if (response.data?.token) {
        localStorage.setItem('authToken', response.data.token);
        
        // Store refresh token if provided
        if (response.data?.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        // Extract user data from response (userId, email, firstName, lastName, roles)
        const { token, refreshToken, ...userData } = response.data;
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  /**
   * Refresh access token using refresh token
   * @returns {Promise}
   */
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authClient.post('/v1/auth/refresh-token', { refreshToken });
      
      // Update access token
      if (response.data?.token) {
        localStorage.setItem('authToken', response.data.token);
        
        // Update refresh token if a new one is provided
        if (response.data?.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, clear everything
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      throw error;
    }
  },

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {Object} passwords - { currentPassword, newPassword, confirmPassword }
   * @returns {Promise}
   */
  changePassword: async (userId, passwords) => {
    try {
      const response = await authClient.post(`/v1/auth/change-password/${userId}`, passwords);
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  /**
   * Request password reset (sends email with token)
   * @param {string} email - User email
   * @returns {Promise}
   */
  forgotPassword: async (email) => {
    try {
      const response = await authClient.post('/v1/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  },

  /**
   * Reset password using token from email
   * @param {Object} resetData - { token, newPassword, confirmPassword }
   * @returns {Promise}
   */
  resetPassword: async (resetData) => {
    try {
      const response = await authClient.post('/v1/auth/reset-password', resetData);
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  /**
   * Verify user email with token
   * @param {string} token - Verification token from email
   * @returns {Promise}
   */
  verifyEmail: async (token) => {
    try {
      const response = await authClient.post('/v1/auth/verify-email', { token });
      return response.data;
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
  },

  /**
   * Get current user from localStorage
   * @returns {Object|null}
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get current token
   * @returns {string|null}
   */
  getToken: () => {
    return localStorage.getItem('authToken');
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
};

export default authApi;
