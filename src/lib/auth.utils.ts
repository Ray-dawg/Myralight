import { AuthError } from "@supabase/supabase-js";
import { ERROR_MESSAGES } from "../config/supabase.config";

/**
 * Maps Supabase error codes to user-friendly error messages
 * @param error The error object from Supabase
 * @returns A user-friendly error message
 */
export const getAuthErrorMessage = (
  error: AuthError | Error | unknown,
): string => {
  // Handle AuthError from Supabase
  if (error instanceof AuthError) {
    // Check for specific error codes and return user-friendly messages
    switch (error.message) {
      case "Invalid login credentials":
        return (
          ERROR_MESSAGES.INVALID_CREDENTIALS ||
          "The email or password you entered is incorrect. Please try again."
        );
      case "Email not confirmed":
        return (
          ERROR_MESSAGES.EMAIL_NOT_CONFIRMED ||
          "Please verify your email address before logging in."
        );
      case "User already registered":
        return (
          ERROR_MESSAGES.USER_EXISTS ||
          "An account with this email already exists. Try logging in instead."
        );
      case "Password should be at least 6 characters":
        return (
          ERROR_MESSAGES.PASSWORD_TOO_SHORT ||
          "Your password must be at least 8 characters long."
        );
      case "For security purposes, you can only request this once every 60 seconds":
        return (
          ERROR_MESSAGES.RESET_THROTTLED ||
          "For security purposes, you can only request a password reset once every 60 seconds."
        );
      case "Email rate limit exceeded":
        return (
          ERROR_MESSAGES.EMAIL_RATE_LIMIT ||
          "Too many requests. Please try again later."
        );
      case "New password should be different from the old password":
        return (
          ERROR_MESSAGES.SAME_PASSWORD ||
          "Your new password must be different from your current password."
        );
      case "Auth session missing!":
        return (
          ERROR_MESSAGES.SESSION_EXPIRED ||
          "Your session has expired. Please log in again."
        );
      case "Failed to verify TOTP code":
        return "The verification code you entered is incorrect. Please try again.";
      case "Factor not found":
        return "The authentication factor was not found. Please contact support.";
      case "Invalid factor type":
        return "Invalid authentication method. Please try again or contact support.";
      default:
        // Log the original error for debugging
        console.error("Unhandled auth error:", error);
        return error.message || ERROR_MESSAGES.GENERIC;
    }
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    console.error("Generic error in auth:", error);
    return error.message || ERROR_MESSAGES.GENERIC;
  }

  // Handle unknown error types
  console.error("Unknown error type in auth:", error);
  return ERROR_MESSAGES.GENERIC;
};

/**
 * Validates an email address format
 * @param email The email address to validate
 * @returns True if the email format is valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param password The password to validate
 * @returns An object with validation result and optional error message
 */
export const validatePassword = (
  password: string,
): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long.",
    };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter.",
    };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter.",
    };
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number.",
    };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one special character.",
    };
  }

  return { valid: true };
};

/**
 * Formats user profile data for display or storage
 * @param profile The user profile to format
 * @returns Formatted user profile
 */
export const formatUserProfile = (profile: any): any => {
  return {
    ...profile,
    // Format or transform fields as needed
    full_name:
      profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : undefined,
    created_at: profile.created_at
      ? new Date(profile.created_at).toISOString()
      : undefined,
    updated_at: new Date().toISOString(),
  };
};

/**
 * Validates a file to ensure it's a valid image and within size limits
 * @param file The file to validate
 * @returns An object with validation result and optional error message
 */
export const validateImageFile = (
  file: File,
): { valid: boolean; message?: string } => {
  // Check if file is an image
  if (!file.type.startsWith("image/")) {
    return {
      valid: false,
      message: "File must be an image (JPEG, PNG, etc.).",
    };
  }

  // Check file size (2MB limit)
  const maxSize = 2 * 1024 * 1024; // 2MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      message: "Image must be smaller than 2MB.",
    };
  }

  return { valid: true };
};

/**
 * Validates a phone number format
 * @param phone The phone number to validate
 * @returns An object with validation result and optional error message
 */
export const validatePhoneNumber = (
  phone: string,
): { valid: boolean; message?: string } => {
  // Basic phone validation - can be enhanced for specific country formats
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;

  if (!phoneRegex.test(phone.replace(/\s+/g, ""))) {
    return {
      valid: false,
      message: "Please enter a valid phone number.",
    };
  }

  return { valid: true };
};

/**
 * Sanitizes a string to prevent XSS attacks
 * @param input The string to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (input: string): string => {
  if (!input) return input;

  return input
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
    .trim();
};
