import axios from 'axios';

// External LMS API - Use environment variable or fallback to dev server
const BASE_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:7072/api';

/**
 * Decode JWT token to extract payload
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null if invalid
 */
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

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
        const token = response.data.token;
        localStorage.setItem('authToken', token);
        
        // Decode JWT to extract payload
        const decodedToken = decodeJWT(token);
        
        if (decodedToken) {
          // Extract userId and roles from token claims
          const userId = decodedToken.userId || decodedToken.sub;
          const email = decodedToken.email;
          const roles = decodedToken.role || []; // 'role' claim contains array of roles
          
          // Build user data object with decoded information
          const userData = {
            userId: userId,
            email: email,
            roles: Array.isArray(roles) ? roles : [roles], // Ensure roles is an array
            firstName: response.data.firstName || null,
            lastName: response.data.lastName || null,
            ...response.data // Include any other data from response
          };
          
          // Remove token from userData to avoid duplication
          delete userData.token;
          delete userData.refreshToken;
          
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Return enriched response with decoded data
          return {
            ...response.data,
            userId: userId,
            email: email,
            roles: userData.roles
          };
        }
        
        // Store refresh token if provided
        if (response.data?.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
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
