import { supabase } from "./supabase";
import {
  UserProfile,
  UserRole,
  AuthResponse,
  MFASetupInfo,
} from "./auth.types";
import {
  getAuthErrorMessage,
  validatePassword,
  isValidEmail,
  formatUserProfile,
  sanitizeString,
  validateImageFile,
} from "./auth.utils";
import {
  ERROR_MESSAGES,
  TABLES,
  STORAGE_CONFIG,
} from "../config/supabase.config";
import {
  logAuthEvent,
  LogLevel,
  AuthEventType,
  getClientInfo,
} from "./auth.logger";

/**
 * Fetches a user profile from the database by user ID
 * @param userId The ID of the user to fetch the profile for
 * @returns The user profile or null if not found
 */
export const fetchUserProfile = async (
  userId: string,
): Promise<UserProfile | null> => {
  try {
    console.log("Fetching profile for user ID:", userId);
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      // If profile not found, check user metadata for role
      const { data: userData } = await supabase.auth.getUser(userId);
      if (userData?.user?.user_metadata?.role) {
        // Create a minimal profile based on auth metadata
        return {
          id: userId,
          role: userData.user.user_metadata.role as UserRole,
          created_at: new Date().toISOString(),
        } as UserProfile;
      }
      return null;
    }

    console.log("Profile data retrieved:", data);
    return data as UserProfile;
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    return null;
  }
};

/**
 * Authenticates a user with email and password
 * @param email User's email address
 * @param password User's password
 * @returns AuthResponse with success status and optional error message
 */
export const authenticateUser = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
    // Validate email format
    if (!isValidEmail(email)) {
      return { success: false, error: ERROR_MESSAGES.INVALID_EMAIL };
    }

    // Check rate limiting
    const rateLimitResult = await checkRateLimit(email, "login");
    if (!rateLimitResult.success) {
      return rateLimitResult;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error.message);
      // Record failed attempt
      await recordAuthAttempt(email, "login", false);
      // Get client info if available
      const clientInfo =
        typeof window !== "undefined"
          ? {
              ip_address: "client-side",
              user_agent: window.navigator.userAgent,
            }
          : {};

      // Log the failed login attempt
      await logAuthEvent({
        event_type: AuthEventType.LOGIN_FAILURE,
        email,
        level: LogLevel.WARNING,
        details: { error: error.message },
        ...clientInfo,
      });
      return { success: false, error: getAuthErrorMessage(error) };
    }

    // Record successful attempt
    await recordAuthAttempt(email, "login", true);
    // Get client info if available
    const clientInfo =
      typeof window !== "undefined"
        ? {
            ip_address: "client-side",
            user_agent: window.navigator.userAgent,
          }
        : {};

    // Log the successful login
    await logAuthEvent({
      event_type: AuthEventType.LOGIN_SUCCESS,
      user_id: data.user?.id,
      email,
      level: LogLevel.INFO,
      ...clientInfo,
    });

    // Set custom claims if needed
    if (data.user) {
      await setUserClaims(data.user.id);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in authenticateUser:", error);
    return { success: false, error: getAuthErrorMessage(error) };
  }
};

/**
 * Registers a new user with Supabase and creates their profile
 * @param email User's email address
 * @param password User's password
 * @param role User's role in the system
 * @param profileData Optional additional profile data
 * @returns AuthResponse with success status and optional error message
 */
