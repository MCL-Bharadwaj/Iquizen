# Authentication & Registration System with Stripe Payment - Proposal

## Project Overview
Create a comprehensive authentication system integrating with an external LMS API and Stripe payment processing for user registration.

---

## 1. Technical Architecture

### 1.1 External API Integration
- **Base URI**: `https://mcl-lms-dev.azurewebsites.net/api/`
- **Authentication**: JWT token-based
- **Integration Pattern**: Frontend → External LMS API (no backend proxy initially)

### 1.2 Stripe Payment Integration
- **Payment Flow**: Registration requires payment before account creation
- **Payment Method**: Stripe Checkout or Stripe Elements
- **Subscription Model**: One-time payment or recurring subscription (to be decided)

---

## 2. Authentication Endpoints

### 2.1 User Registration
**Endpoint**: `POST /v1/auth/register`

**Flow**:
1. User fills registration form (name, email, password)
2. User completes Stripe payment
3. On payment success, call registration API with payment details
4. Verify email sent to user
5. User clicks verification link
6. Account activated

**Request Body**:
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string",
  "stripePaymentIntentId": "string",
  "stripeCustomerId": "string"
}
```

### 2.2 User Login
**Endpoint**: `POST /v1/auth/login`

**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "token": "string",
  "user": {
    "userId": "guid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "string"
  }
}
```

### 2.3 Change Password
**Endpoint**: `POST /v1/auth/change-password/{userId}`

**Request Body**:
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

### 2.4 Forgot Password
**Endpoint**: `POST /v1/auth/forgot-password`

**Request Body**:
```json
{
  "email": "string"
}
```

**Flow**:
1. User enters email
2. System sends reset token via email
3. User receives email with reset link

### 2.5 Reset Password
**Endpoint**: `POST /v1/auth/reset-password`

**Request Body**:
```json
{
  "token": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

### 2.6 Verify Email
**Endpoint**: `POST /v1/auth/verify-email`

**Request Body**:
```json
{
  "token": "string"
}
```

---

## 3. Pages & Components to Create

### 3.1 Authentication Pages

#### A. LoginPage.jsx
- Email input
- Password input
- "Remember me" checkbox
- "Forgot Password?" link
- Login button
- "Don't have an account? Register" link
- Social login options (optional)

#### B. RegisterPage.jsx (Multi-step)
**Step 1: Account Information**
- First name
- Last name
- Email
- Password (with strength meter)
- Confirm password
- Terms & conditions checkbox

**Step 2: Payment**
- Stripe payment form
- Plan selection (if multiple plans)
- Payment summary
- Stripe Elements integration

**Step 3: Confirmation**
- Success message
- Email verification notice
- Redirect to login

#### C. ForgotPasswordPage.jsx
- Email input
- Submit button
- Back to login link
- Success message display

#### D. ResetPasswordPage.jsx
- New password input
- Confirm password input
- Submit button
- Password requirements display

#### E. VerifyEmailPage.jsx
- Automatic token verification on load
- Success/error message
- Redirect to login button

#### F. ChangePasswordPage.jsx (User Settings)
- Current password input
- New password input
- Confirm new password input
- Submit button

### 3.2 Shared Components

#### A. PasswordInput.jsx
- Show/hide password toggle
- Password strength indicator
- Validation messages

#### B. FormInput.jsx
- Reusable input with validation
- Error message display
- Icon support

#### C. AuthLayout.jsx
- Consistent layout for auth pages
- Logo
- Background gradient
- Footer

#### D. StripePaymentForm.jsx
- Stripe Elements wrapper
- Card input
- Payment processing state
- Error handling

---

## 4. Services & Utilities

### 4.1 API Service (authApi.js)
```javascript
// c:\CodeBaseV3\Quizz-MCL\SRC\quiz-app\src\services\authApi.js

const BASE_URL = 'https://mcl-lms-dev.azurewebsites.net/api';

export const authApi = {
  register: async (userData) => { /* ... */ },
  login: async (credentials) => { /* ... */ },
  changePassword: async (userId, passwords) => { /* ... */ },
  forgotPassword: async (email) => { /* ... */ },
  resetPassword: async (tokenData) => { /* ... */ },
  verifyEmail: async (token) => { /* ... */ }
};
```

### 4.2 Stripe Service (stripeService.js)
```javascript
// c:\CodeBaseV3\Quizz-MCL\SRC\quiz-app\src\services\stripeService.js

import { loadStripe } from '@stripe/stripe-js';

export const stripeService = {
  initializeStripe: async () => { /* ... */ },
  createPaymentIntent: async (amount) => { /* ... */ },
  confirmPayment: async (paymentIntent) => { /* ... */ }
};
```

### 4.3 Auth Context (AuthContext.jsx)
```javascript
// c:\CodeBaseV3\Quizz-MCL\SRC\quiz-app\src\context\AuthContext.jsx

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Methods: login, logout, register, refreshToken
};
```

### 4.4 Protected Route Component
```javascript
// c:\CodeBaseV3\Quizz-MCL\SRC\quiz-app\src\components\ProtectedRoute.jsx

