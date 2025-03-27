// Centralized Supabase configuration

// Environment variables
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || "",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  serviceKey: import.meta.env.SUPABASE_SERVICE_KEY || "",
  projectId: import.meta.env.SUPABASE_PROJECT_ID || "",
};

// Validation function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!SUPABASE_CONFIG.url && !!SUPABASE_CONFIG.anonKey;
}

// Auth configuration
export const AUTH_CONFIG = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  // JWT and token configuration
  tokenRefreshMargin: 60, // Seconds before expiry to refresh token
  jwtExpiryTime: 3600, // 1 hour in seconds
  refreshTokenRotationEnabled: true,
  // MFA configuration
  mfa: {
    enabled: true,
    // Optional: default factor type (totp, sms, etc.)
    defaultFactorType: "totp",
  },
  // Password policy
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  // Rate limiting
  rateLimit: {
    enabled: true,
    maxAttempts: {
      login: 5, // Max failed login attempts
      register: 3, // Max registration attempts
      reset: 3, // Max password reset attempts
    },
    timeWindow: 60 * 60, // Time window in seconds (1 hour)
  },
  // Session security
  sessionSecurity: {
    ipPinning: true,
    userAgentCheck: true,
    shortLivedTokensForSensitiveActions: true,
    sensitiveActionTokenExpiry: 300, // 5 minutes in seconds
  },
};

// Storage configuration
export const STORAGE_CONFIG = {
  avatars: {
    bucketName: "avatars",
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },
  documents: {
    bucketName: "documents",
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
};

// Table names
export const TABLES = {
  PROFILES: "profiles",
  LOADS: "loads",
  MESSAGES: "messages",
  DOCUMENTS: "documents",
  LOCATIONS: "locations",
  GEOFENCES: "geofences",
  NOTIFICATIONS: "notifications",
  AUTH_ATTEMPTS: "auth_attempts", // Table for tracking auth attempts
  USER_FACTORS: "user_factors", // Table for MFA factors
  AUTH_LOGS: "auth_logs", // Table for authentication event logging
  EMAIL_TEMPLATES: "email_templates", // Table for customizable email templates
  REVOKED_TOKENS: "revoked_tokens", // Table for tracking revoked tokens
  SESSION_SECURITY: "session_security", // Table for session security information
};

// Error messages
export const ERROR_MESSAGES = {
  // Original error messages
  missingConfig:
    "Missing Supabase environment variables. Authentication will not work.",
  configAlert:
    "Supabase configuration is missing. Please check your environment variables.",
  // Session security errors
  SESSION_IP_MISMATCH:
    "Your session appears to be from a different location. Please log in again for security reasons.",
  SESSION_DEVICE_MISMATCH:
    "Your session appears to be from a different device. Please log in again for security reasons.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  TOKEN_REVOKED: "Your access has been revoked. Please log in again.",
  SENSITIVE_ACTION_UNAUTHORIZED:
    "This action requires recent authentication. Please verify your identity to continue.",

  // Authentication errors
  INVALID_CREDENTIALS:
    "The email or password you entered is incorrect. Please try again.",
  EMAIL_NOT_CONFIRMED: "Please verify your email address before logging in.",
  USER_EXISTS:
    "An account with this email already exists. Try logging in instead.",
  PASSWORD_TOO_SHORT: "Your password must be at least 8 characters long.",
  PASSWORD_REQUIREMENTS:
    "Password must include uppercase, lowercase, number, and special character.",
  RESET_THROTTLED:
    "For security purposes, you can only request a password reset once every 60 seconds.",
  EMAIL_RATE_LIMIT: "Too many requests. Please try again later.",
  SAME_PASSWORD:
    "Your new password must be different from your current password.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_ROLE: "The selected role is not valid.",
  PROFILE_CREATION_FAILED:
    "Your account was created but we couldn't set up your profile. Please contact support.",
  MISSING_ROLE:
    "Your user account is missing role information. Please contact support.",
  NO_USER: "No authenticated user found. Please log in again.",
  ACCOUNT_DELETION_FAILED:
    "We couldn't delete your account. Please try again or contact support.",
  RATE_LIMITED: "Too many attempts. Please try again after some time.",
  MFA_REQUIRED: "Multi-factor authentication is required to continue.",
  MFA_SETUP_REQUIRED:
    "Please set up multi-factor authentication for your account.",
  MFA_INVALID_CODE: "Invalid verification code. Please try again.",
  MFA_SETUP_FAILED:
    "Failed to set up multi-factor authentication. Please try again.",
  INVALID_FILE_TYPE: "The file type is not supported.",
  FILE_TOO_LARGE: "The file is too large. Maximum size is {size}MB.",
  AVATAR_UPLOAD_FAILED: "Failed to upload avatar. Please try again.",

  // Generic errors
  GENERIC: "Something went wrong. Please try again later.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  SERVER_ERROR:
    "Server error. Our team has been notified and is working on it.",

  // Success messages
  LOGIN_SUCCESS: "Login successful. Welcome back!",
  REGISTER_SUCCESS:
    "Registration successful. Please check your email to verify your account.",
  PASSWORD_RESET_EMAIL_SENT:
    "Password reset email sent. Please check your inbox.",
  PASSWORD_UPDATED: "Your password has been successfully updated.",
  PROFILE_UPDATED: "Your profile has been successfully updated.",
  ACCOUNT_DELETED: "Your account has been successfully deleted.",
  LOGOUT_SUCCESS: "You have been successfully logged out.",
  MFA_ENABLED: "Multi-factor authentication has been enabled for your account.",
  MFA_DISABLED:
    "Multi-factor authentication has been disabled for your account.",
  AVATAR_UPDATED: "Your profile picture has been updated successfully.",
};

// Redirect URLs
export const REDIRECT_URLS = {
  AFTER_LOGIN: "/",
  AFTER_REGISTER: "/verify-email",
  AFTER_LOGOUT: "/login",
  AFTER_PASSWORD_RESET: "/reset-password",
  EMAIL_VERIFICATION: "/verify-email",
  MFA_SETUP: "/mfa-setup",
  MFA_CHALLENGE: "/mfa-challenge",
};