export const registerUser = async (
  email: string,
  password: string,
  role: UserRole,
  profileData?: Partial<UserProfile>,
): Promise<AuthResponse> => {
  try {
    // Validate email format
    if (!isValidEmail(email)) {
      return { success: false, error: ERROR_MESSAGES.INVALID_EMAIL };
    }

    // Check rate limiting
    const rateLimitResult = await checkRateLimit(email, "register");
    if (!rateLimitResult.success) {
      return rateLimitResult;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.message };
    }

    // Validate role
    if (!["admin", "driver", "carrier", "shipper"].includes(role)) {
      return { success: false, error: ERROR_MESSAGES.INVALID_ROLE };
    }

    // Sanitize profile data
    const sanitizedProfileData = profileData
      ? sanitizeProfileData(profileData)
      : {};

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
        },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (error) {
      console.error("Registration error:", error.message);
      // Record failed attempt
      await recordAuthAttempt(email, "register", false);
      // Log the failed registration
      await logAuthEvent({
        event_type: AuthEventType.REGISTER,
        email,
        role,
        level: LogLevel.WARNING,
        details: { error: error.message },
      });
      return { success: false, error: getAuthErrorMessage(error) };
    }

    // Record successful attempt
    await recordAuthAttempt(email, "register", true);
    // Log the successful registration
    await logAuthEvent({
      event_type: AuthEventType.REGISTER,
      user_id: data.user?.id,
      email,
      role,
      level: LogLevel.INFO,
    });

    // Create user profile in the database
    if (data.user) {
      const profileToInsert = {
        id: data.user.id,
        email: email,
        role: role,
        first_name: sanitizedProfileData.first_name || "",
        last_name: sanitizedProfileData.last_name || "",
        phone: sanitizedProfileData.phone || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        preferences: sanitizedProfileData.preferences || {},
      };

      const { error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .insert([profileToInsert]);

      if (profileError) {
        console.error("Error creating profile:", profileError);
        return {
          success: false,
          error: ERROR_MESSAGES.PROFILE_CREATION_FAILED,
        };
      }

      // Set custom claims
      await setUserClaims(data.user.id);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in registerUser:", error);
    return { success: false, error: getAuthErrorMessage(error) };
  }
};

/**
 * Initiates the password reset process for a user
 * @param email Email address of the user requesting password reset
 * @returns AuthResponse with success status and optional error message
 */
export const resetUserPassword = async (
  email: string,
): Promise<AuthResponse> => {
  try {
    // Validate email format
    if (!isValidEmail(email)) {
      return { success: false, error: ERROR_MESSAGES.INVALID_EMAIL };
    }

    // Check rate limiting
    const rateLimitResult = await checkRateLimit(email, "reset");
    if (!rateLimitResult.success) {
      return rateLimitResult;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error("Password reset error:", error.message);
      // Record failed attempt
      await recordAuthAttempt(email, "reset", false);
      // Log the failed password reset request
      await logAuthEvent({
        event_type: AuthEventType.PASSWORD_RESET_REQUEST,
        email,
        level: LogLevel.WARNING,
        details: { error: error.message },
      });
      return { success: false, error: getAuthErrorMessage(error) };
    }

    // Record successful attempt
    await recordAuthAttempt(email, "reset", true);
    // Log the successful password reset request
    await logAuthEvent({
      event_type: AuthEventType.PASSWORD_RESET_REQUEST,
      email,
      level: LogLevel.INFO,
    });

    return { success: true };
  } catch (error) {
    console.error("Error in resetUserPassword:", error);
    return { success: false, error: getAuthErrorMessage(error) };
  }
};

/**
 * Updates the password for the currently authenticated user
 * @param password New password to set
 * @returns AuthResponse with success status and optional error message
 */
export const updateUserPassword = async (
  password: string,
): Promise<AuthResponse> => {
  try {
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.message };
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error("Password update error:", error.message);
      // Log the failed password update
      await logAuthEvent({
        event_type: AuthEventType.PASSWORD_RESET_COMPLETE,
        user_id: supabase.auth.getUser().then((res) => res.data.user?.id),
        level: LogLevel.WARNING,
        details: { error: error.message },
      });
      return { success: false, error: getAuthErrorMessage(error) };
    }

    // Log the successful password update
    await logAuthEvent({
      event_type: AuthEventType.PASSWORD_RESET_COMPLETE,
      user_id: supabase.auth.getUser().then((res) => res.data.user?.id),
      level: LogLevel.INFO,
    });

    return { success: true };
  } catch (error) {
    console.error("Error in updateUserPassword:", error);
    return { success: false, error: getAuthErrorMessage(error) };
  }
};

/**
 * Updates the profile information for the currently authenticated user
 * @param userId User ID to update
 * @param profileData Partial profile data to update
 * @returns AuthResponse with success status and optional error message
 */
