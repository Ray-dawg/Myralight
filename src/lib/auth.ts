import { supabase } from "./supabase";
import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";

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
  return supabase.auth.signInWithPassword({ email, password });
}

// Sign up with email and password
export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
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
  return supabase.auth.resetPasswordForEmail(email);
}

// Update password
export async function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}
