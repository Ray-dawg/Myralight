import { supabase } from "./supabase";
import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { ERROR_MESSAGES } from "../config/supabase.config";

// Hook for authentication state
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get session from supabase
    const getSession = async () => {
      setLoading(true);
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }

      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { session, user, loading };
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  try {
    // Check rate limit before attempting login
    const { data: rateLimitData, error: rateLimitError } =
      await supabase.functions.invoke("supabase-functions-check-rate-limit", {
        body: { email, action: "login" },
      });

    if (rateLimitError) {
      console.error("Rate limit check failed:", rateLimitError);
      // Continue with login if rate limit check fails
    } else if (rateLimitData?.limited) {
      return {
        data: { session: null, user: null },
        error: {
          message: rateLimitData.message || ERROR_MESSAGES.RATE_LIMITED,
        },
      };
    }

    // Proceed with login
    const result = await supabase.auth.signInWithPassword({ email, password });

    // Record the attempt
    await recordAuthAttempt(email, "login", !result.error);

    return result;
  } catch (error) {
    console.error("Login error:", error);
    await recordAuthAttempt(email, "login", false);
    return {
      data: { session: null, user: null },
      error: { message: ERROR_MESSAGES.GENERIC },
    };
  }
}

// Record authentication attempt
async function recordAuthAttempt(
  email: string,
  action: "login" | "register" | "reset",
  success: boolean,
) {
  try {
    await supabase.functions.invoke("supabase-functions-record-auth-attempt", {
      body: { email, action, success },
    });
  } catch (error) {
    console.error("Failed to record auth attempt:", error);
    // Non-critical error, don't block the auth flow
  }
}

// Sign up with email and password
export async function signUp(email: string, password: string) {
  try {
    // Check rate limit before attempting registration
    const { data: rateLimitData, error: rateLimitError } =
      await supabase.functions.invoke("supabase-functions-check-rate-limit", {
        body: { email, action: "register" },
      });

    if (rateLimitError) {
      console.error("Rate limit check failed:", rateLimitError);
      // Continue with registration if rate limit check fails
    } else if (rateLimitData?.limited) {
      return {
        data: { session: null, user: null },
        error: {
          message: rateLimitData.message || ERROR_MESSAGES.RATE_LIMITED,
        },
      };
    }

    // Proceed with registration
    const result = await supabase.auth.signUp({ email, password });

    // Record the attempt
    await recordAuthAttempt(email, "register", !result.error);

    return result;
  } catch (error) {
    console.error("Registration error:", error);
    await recordAuthAttempt(email, "register", false);
    return {
      data: { session: null, user: null },
      error: { message: ERROR_MESSAGES.GENERIC },
    };
  }
}

// Sign out
export async function signOut() {
  return supabase.auth.signOut();
}

// Get current user
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Reset password
export async function resetPassword(email: string) {
  try {
    // Check rate limit before attempting password reset
    const { data: rateLimitData, error: rateLimitError } =
      await supabase.functions.invoke("supabase-functions-check-rate-limit", {
        body: { email, action: "reset" },
      });

    if (rateLimitError) {
      console.error("Rate limit check failed:", rateLimitError);
      // Continue with password reset if rate limit check fails
    } else if (rateLimitData?.limited) {
      return {
        data: {},
        error: {
          message: rateLimitData.message || ERROR_MESSAGES.RATE_LIMITED,
        },
      };
    }

    // Proceed with password reset
    const result = await supabase.auth.resetPasswordForEmail(email);

    // Record the attempt
    await recordAuthAttempt(email, "reset", !result.error);

    return result;
  } catch (error) {
    console.error("Password reset error:", error);
    await recordAuthAttempt(email, "reset", false);
    return {
      data: {},
      error: { message: ERROR_MESSAGES.GENERIC },
    };
  }
}

// Update password
export async function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}
