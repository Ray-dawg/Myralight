import { User, Session } from "@supabase/supabase-js";

/**
 * Defines the possible user roles in the application
 */
export type UserRole = "admin" | "driver" | "carrier" | "shipper";

/**
 * Represents a user profile with personal and role information
 */
export interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company_id?: string;
  role: UserRole;
  avatar_url?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  preferences?: Record<string, any>;
  full_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  bio?: string;
}

/**
 * Response type for authentication operations
 */
export interface AuthResponse {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * MFA factor types supported by the application
 */
export type MFAFactorType = "totp" | "sms";

/**
 * MFA setup information returned during enrollment
 */
export interface MFASetupInfo {
  factorId: string;
  qrCode?: string;
  secret?: string;
  recoveryCodes?: string[];
  challengeId?: string;
}

/**
 * Defines the shape of the authentication context
 * that will be provided throughout the application
 */
export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  login: (role: UserRole) => Promise<void>;
  loginWithCredentials: (
    email: string,
    password: string,
  ) => Promise<AuthResponse>;
  register: (
    email: string,
    password: string,
    role: UserRole,
    profile?: Partial<UserProfile>,
  ) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  loading: boolean;
  resetPassword: (email: string) => Promise<AuthResponse>;
  updatePassword: (password: string) => Promise<AuthResponse>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<AuthResponse>;
  deleteAccount: () => Promise<AuthResponse>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
  // New MFA methods
  enableMFA: () => Promise<AuthResponse & { setupInfo?: MFASetupInfo }>;
  verifyMFA: (
    factorId: string,
    challengeId: string,
    code: string,
  ) => Promise<AuthResponse>;
  disableMFA: (factorId: string) => Promise<AuthResponse>;
  // Avatar methods
  uploadAvatar: (file: File) => Promise<AuthResponse & { url?: string }>;
  deleteAvatar: () => Promise<AuthResponse>;
}

/**
 * Props for the AuthProvider component
 */
export interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  enabled: boolean;
  maxAttempts: Record<string, number>;
  timeWindow: number; // in seconds
}

/**
 * Auth attempt record for rate limiting
 */
export interface AuthAttempt {
  id: string;
  email: string;
  action: "login" | "register" | "reset";
  success: boolean;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Custom claims structure for JWT tokens
 */
export interface CustomClaims {
  role: UserRole;
  permissions?: string[];
}
