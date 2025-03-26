import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "@/components/ui/use-toast";
import {
  UserRole,
  UserProfile,
  AuthResponse,
  AuthContextType,
  AuthProviderProps,
} from "./auth.types";
import {
  fetchUserProfile,
  authenticateUser,
  registerUser,
  resetUserPassword,
  updateUserPassword,
  updateUserProfile,
  deleteUserAccount,
} from "./auth.service";
import { getAuthErrorMessage } from "./auth.utils";
import { ERROR_MESSAGES } from "../config/supabase.config";

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Provider component that makes auth object available to any child component
 */
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Initialize auth state with pineapple bypass support
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log("Initializing auth state...");

        // Check for pineapple bypass data in localStorage first
        const pineappleUser = localStorage.getItem("pineapple_user");
        const pineappleProfile = localStorage.getItem("pineapple_profile");
        const pineappleSession = localStorage.getItem("pineapple_session");
        const pineappleRole = localStorage.getItem("pineapple_role");

        // Check if pineapple data exists - no expiration check
        if (
          pineappleUser &&
          pineappleProfile &&
          pineappleSession &&
          pineappleRole
        ) {
          // Pineapple session is valid, use it
          console.log(
            "Using pineapple bypass session for role:",
            pineappleRole,
          );
          const parsedUser = JSON.parse(pineappleUser) as User;
          const parsedProfile = JSON.parse(pineappleProfile) as UserProfile;
          const parsedSession = JSON.parse(pineappleSession) as Session;

          // Ensure the profile has the correct role
          if (parsedProfile.role !== pineappleRole) {
            console.log("Fixing pineapple profile role mismatch");
            parsedProfile.role = pineappleRole as UserRole;
            localStorage.setItem(
              "pineapple_profile",
              JSON.stringify(parsedProfile),
            );
          }

          setUser(parsedUser);
          setProfile(parsedProfile);
          setSession(parsedSession);
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }

        // No valid pineapple session, check for regular Supabase session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session check error:", sessionError);
          toast({
            title: "Session Error",
            description: getAuthErrorMessage(sessionError),
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (sessionData?.session) {
          setSession(sessionData.session);
          setUser(sessionData.session.user);
          setIsAuthenticated(true);

          // Fetch user profile
          if (sessionData.session.user) {
            const userProfile = await fetchUserProfile(
              sessionData.session.user.id,
            );
            setProfile(userProfile);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        toast({
          title: "Authentication Error",
          description: getAuthErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event, newSession?.user?.id);

      // Skip auth state changes for pineapple users
      const isPineappleUser = localStorage.getItem("pineapple_user") !== null;
      if (isPineappleUser && event !== "SIGNED_OUT") {
        console.log("Ignoring auth state change for pineapple user");
        return;
      }

      setSession(newSession);
      setUser(newSession?.user || null);
      setIsAuthenticated(!!newSession);

      if (newSession?.user) {
        console.log(
          "Fetching profile for authenticated user:",
          newSession.user.id,
        );
        const userProfile = await fetchUserProfile(newSession.user.id);

        if (userProfile) {
          console.log("User profile found:", userProfile);
          setProfile(userProfile);
        } else {
          console.warn("No profile found for user, using metadata fallback");
          // Fallback to user metadata if no profile exists
          const role = newSession.user.user_metadata?.role as UserRole;
          if (role) {
            const fallbackProfile: UserProfile = {
              id: newSession.user.id,
              role: role,
              created_at: new Date().toISOString(),
            };
            setProfile(fallbackProfile);

            // Attempt to create the missing profile
            try {
              await supabase.from("profiles").insert([
                {
                  id: newSession.user.id,
                  email: newSession.user.email,
                  role: role,
                  created_at: new Date().toISOString(),
                },
              ]);
              console.log("Created missing profile for user");
            } catch (error) {
              console.error("Failed to create missing profile:", error);
              toast({
                title: "Profile Error",
                description: getAuthErrorMessage(error),
                variant: "destructive",
              });
            }
          } else {
            console.error("No role found in user metadata");
            toast({
              title: "Profile Error",
              description: ERROR_MESSAGES.MISSING_ROLE,
              variant: "destructive",
            });
            setProfile(null);
          }
        }
      } else {
        setProfile(null);
      }

      // Handle specific auth events
      if (event === "SIGNED_OUT") {
        navigate("/login");
        toast({
          title: "Logged Out",
          description: ERROR_MESSAGES.LOGOUT_SUCCESS,
        });
      } else if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password");
        toast({
          title: "Password Recovery",
          description: "Please enter your new password.",
        });
      } else if (event === "USER_UPDATED") {
        toast({
          title: "Account Updated",
          description: "Your account has been successfully updated.",
        });
      } else if (event === "SIGNED_IN") {
        toast({
          title: "Signed In",
          description: ERROR_MESSAGES.LOGIN_SUCCESS,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  /**
   * Enhanced Pineapple bypass login function with security code for production
   * Creates a fake user session for development and testing purposes
   * @param role The role to log in as
   */
  const login = async (role: UserRole): Promise<void> => {
    try {
      console.log(`Attempting to log in as ${role} via pineapple bypass`);

      // Validate role is one of the allowed types
      if (!["admin", "driver", "carrier", "shipper"].includes(role)) {
        console.error(`Invalid role: ${role}`);
        toast({
          title: "Invalid Role",
          description: ERROR_MESSAGES.INVALID_ROLE,
          variant: "destructive",
        });
        return;
      }

      // Check if we're in production and need to verify security code
      const isProd = process.env.NODE_ENV === "production";
      let bypassAllowed = !isProd; // Always allowed in development

      if (isProd) {
        // In production, prompt for security code
        const securityCode = prompt(
          "Enter the 4-digit security code to use pineapple bypass:",
        );
        bypassAllowed = securityCode === "7714";

        if (!bypassAllowed) {
          toast({
            title: "Bypass Failed",
            description: "Login failed: incorrect bypass code.",
            variant: "destructive",
          });
          return;
        }
      }

      // Create a fake user object with the necessary properties
      const fakeUser = {
        id: `pineapple-${role}-${Date.now()}`,
        email: `${role}@pineapple.dev`,
        role,
        user_metadata: { role },
        app_metadata: { provider: "pineapple" },
        aud: "authenticated",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        factors: null,
        phone: "",
        phone_confirmed_at: null,
      } as unknown as User;

      // Create a fake profile with all required fields
      const fakeProfile = {
        id: fakeUser.id,
        first_name: role.charAt(0).toUpperCase() + role.slice(1),
        last_name: "User",
        role: role as UserRole,
        email: `${role}@pineapple.dev`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Create a fake session - no expiration
      const fakeSession = {
        access_token: `pineapple-token-${Date.now()}`,
        refresh_token: `pineapple-refresh-${Date.now()}`,
        // No expiration - will last until explicitly logged out
        expires_in: Number.MAX_SAFE_INTEGER,
        expires_at: Number.MAX_SAFE_INTEGER,
        user: fakeUser,
      } as unknown as Session;

      // Store in localStorage for persistence across page reloads
      localStorage.setItem("pineapple_user", JSON.stringify(fakeUser));
      localStorage.setItem("pineapple_profile", JSON.stringify(fakeProfile));
      localStorage.setItem("pineapple_session", JSON.stringify(fakeSession));
      localStorage.setItem("pineapple_role", role);
      // Remove expiration check entirely
      localStorage.removeItem("pineapple_expiration");

      // Set the user in state
      setUser(fakeUser);
      setProfile(fakeProfile);
      setSession(fakeSession);
      setIsAuthenticated(true);

      toast({
        title: "Pineapple Bypass Active",
        description: `Logged in as ${role} using pineapple bypass. Valid until you explicitly log out.`,
      });

      // Perform a full page reload to ensure all components recognize the auth state
      window.location.replace(`/${role}`);
    } catch (error) {
      console.error("Error with pineapple login:", error);
      toast({
        title: "Bypass Failed",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
      throw error;
    }
  };

  /**
   * Regular Supabase login with email and password credentials
   * @param email User's email address
   * @param password User's password
   * @returns Object indicating success or failure with optional error message
   */
  const loginWithCredentials = async (
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    try {
      setLoading(true);
      console.log("Attempting login with credentials for:", email);

      const response = await authenticateUser(email, password);

      if (!response.success) {
        toast({
          title: "Login Failed",
          description: response.error || ERROR_MESSAGES.GENERIC,
          variant: "destructive",
        });
        return response;
      }

      // Get the user data from the current session
      const { data } = await supabase.auth.getSession();
      console.log("Login successful, user:", data.session?.user?.id);

      // Fetch user profile
      if (data.session?.user) {
        const userProfile = await fetchUserProfile(data.session.user.id);
        console.log("Retrieved user profile:", userProfile);

        if (!userProfile) {
          console.warn("No profile found, creating from metadata");
          // If no profile exists, create one from metadata
          const role = data.session.user.user_metadata?.role as UserRole;
          if (role) {
            const newProfile: UserProfile = {
              id: data.session.user.id,
              email: data.session.user.email || "",
              role: role,
              created_at: new Date().toISOString(),
            };

            // Insert the new profile
            const { error: insertError } = await supabase
              .from("profiles")
              .insert([newProfile]);
            if (insertError) {
              console.error("Error creating profile:", insertError);
              toast({
                title: "Profile Error",
                description: getAuthErrorMessage(insertError),
                variant: "destructive",
              });
            } else {
              console.log("Created new profile for user");
              setProfile(newProfile);
            }
          } else {
            console.error("No role in user metadata, cannot create profile");
            toast({
              title: "Profile Error",
              description: ERROR_MESSAGES.MISSING_ROLE,
              variant: "destructive",
            });
            return { success: false, error: ERROR_MESSAGES.MISSING_ROLE };
          }
        } else {
          setProfile(userProfile);
        }

        // Navigate based on role
        const role =
          userProfile?.role ||
          (data.session?.user?.user_metadata?.role as UserRole);
        if (role) {
          console.log("Navigating to role dashboard:", role);
          navigate(`/${role}`);
        } else {
          console.warn("No role found, navigating to home");
          navigate("/");
        }
      }

      toast({
        title: "Login Successful",
        description: ERROR_MESSAGES.LOGIN_SUCCESS,
      });

      return { success: true };
    } catch (error) {
      console.error("Error logging in:", error);
      toast({
        title: "Login Failed",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registers a new user with Supabase and creates their profile
   * @param email User's email address
   * @param password User's password
   * @param role User's role in the system
   * @param profileData Optional additional profile data
   * @returns Object indicating success or failure with optional error message
   */
  const register = async (
    email: string,
    password: string,
    role: UserRole,
    profileData?: Partial<UserProfile>,
  ): Promise<AuthResponse> => {
    try {
      setLoading(true);
      console.log(`Registering new ${role} user: ${email}`);

      const response = await registerUser(email, password, role, profileData);

      if (!response.success) {
        toast({
          title: "Registration Failed",
          description: response.error || ERROR_MESSAGES.GENERIC,
          variant: "destructive",
        });
        return response;
      }

      toast({
        title: "Registration Successful",
        description: ERROR_MESSAGES.REGISTER_SUCCESS,
      });

      return { success: true };
    } catch (error) {
      console.error("Error registering:", error);
      toast({
        title: "Registration Failed",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logs out the current user, handling both regular and pineapple users
   */
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);

      // Check if this is a pineapple user
      if (user?.app_metadata?.provider === "pineapple") {
        // Clear pineapple data from localStorage
        localStorage.removeItem("pineapple_user");
        localStorage.removeItem("pineapple_profile");
        localStorage.removeItem("pineapple_session");
        localStorage.removeItem("pineapple_role");
        localStorage.removeItem("pineapple_expiration");

        // Clear the user state for pineapple users
        setUser(null);
        setProfile(null);
        setSession(null);
        setIsAuthenticated(false);

        toast({
          title: "Logged Out",
          description: "Pineapple bypass session ended.",
        });

        // Force a full page reload to completely reset the application state
        window.location.replace("/login");
        return;
      }

      // Regular Supabase logout
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        toast({
          title: "Logout Error",
          description: getAuthErrorMessage(error),
          variant: "destructive",
        });
        throw error;
      }

      setUser(null);
      setProfile(null);
      setSession(null);
      setIsAuthenticated(false);

      toast({
        title: "Logged Out",
        description: ERROR_MESSAGES.LOGOUT_SUCCESS,
      });

      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Logout Error",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initiates the password reset process for a user
   * @param email Email address of the user requesting password reset
   * @returns Object indicating success or failure with optional error message
   */
  const resetPassword = async (email: string): Promise<AuthResponse> => {
    try {
      setLoading(true);

      const response = await resetUserPassword(email);

      if (!response.success) {
        toast({
          title: "Password Reset Failed",
          description: response.error || ERROR_MESSAGES.GENERIC,
          variant: "destructive",
        });
        return response;
      }

      toast({
        title: "Password Reset Email Sent",
        description: ERROR_MESSAGES.PASSWORD_RESET_EMAIL_SENT,
      });

      return { success: true };
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Password Reset Failed",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates the password for the currently authenticated user
   * @param password New password to set
   * @returns Object indicating success or failure with optional error message
   */
  const updatePassword = async (password: string): Promise<AuthResponse> => {
    try {
      setLoading(true);

      const response = await updateUserPassword(password);

      if (!response.success) {
        toast({
          title: "Password Update Failed",
          description: response.error || ERROR_MESSAGES.GENERIC,
          variant: "destructive",
        });
        return response;
      }

      toast({
        title: "Password Updated",
        description: ERROR_MESSAGES.PASSWORD_UPDATED,
      });

      return { success: true };
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Password Update Failed",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates the profile information for the currently authenticated user
   * @param profileData Partial profile data to update
   * @returns Object indicating success or failure with optional error message
   */
  const updateProfile = async (
    profileData: Partial<UserProfile>,
  ): Promise<AuthResponse> => {
    try {
      setLoading(true);

      if (!user) {
        toast({
          title: "Profile Update Failed",
          description: ERROR_MESSAGES.NO_USER,
          variant: "destructive",
        });
        return { success: false, error: ERROR_MESSAGES.NO_USER };
      }

      const response = await updateUserProfile(user.id, profileData);

      if (!response.success) {
        toast({
          title: "Profile Update Failed",
          description: response.error || ERROR_MESSAGES.GENERIC,
          variant: "destructive",
        });
        return response;
      }

      // Refresh profile data
      const updatedProfile = await fetchUserProfile(user.id);
      setProfile(updatedProfile);

      toast({
        title: "Profile Updated",
        description: ERROR_MESSAGES.PROFILE_UPDATED,
      });

      return { success: true };
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Profile Update Failed",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes the current user's account and profile
   * @returns Object indicating success or failure with optional error message
   */
  const deleteAccount = async (): Promise<AuthResponse> => {
    try {
      setLoading(true);

      if (!user) {
        toast({
          title: "Account Deletion Failed",
          description: ERROR_MESSAGES.NO_USER,
          variant: "destructive",
        });
        return { success: false, error: ERROR_MESSAGES.NO_USER };
      }

      const response = await deleteUserAccount(user.id);

      if (!response.success) {
        toast({
          title: "Account Deletion Failed",
          description: response.error || ERROR_MESSAGES.GENERIC,
          variant: "destructive",
        });
        return response;
      }

      // Sign out
      await supabase.auth.signOut();

      setUser(null);
      setProfile(null);
      setSession(null);
      setIsAuthenticated(false);

      toast({
        title: "Account Deleted",
        description: ERROR_MESSAGES.ACCOUNT_DELETED,
      });

      navigate("/login");

      return { success: true };
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Account Deletion Failed",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refreshes the current authentication session
   * Handles both regular and pineapple users differently
   */
  const refreshSession = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log("Attempting to refresh session");

      // Check if this is a pineapple user
      const isPineappleUser = localStorage.getItem("pineapple_user") !== null;
      if (isPineappleUser) {
        console.log("Skipping session refresh for pineapple user");
        // For pineapple users, just reuse the existing session data
        const pineappleUser = localStorage.getItem("pineapple_user");
        const pineappleProfile = localStorage.getItem("pineapple_profile");
        const pineappleSession = localStorage.getItem("pineapple_session");
        const pineappleRole = localStorage.getItem("pineapple_role");

        if (
          pineappleUser &&
          pineappleProfile &&
          pineappleSession &&
          pineappleRole
        ) {
          const parsedUser = JSON.parse(pineappleUser) as User;
          const parsedProfile = JSON.parse(pineappleProfile) as UserProfile;
          const parsedSession = JSON.parse(pineappleSession) as Session;

          // Ensure the profile has the correct role
          if (parsedProfile.role !== pineappleRole) {
            console.log(
              "Fixing pineapple profile role mismatch during refresh",
            );
            parsedProfile.role = pineappleRole as UserRole;
            localStorage.setItem(
              "pineapple_profile",
              JSON.stringify(parsedProfile),
            );
          }

          setUser(parsedUser);
          setProfile(parsedProfile);
          setSession(parsedSession);
          setIsAuthenticated(true);
          console.log(
            "Pineapple session refreshed for role:",
            parsedProfile.role,
          );
        } else {
          console.warn("Incomplete pineapple data in localStorage");
          // Clear incomplete pineapple data
          localStorage.removeItem("pineapple_user");
          localStorage.removeItem("pineapple_profile");
          localStorage.removeItem("pineapple_session");
          localStorage.removeItem("pineapple_role");
          setIsAuthenticated(false);

          toast({
            title: "Session Error",
            description:
              "Your session data is incomplete. Please log in again.",
            variant: "destructive",
          });
        }
        setLoading(false);
        return;
      }

      // For regular users, proceed with normal refresh
      console.log("Refreshing regular Supabase session");
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Session refresh error:", error);
        toast({
          title: "Session Refresh Failed",
          description: getAuthErrorMessage(error),
          variant: "destructive",
        });
        throw error;
      }

      if (data.session) {
        console.log("Session refreshed successfully");
        setSession(data.session);
        setUser(data.session.user);
        setIsAuthenticated(true);

        // Refresh profile
        if (data.session.user) {
          console.log("Fetching updated profile after refresh");
          const userProfile = await fetchUserProfile(data.session.user.id);

          if (userProfile) {
            console.log("Updated profile retrieved:", userProfile);
            setProfile(userProfile);
          } else {
            console.warn(
              "No profile found after session refresh, using metadata",
            );
            // Fallback to user metadata
            const role = data.session.user.user_metadata?.role as UserRole;
            if (role) {
              const fallbackProfile: UserProfile = {
                id: data.session.user.id,
                role: role,
                email: data.session.user.email || "",
                created_at: new Date().toISOString(),
              };
              setProfile(fallbackProfile);

              // Try to create the missing profile
              try {
                await supabase.from("profiles").insert([
                  {
                    id: data.session.user.id,
                    email: data.session.user.email,
                    role: role,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ]);
                console.log("Created missing profile during session refresh");
              } catch (insertError) {
                console.error(
                  "Failed to create profile during refresh:",
                  insertError,
                );
                toast({
                  title: "Profile Error",
                  description: getAuthErrorMessage(insertError),
                  variant: "destructive",
                });
              }
            } else {
              console.error("No role found in user metadata during refresh");
              toast({
                title: "Profile Error",
                description: ERROR_MESSAGES.MISSING_ROLE,
                variant: "destructive",
              });
            }
          }
        }

        toast({
          title: "Session Refreshed",
          description: "Your session has been successfully refreshed.",
        });
      } else {
        console.warn("No session returned from refresh");
        setIsAuthenticated(false);
        toast({
          title: "Session Expired",
          description: ERROR_MESSAGES.SESSION_EXPIRED,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
      toast({
        title: "Session Refresh Failed",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
      // Only log out non-pineapple users on refresh failure
      const isPineappleUser = localStorage.getItem("pineapple_user") !== null;
      if (!isPineappleUser) {
        console.log("Logging out due to session refresh failure");
        await logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    session,
    login,
    loginWithCredentials,
    register,
    logout,
    loading,
    resetPassword,
    updatePassword,
    updateProfile,
    deleteAccount,
    refreshSession,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use the authentication context
 * @returns The authentication context with all auth-related functions and state
 * @throws Error if used outside of AuthProvider
 */
function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { AuthProvider, useAuth };