export const ProtectedRoute = ({ children, requiredRole }) => {
  // Check authentication and role
  // Redirect if unauthorized
};
```

---

## 5. Stripe Integration Details

### 5.1 Required Stripe Components
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 5.2 Stripe Configuration
- **Publishable Key**: Store in `.env` as `VITE_STRIPE_PUBLISHABLE_KEY`
- **Pricing**: Define pricing plans (one-time or subscription)
- **Webhooks**: Handle payment success/failure (if backend exists)

### 5.3 Payment Flow
1. User fills registration form
2. Click "Continue to Payment"
3. Stripe Checkout/Elements loads
4. User enters card details
5. Payment processed
6. On success: Call `/v1/auth/register` with payment ID
7. Account created + verification email sent

### 5.4 Stripe Products to Create
- **Quiz Platform Access** - One-time payment (e.g., $49.99)
- **Premium Plan** - Monthly subscription (e.g., $9.99/month)
- **Enterprise Plan** - Annual subscription (e.g., $99.99/year)

---

## 6. User Experience Flow

### 6.1 Registration Flow
```
Landing Page
    ↓
Register Page (Step 1: Account Info)
    ↓
Register Page (Step 2: Payment with Stripe)
    ↓
Register Page (Step 3: Success)
    ↓
Email Verification Link Sent
    ↓
User Clicks Email Link
    ↓
Email Verified Page
    ↓
Login Page
    ↓
Dashboard
```

### 6.2 Login Flow
```
Login Page
    ↓
Enter Credentials
    ↓
API Call
    ↓
Store Token & User Data
    ↓
Role Selector (if multiple roles)
    ↓
Dashboard
```

### 6.3 Forgot Password Flow
```
Login Page → Forgot Password Link
    ↓
Forgot Password Page
    ↓
Enter Email → Submit
    ↓
Success Message (Check Email)
    ↓
User Receives Email with Token
    ↓
Clicks Reset Link
    ↓
Reset Password Page
    ↓
Enter New Password
    ↓
Success → Redirect to Login
```

---

## 7. State Management

### 7.1 Auth State (Context API)
```javascript
{
  user: {
    userId: "guid",
    email: "string",
    firstName: "string",
    lastName: "string",
    role: "string",
    isEmailVerified: boolean
  },
  token: "string",
  isAuthenticated: boolean,
  loading: boolean
}
```

### 7.2 Local Storage Keys
- `authToken`: JWT token
- `user`: User object
- `rememberMe`: Boolean for auto-login
- `stripeCustomerId`: Stripe customer reference

---

## 8. Security Considerations

### 8.1 Frontend Security
- Store JWT in httpOnly cookie (if backend supports) or localStorage with XSS protection
- Implement CSRF protection
- Validate all inputs client-side before API calls
- Use HTTPS only
- Sanitize user inputs

### 8.2 Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Show password strength meter

### 8.3 Stripe Security
- Never expose secret keys on frontend
- Use Stripe Elements (PCI compliant)
- Validate payment on backend (if implemented)
- Handle declined payments gracefully

---

## 9. Error Handling

### 9.1 API Error Messages
```javascript
{
  400: "Invalid input. Please check your data.",
  401: "Invalid credentials. Please try again.",
  403: "Access denied. Email not verified.",
  404: "User not found.",
  409: "Email already exists.",
  500: "Server error. Please try again later."
}
```

### 9.2 Payment Error Handling
- Card declined
- Insufficient funds
- Invalid card details
- Network error during payment
- Timeout errors

---

## 10. Environment Variables

### 10.1 Required Variables (.env)
```bash
# External LMS API
VITE_LMS_API_BASE_URL=https://mcl-lms-dev.azurewebsites.net/api

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# App Config
VITE_APP_NAME=Quiz Platform
VITE_SUPPORT_EMAIL=support@quizplatform.com
```

---

## 11. Testing Strategy

### 11.1 Unit Tests
- Form validation logic
- API service methods
- Auth context actions
- Password strength validator

### 11.2 Integration Tests
- Registration flow (without actual payment)
- Login flow
- Password reset flow
- Email verification flow

### 11.3 Manual Testing Checklist
- [ ] Register with valid payment
- [ ] Register with declined payment
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Login with unverified email
- [ ] Request password reset
- [ ] Reset password with valid token
- [ ] Reset password with expired token
- [ ] Change password while logged in
- [ ] Verify email with valid token
- [ ] Verify email with expired token

---

## 12. Implementation Timeline

### Phase 1: Core Authentication (Week 1)
- [ ] Create API service layer
- [ ] Build Login page
- [ ] Build Register page (Step 1 only)
- [ ] Implement Auth context
- [ ] Add protected routes

### Phase 2: Password Management (Week 1)
- [ ] Build Forgot Password page
- [ ] Build Reset Password page
- [ ] Build Change Password page
- [ ] Build Email Verification page

### Phase 3: Stripe Integration (Week 2)
- [ ] Setup Stripe account & keys
- [ ] Install Stripe dependencies
- [ ] Create Stripe service
- [ ] Build payment form component
- [ ] Integrate payment into registration (Step 2)
- [ ] Handle payment success/failure

### Phase 4: UI/UX Polish (Week 2)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success messages
- [ ] Implement password strength meter
- [ ] Add form validation
- [ ] Responsive design
- [ ] Dark/light theme support

### Phase 5: Testing & Deployment (Week 3)
- [ ] Write unit tests
- [ ] Manual testing
- [ ] Fix bugs
- [ ] Documentation
- [ ] Deploy to staging
- [ ] User acceptance testing

---

## 13. Dependencies to Install

```bash
# Stripe
npm install @stripe/stripe-js @stripe/react-stripe-js

