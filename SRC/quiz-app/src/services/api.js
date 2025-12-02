import axios from 'axios';

// Configure the base URL for your Azure Functions API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';
const AUTH_API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:7072/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});

// Add request interceptor for adding API key and JWT token
apiClient.interceptors.request.use(
  (config) => {
    // Add JWT token to Authorization header
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // If you have an API key for write operations, add it here
    const apiKey = localStorage.getItem('apiKey');
    if (apiKey && ['post', 'put', 'delete'].includes(config.method?.toLowerCase())) {
      config.headers['X-API-Key'] = apiKey;
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

// Add response interceptor for handling 401 errors and token refresh
apiClient.interceptors.response.use(
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
          return apiClient(originalRequest);
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
        // Create a separate axios instance for refresh to avoid interceptor loop
        const authClient = axios.create({
          baseURL: AUTH_API_BASE_URL,
          headers: { 'Content-Type': 'application/json' }
        });

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
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Process queued requests
          processQueue(null, newToken);
          isRefreshing = false;
          
          // Retry original request
          return apiClient(originalRequest);
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

// ==================== QUIZ API ====================
export const quizApi = {
  // Get all quizzes with optional filters
  getQuizzes: async (params = {}) => {
    try {
      const response = await apiClient.get('/quizzes', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
  },

  // Get a single quiz by ID
  getQuizById: async (quizId) => {
    try {
      const response = await apiClient.get(`/quizzes/${quizId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  },

  // Get questions for a specific quiz
  getQuizQuestions: async (quizId) => {
    try {
      const response = await apiClient.get(`/quizzes/${quizId}/questions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      throw error;
    }
  },

  // Create a new quiz
  createQuiz: async (quizData) => {
    try {
      const response = await apiClient.post('/quizzes', quizData);
      return response.data;
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  },

  // Update a quiz
  updateQuiz: async (quizId, quizData) => {
    try {
      const response = await apiClient.put(`/quizzes/${quizId}`, quizData);
      return response.data;
    } catch (error) {
      console.error('Error updating quiz:', error);
      throw error;
    }
  },

  // Delete a quiz
  deleteQuiz: async (quizId) => {
    try {
      const response = await apiClient.delete(`/quizzes/${quizId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  },
};

// ==================== QUESTION API ====================
export const questionApi = {
  // Get all questions
  getQuestions: async (params = {}) => {
    try {
      const response = await apiClient.get('/questions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  },

  // Get a single question by ID
  getQuestionById: async (questionId) => {
    try {
      const response = await apiClient.get(`/questions/${questionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching question:', error);
      throw error;
    }
  },

  // Create a new question
  createQuestion: async (questionData) => {
    try {
      const response = await apiClient.post('/questions', questionData);
      return response.data;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  },

  // Update a question
  updateQuestion: async (questionId, questionData) => {
    try {
      const response = await apiClient.put(`/questions/${questionId}`, questionData);
      return response.data;
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  },

  // Delete a question
  deleteQuestion: async (questionId) => {
    try {
      const response = await apiClient.delete(`/questions/${questionId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  },

  // Add a question to a quiz
  addQuestionToQuiz: async (quizId, questionId, position = null) => {
    try {
      const response = await apiClient.post(`/quizzes/${quizId}/questions`, {
        questionId,
        position,
      });
      return response.data;
    } catch (error) {
      console.error('Error adding question to quiz:', error);
      throw error;
    }
  },
};

// ==================== ATTEMPT API ====================
export const attemptApi = {
  // Start a new quiz attempt
  startAttempt: async (quizId, userId, metadata = {}) => {
    try {
      const response = await apiClient.post('/attempts', {
        quizId,
        userId,
        metadata,
      });
      return response.data;
    } catch (error) {
      console.error('Error starting attempt:', error);
      throw error;
    }
  },

  // Get attempt by ID
  getAttemptById: async (attemptId) => {
    try {
      const response = await apiClient.get(`/attempts/${attemptId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching attempt:', error);
      throw error;
    }
  },

  // Get all attempts for a user
  getUserAttempts: async (userId) => {
    try {
      // Add cache-busting timestamp to force fresh data
      const response = await apiClient.get('/attempts', {
        params: { 
          userId,
          _t: Date.now() // Cache buster
        },
      });
      console.log('[API] getUserAttempts raw response:', response.data);
      console.log('[API] Attempt count:', response.data.attempts?.length);
      console.log('[API] Sample statuses:', response.data.attempts?.slice(0, 10).map(a => ({
        id: a.attemptId?.substring(0, 8),
        status: a.status,
        completed_at: a.completedAt
      })));
      return response.data;
    } catch (error) {
      console.error('Error fetching user attempts:', error);
      throw error;
    }
  },

  // Get responses for an attempt
  getAttemptResponses: async (attemptId) => {
    try {
      const response = await apiClient.get(`/attempts/${attemptId}/responses`);
      return response.data;
    } catch (error) {
      console.error('Error fetching attempt responses:', error);
      throw error;
    }
  },

  // Complete an attempt
  completeAttempt: async (attemptId) => {
    try {
      const response = await apiClient.post(`/attempts/${attemptId}/complete`);
      return response.data;
    } catch (error) {
      console.error('Error completing attempt:', error);
      throw error;
    }
  },
};

// ==================== RESPONSE API ====================
export const responseApi = {
  // Submit an answer
  submitAnswer: async (attemptId, questionId, answerPayload, pointsPossible) => {
    try {
      const response = await apiClient.post('/responses', {
        attemptId,
        questionId,
        answerPayload,
        pointsPossible,
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  },

  // Get response by ID
  getResponseById: async (responseId) => {
    try {
      const response = await apiClient.get(`/responses/${responseId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching response:', error);
      throw error;
    }
  },

  // Grade a response (for admins)
  gradeResponse: async (responseId, pointsEarned, isCorrect, gradingDetails = {}) => {
    try {
      const response = await apiClient.post(`/responses/${responseId}/grade`, {
        pointsEarned,
        isCorrect,
        gradingDetails,
      });
      return response.data;
    } catch (error) {
      console.error('Error grading response:', error);
      throw error;
    }
  },
};

// ==================== ASSIGNMENT API ====================
export const assignmentApi = {
  // Get all assignments for the current user
  getMyAssignments: async (status = null) => {
    try {
      const params = status ? { status } : {};
      const response = await apiClient.get('/my-assignments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user assignments:', error);
      throw error;
    }
  },

  // Get all assignments (for content creators/admins)
  getAllAssignments: async (page = 1, pageSize = 20, quizId = null, userId = null, status = null) => {
    try {
      const params = { page, pageSize };
      if (quizId) params.quizId = quizId;
      if (userId) params.userId = userId;
      if (status) params.status = status;
      const response = await apiClient.get('/assignments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  },

  // Create a single assignment
  createAssignment: async (assignmentData) => {
    try {
      const response = await apiClient.post('/assignments', assignmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  },

  // Create bulk assignments
  createBulkAssignments: async (bulkAssignmentData) => {
    try {
      const response = await apiClient.post('/assignments/bulk', bulkAssignmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating bulk assignments:', error);
      throw error;
    }
  },

  // Update assignment
  updateAssignment: async (assignmentId, updateData) => {
    try {
      const response = await apiClient.put(`/assignments/${assignmentId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  },

  // Delete assignment
  deleteAssignment: async (assignmentId) => {
    try {
      const response = await apiClient.delete(`/assignments/${assignmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }
  },

  // Get specific assignment by ID
  getAssignmentById: async (assignmentId) => {
    try {
      const response = await apiClient.get(`/assignments/${assignmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assignment:', error);
      throw error;
    }
  },

  // Start an assignment
  startAssignment: async (assignmentId) => {
    try {
      const response = await apiClient.post(`/assignments/${assignmentId}/start`);
      return response.data;
    } catch (error) {
      console.error('Error starting assignment:', error);
      throw error;
    }
  },

  // Complete an assignment with score
  completeAssignment: async (assignmentId, score) => {
    try {
      const response = await apiClient.post(`/assignments/${assignmentId}/complete`, {
        score,
      });
      return response.data;
    } catch (error) {
      console.error('Error completing assignment:', error);
      throw error;
    }
  },
};

// ==================== PLAYER API ====================
export const playerApi = {
  // Get all players (for content creators/admins)
  getAllPlayers: async (page = 1, pageSize = 20) => {
    try {
      const params = { page, pageSize };
      const response = await apiClient.get('/players', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching players:', error);
      throw error;
    }
  },

  // Get player by ID
  getPlayerById: async (playerId) => {
    try {
      const response = await apiClient.get(`/players/${playerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching player:', error);
      throw error;
    }
  },
};

// ==================== HELPER FUNCTIONS ====================
export const helpers = {
  // Generate a simple user ID (for demo purposes)
  generateUserId: (role) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${role}_${timestamp}_${random}`;
  },

  // Get user ID from JWT token
  getUserId: (role) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.error('No authentication token found');
      return null;
    }
    
    try {
      // Decode JWT token to extract user ID
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const userId = decoded.userId || decoded.sub || decoded.user_id;
      
      if (!userId) {
        console.error('No user ID found in token');
        return null;
      }
      
      return userId;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  // Calculate stats from attempts
  calculateAttemptStats: (attempts) => {
    if (!attempts || attempts.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        averageScore: 0,
      };
    }

    const completed = attempts.filter(a => a.status === 'completed');
    const inProgress = attempts.filter(a => a.status === 'in_progress');
    
    // Count unique quizzes that have been completed (not total attempts)
    const uniqueCompletedQuizzes = new Set(
      completed.map(a => a.quizId)
    ).size;
    
    const avgScore = completed.length > 0
      ? completed.reduce((sum, a) => sum + (a.scorePercentage || 0), 0) / completed.length
      : 0;

    return {
      total: attempts.length,
      completed: uniqueCompletedQuizzes, // Changed: now counts unique quizzes, not attempts
      inProgress: inProgress.length,
      averageScore: Math.round(avgScore),
    };
  },
};

export default apiClient;