export const updateUserProfile = async (
  userId: string,
  profileData: Partial<UserProfile>,
): Promise<AuthResponse> => {
  try {
    if (!userId) {
      return { success: false, error: ERROR_MESSAGES.NO_USER };
    }

    // Sanitize and validate profile data
    const sanitizedData = sanitizeProfileData(profileData);

    // Format the profile data
    const formattedData = formatUserProfile(sanitizedData);

    // Update user metadata if needed
    if (profileData.role) {
      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: { role: profileData.role },
      });

      if (userUpdateError) {
        console.error("User metadata update error:", userUpdateError);
        return { success: false, error: getAuthErrorMessage(userUpdateError) };
      }

      // Update custom claims if role is being updated
      await setUserClaims(userId);
    }

    // Update profile in database
    const { error: profileUpdateError } = await supabase
      .from(TABLES.PROFILES)
      .update({
        ...formattedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileUpdateError) {
      console.error("Profile update error:", profileUpdateError);
      // Log the failed profile update
      await logAuthEvent({
        event_type: AuthEventType.PROFILE_UPDATE,
        user_id: userId,
        level: LogLevel.WARNING,
        details: { error: profileUpdateError.message },
      });
      return { success: false, error: getAuthErrorMessage(profileUpdateError) };
    }

    // Log the successful profile update
    await logAuthEvent({
      event_type: AuthEventType.PROFILE_UPDATE,
      user_id: userId,
      level: LogLevel.INFO,
      details: { updated_fields: Object.keys(formattedData) },
    });

    return { success: true };
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    return { success: false, error: getAuthErrorMessage(error) };
  }
};

/**
 * Deletes the user's account and profile
 * @param userId User ID to delete
 * @returns AuthResponse with success status and optional error message
 */
export const deleteUserAccount = async (
  userId: string,
): Promise<AuthResponse> => {
  try {
    if (!userId) {
      return { success: false, error: ERROR_MESSAGES.NO_USER };
    }

    // Delete user avatar from storage if it exists
    await deleteUserAvatar(userId);

    // Delete profile from database first
    const { error: profileDeleteError } = await supabase
      .from(TABLES.PROFILES)
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      console.error("Profile deletion error:", profileDeleteError);
      return { success: false, error: getAuthErrorMessage(profileDeleteError) };
    }

    // Delete user from auth
    const { error: userDeleteError } =
      await supabase.auth.admin.deleteUser(userId);

    if (userDeleteError) {
      console.error("User deletion error:", userDeleteError);
      // Log the failed account deletion
      await logAuthEvent({
        event_type: "account_deletion_failure",
        user_id: userId,
        level: LogLevel.ERROR,
        details: { error: userDeleteError.message },
      });
      return { success: false, error: getAuthErrorMessage(userDeleteError) };
    }

    // Log the successful account deletion
    await logAuthEvent({
      event_type: "account_deletion",
      level: LogLevel.SECURITY,
      details: { user_id: userId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error in deleteUserAccount:", error);
    return { success: false, error: ERROR_MESSAGES.ACCOUNT_DELETION_FAILED };
  }
};

/**
 * Uploads a user avatar to Supabase Storage
 * @param userId User's ID
 * @param file File to upload
 * @returns Object indicating success or failure with optional error message and file URL
 */
export const uploadUserAvatar = async (
  userId: string,
  file: File,
): Promise<AuthResponse & { url?: string }> => {
  try {
    // Validate file type and size
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.message };
    }

    // Delete existing avatar if it exists
    await deleteUserAvatar(userId);

    // Upload new avatar
    const fileName = `${userId}-${Date.now()}`;
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.avatars.bucketName)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Avatar upload error:", error);
      return { success: false, error: ERROR_MESSAGES.AVATAR_UPLOAD_FAILED };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_CONFIG.avatars.bucketName)
      .getPublicUrl(fileName);

    // Update profile with avatar URL
    const { error: updateError } = await supabase
      .from(TABLES.PROFILES)
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", userId);

    if (updateError) {
      console.error("Profile update error after avatar upload:", updateError);
      return { success: false, error: getAuthErrorMessage(updateError) };
    }

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error("Error in uploadUserAvatar:", error);
    return { success: false, error: getAuthErrorMessage(error) };
  }
};

/**
 * Deletes a user's avatar from Supabase Storage
 * @param userId User's ID
 * @returns Object indicating success or failure with optional error message
 */