# Form handling & validation
npm install react-hook-form zod @hookform/resolvers

# HTTP client (already installed)
# axios

# Password strength
npm install zxcvbn
npm install --save-dev @types/zxcvbn

# Icons (already installed)
# lucide-react
```

---

## 14. File Structure

```
SRC/quiz-app/src/
├── pages/
│   ├── Auth/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   ├── ResetPasswordPage.jsx
│   │   ├── VerifyEmailPage.jsx
│   │   └── ChangePasswordPage.jsx
│   └── ...existing pages
├── components/
│   ├── Auth/
│   │   ├── AuthLayout.jsx
│   │   ├── PasswordInput.jsx
│   │   ├── FormInput.jsx
│   │   ├── PasswordStrengthMeter.jsx
│   │   └── StripePaymentForm.jsx
│   ├── ProtectedRoute.jsx
│   └── ...existing components
├── context/
│   └── AuthContext.jsx
├── services/
│   ├── authApi.js
│   ├── stripeService.js
│   └── ...existing services
├── hooks/
│   ├── useAuth.js
│   └── useStripePayment.js
├── utils/
│   ├── validators.js
│   ├── passwordStrength.js
│   └── errorMessages.js
└── ...
```

---

## 15. Budget Estimate

### 15.1 Stripe Costs
- **Transaction Fee**: 2.9% + $0.30 per successful charge
- **Monthly Platform Fee**: $0 (with standard pricing)
- **Example**: $49.99 registration → Stripe fee: $1.75

### 15.2 Development Hours (Estimated)
- Core Authentication: 20 hours
- Password Management: 8 hours
- Stripe Integration: 12 hours
- UI/UX Polish: 10 hours
- Testing & Bug Fixes: 10 hours
- **Total**: ~60 hours

---

## 16. Post-Launch Considerations

### 16.1 Analytics
- Track registration conversion rate
- Monitor payment success/failure rates
- Track login frequency
- Monitor password reset requests

### 16.2 Future Enhancements
- Social login (Google, Facebook, Microsoft)
- Two-factor authentication (2FA)
- Remember device functionality
- Session management (logout from all devices)
- Password history (prevent reuse)
- Account lockout after failed attempts
- Email templates customization
- Subscription management page
- Invoice generation and download

---

## 17. Questions & Decisions Needed

### 17.1 Business Logic
1. **Payment Model**: One-time payment or subscription?
2. **Price Points**: What are the pricing tiers?
3. **Trial Period**: Offer free trial before payment?
4. **Refund Policy**: How to handle refunds?
5. **Email Verification**: Required before login or after?

### 17.2 Technical Decisions
1. **Token Storage**: localStorage, sessionStorage, or httpOnly cookie?
2. **Token Refresh**: Implement automatic token refresh?
3. **Role Management**: Single role or multiple roles per user?
4. **Backend Proxy**: Should we create a backend proxy for the LMS API?
5. **Error Logging**: Use error tracking service (Sentry, LogRocket)?

### 17.3 UX Decisions
1. **Registration Steps**: Single page or multi-step wizard?
2. **Payment Display**: Inline form or redirect to Stripe Checkout?
3. **Email Verification**: Block login until verified?
4. **Remember Me**: Default checked or unchecked?
5. **Auto-logout**: Timeout duration?

---

## 18. API Response Formats (Expected)

### 18.1 Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### 18.2 Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "field": "fieldName" // For validation errors
  }
}
```

---

## 19. Next Steps

1. **Review this proposal** with stakeholders
2. **Answer decision questions** in Section 17
3. **Finalize pricing** and payment model
4. **Setup Stripe account** and obtain API keys
5. **Test LMS API endpoints** with Postman/Insomnia
6. **Approve implementation timeline**
7. **Begin Phase 1 development**

---

## 20. Contact & Support

For questions or clarifications during implementation:
- Technical lead: [Name]
- Product owner: [Name]
- Stripe support: https://support.stripe.com

---

**Document Version**: 1.0  
**Created**: November 26, 2025  
**Last Updated**: November 26, 2025  
**Status**: Pending Approval
