/**
 * JWT Helper Utilities
 * Functions for decoding and validating JWT tokens
 */

/**
 * Decode JWT token to extract payload
 * @param {string} token - JWT token string
 * @returns {Object|null} Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
  try {
    if (!token) return null;

    // JWT structure: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64
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

/**
 * Extract user ID from JWT token
 * @param {string} token - JWT token
 * @returns {string|null} User ID or null
 */
export const getUserIdFromToken = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded) return null;
  
  // Try common claim names for user ID
  return decoded.userId || decoded.sub || decoded.user_id || null;
};

/**
 * Extract email from JWT token
 * @param {string} token - JWT token
 * @returns {string|null} Email or null
 */
export const getEmailFromToken = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded) return null;
  
  return decoded.email || null;
};

/**
 * Extract roles from JWT token
 * @param {string} token - JWT token
 * @returns {Array} Array of role strings
 */
export const getRolesFromToken = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded) return [];
  
  // Check for 'role' claim (can be string or array)
  const roles = decoded.role || decoded.roles || [];
  
  // Ensure it's always an array
  return Array.isArray(roles) ? roles : [roles];
};

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;
    
    // exp is in seconds, Date.now() is in milliseconds
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    
    return currentTime >= expirationTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Get token expiration date
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
export const getTokenExpiration = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return null;
  
  return new Date(decoded.exp * 1000);
};

/**
 * Check if user has a specific role
 * @param {string} token - JWT token
 * @param {string|Array} requiredRole - Role or array of roles to check
 * @returns {boolean} True if user has the role
 */
export const hasRole = (token, requiredRole) => {
  const userRoles = getRolesFromToken(token);
  
  if (Array.isArray(requiredRole)) {
    // Check if user has any of the required roles
    return requiredRole.some(role => userRoles.includes(role));
  } else {
    // Check if user has the specific role
    return userRoles.includes(requiredRole);
  }
};

/**
 * Get all claims from JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} All claims or null
 */
export const getAllClaims = (token) => {
  return decodeJWT(token);
};

/**
 * Pretty print JWT token payload (for debugging)
 * @param {string} token - JWT token
 */
export const debugToken = (token) => {
  const decoded = decodeJWT(token);
  if (decoded) {
    console.group('🔐 JWT Token Decoded');
    console.log('User ID:', getUserIdFromToken(token));
    console.log('Email:', getEmailFromToken(token));
    console.log('Roles:', getRolesFromToken(token));
    console.log('Expiration:', getTokenExpiration(token));
    console.log('Is Expired:', isTokenExpired(token));
    console.log('All Claims:', decoded);
    console.groupEnd();
  } else {
    console.error('Failed to decode token');
  }
};

export default {
  decodeJWT,
  getUserIdFromToken,
  getEmailFromToken,
  getRolesFromToken,
  isTokenExpired,
  getTokenExpiration,
  hasRole,
  getAllClaims,
  debugToken,
};