export const deleteUserAvatar = async (
  userId: string,
): Promise<AuthResponse> => {
  try {
    // Get user profile to check if avatar exists
    const { data: profile } = await supabase
      .from(TABLES.PROFILES)
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (profile?.avatar_url) {
      // Extract filename from URL
      const url = new URL(profile.avatar_url);
      const pathSegments = url.pathname.split("/");
      const filename = pathSegments[pathSegments.length - 1];

      // Delete file from storage
      const { error } = await supabase.storage
        .from(STORAGE_CONFIG.avatars.bucketName)
        .remove([filename]);

      if (error) {
        console.error("Error deleting avatar file:", error);
        return { success: false, error: getAuthErrorMessage(error) };
      }

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from(TABLES.PROFILES)
        .update({ avatar_url: null })
        .eq("id", userId);

      if (updateError) {
        console.error(
          "Error updating profile after avatar deletion:",
          updateError,
        );
        return { success: false, error: getAuthErrorMessage(updateError) };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteUserAvatar:", error);
    return { success: false, error: getAuthErrorMessage(error) };
  }
};

/**
 * Enables multi-factor authentication for a user
 * @returns Object with MFA setup information
 */
export const enableMFA = async (): Promise<
  AuthResponse & { setupInfo?: MFASetupInfo }
> => {
  try {
    // Enroll the user in MFA
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
    });

    if (error) {
      console.error("MFA enrollment error:", error);
      // Log the failed MFA enrollment
      await logAuthEvent({
        event_type: AuthEventType.MFA_ENABLED,
        user_id: supabase.auth.getUser().then((res) => res.data.user?.id),
        level: LogLevel.WARNING,
        details: { error: error.message },
      });
      return { success: false, error: getAuthErrorMessage(error) };
    }

    // Log the successful MFA enrollment
    await logAuthEvent({
      event_type: AuthEventType.MFA_ENABLED,
      user_id: supabase.auth.getUser().then((res) => res.data.user?.id),
      level: LogLevel.SECURITY,
      details: { factor_type: "totp" },
    });

    // Create setup info object
    const setupInfo: MFASetupInfo = {
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      challengeId: data.id, // For verification
      recoveryCodes: [], // Would be populated after verification
    };

    return {
      success: true,
      setupInfo,
    };
  } catch (error) {
    console.error("Error in enableMFA:", error);
    return { success: false, error: getAuthErrorMessage(error) };
  }
};

/**
 * Verifies a multi-factor authentication challenge
 * @param factorId The MFA factor ID
 * @param challengeId The challenge ID
 * @param code The verification code
 * @returns Object indicating success or failure
 */
