const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

// Auth service for JWT-based authentication
class AuthService {
  // Get stored token
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Get stored user info
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < expiry;
    } catch (error) {
      return false;
    }
  }

  // Login
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store token and user info
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify({
        userId: data.userId,
        username: data.username,
        role: data.role,
        enrolledLevels: data.enrolledLevels || []
      }));

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Signup (admin only - requires admin token)
  async signup(signupData, adminToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(signupData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      const token = this.getToken();
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }

      const user = await response.json();
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  // Logout
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Get auth headers for API calls
  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Get all roles from JWT token
  getUserRoles() {
    try {
      const token = this.getToken();
      if (!token) return [];

      // Decode JWT token
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Extract roles - they can be a single value or an array
      const roles = payload.role;
      if (Array.isArray(roles)) {
        return roles;
      } else if (roles) {
        return [roles];
      }
      return [];
    } catch (error) {
      console.error('Error extracting roles from token:', error);
      return [];
    }
  }

  // Check if user has multiple roles
  hasMultipleRoles() {
    const roles = this.getUserRoles();
    return roles.length > 1;
  }
}

export default new AuthService();