export const verifyMFA = async (
  factorId: string,
  challengeId: string,
  code: string,
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.mfa.challenge({
      factorId,
      challengeId,
      code,
    });

    if (error) {
      console.error("MFA verification error:", error);
      // Log the failed MFA verification
      await logAuthEvent({
        event_type: AuthEventType.MFA_CHALLENGE_FAILURE,
        user_id: supabase.auth.getUser().then((res) => res.data.user?.id),
        level: LogLevel.WARNING,
        details: { factor_id: factorId },
      });
      return { success: false, error: ERROR_MESSAGES.MFA_INVALID_CODE };
    }

    // Log the successful MFA verification
    await logAuthEvent({
      event_type: AuthEventType.MFA_CHALLENGE_SUCCESS,
      user_id: supabase.auth.getUser().then((res) => res.data.user?.id),
      level: LogLevel.INFO,
      details: { factor_id: factorId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error in verifyMFA:", error);
    return { success: false, error: getAuthErrorMessage(error) };
  }
};

/**
 * Disables multi-factor authentication for a user
 * @param factorId The MFA factor ID to disable
 * @returns Object indicating success or failure
 */
export const disableMFA = async (factorId: string): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });

    if (error) {
      console.error("MFA unenrollment error:", error);
      // Log the failed MFA disablement
      await logAuthEvent({
        event_type: AuthEventType.MFA_DISABLED,
        user_id: supabase.auth.getUser().then((res) => res.data.user?.id),
        level: LogLevel.WARNING,
        details: { factor_id: factorId, error: error.message },
      });
      return { success: false, error: getAuthErrorMessage(error) };
    }

    // Log the successful MFA disablement
    await logAuthEvent({
      event_type: AuthEventType.MFA_DISABLED,
      user_id: supabase.auth.getUser().then((res) => res.data.user?.id),
      level: LogLevel.SECURITY,
      details: { factor_id: factorId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error in disableMFA:", error);
    return { success: false, error: getAuthErrorMessage(error) };
  }
};

/**
 * Sets custom claims for a user using Supabase Edge Functions
 * @param userId User's ID
 * @returns Object indicating success or failure with optional error message
 */
export const setUserClaims = async (userId: string): Promise<AuthResponse> => {
  try {
    // Get user profile to get role
    const profile = await fetchUserProfile(userId);
    if (!profile) {
      return { success: false, error: "User profile not found" };
    }

    // Update user metadata with role
    const { error } = await supabase.auth.updateUser({
      data: {
        role: profile.role,
        updated_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.error("Error setting user claims:", error);
      return { success: false, error: getAuthErrorMessage(error) };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in setUserClaims:", error);
    return { success: false, error: getAuthErrorMessage(error) };
  }
};

/**
 * Sanitizes profile data to prevent malicious data from being stored
 * @param profileData Profile data to sanitize
 * @returns Sanitized profile data
 */
const sanitizeProfileData = (
  profileData: Partial<UserProfile>,
): Partial<UserProfile> => {
  const sanitized: Partial<UserProfile> = {};

  // Whitelist approach - only copy allowed fields
  const allowedFields = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "role",
    "company_id",
    "address",
    "city",
    "state",
    "zip",
    "country",
    "bio",
    "preferences",
  ];

  for (const field of allowedFields) {
    if (field in profileData) {
      // Type assertion to access dynamic properties
      const value = profileData[field as keyof Partial<UserProfile>];

      // Basic sanitization - convert to string and trim
      if (typeof value === "string") {
        // Sanitize string values - remove HTML tags and trim
        sanitized[field as keyof Partial<UserProfile>] = sanitizeString(
          value,
        ) as any;
      } else if (field === "preferences" && typeof value === "object") {
        // For objects like preferences, do a deep sanitization
        sanitized.preferences = JSON.parse(
          JSON.stringify(value).replace(/<[^>]*>/g, ""),
        );
      } else {
        // For other types, just copy as is
        sanitized[field as keyof Partial<UserProfile>] = value;
      }
    }
  }

  return sanitized;
};

/**
 * Checks if a user has exceeded rate limits for authentication actions
 * @param email User's email
 * @param action The action being performed (login, register, reset)
 * @returns Object indicating if the action should proceed
 */
const checkRateLimit = async (
  email: string,
  action: "login" | "register" | "reset",
): Promise<AuthResponse> => {
  try {
    // Get rate limit configuration
    const maxAttempts = {
      login: 5,
      register: 3,
      reset: 3,
    };
    const timeWindow = 60 * 60; // 1 hour in seconds

    // Calculate the timestamp for the start of the time window
    const now = new Date();
    const timeWindowStart = new Date(
      now.getTime() - timeWindow * 1000,
    ).toISOString();

    // Count failed attempts within the time window
    const { data, error } = await supabase
      .from(TABLES.AUTH_ATTEMPTS)
      .select("*")
      .eq("email", email)
      .eq("action", action)
      .eq("success", false)
      .gte("created_at", timeWindowStart);

    if (error) {
      console.error("Error counting attempts:", error);
      // If there's an error, allow the action to proceed
      return { success: true };
    }

    // Check if the user has exceeded the rate limit
    if (data && data.length >= maxAttempts[action]) {
      return {
        success: false,
        error: ERROR_MESSAGES.RATE_LIMITED,
      };
    }

    // User has not exceeded the rate limit
    return { success: true };
  } catch (error) {
    console.error("Error checking rate limit:", error);
    // If there's an error, allow the action to proceed
    return { success: true };
  }
};

/**
 * Records an authentication attempt for rate limiting purposes
 * @param email User's email
 * @param action The action being performed (login, register, reset)
 * @param success Whether the attempt was successful
 */
const recordAuthAttempt = async (
  email: string,
  action: "login" | "register" | "reset",
  success: boolean,
): Promise<void> => {
  try {
    // Insert the auth attempt record
    const { error } = await supabase.from(TABLES.AUTH_ATTEMPTS).insert([
      {
        email,
        action,
        success,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error recording auth attempt:", error);
      // Non-critical error, can be ignored
    }
  } catch (error) {
    console.error("Error in recordAuthAttempt:", error);
    // Non-critical error, can be ignored
  }
};
