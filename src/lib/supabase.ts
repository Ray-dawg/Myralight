import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_CONFIG,
  AUTH_CONFIG,
  ERROR_MESSAGES,
  isSupabaseConfigured,
} from "../config/supabase.config";

// Check if Supabase is properly configured
if (!isSupabaseConfigured()) {
  console.error(ERROR_MESSAGES.missingConfig);
  alert(ERROR_MESSAGES.configAlert);
}

// Create and export the Supabase client
export const supabase = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  {
    auth: AUTH_CONFIG,
  },
);

// Log Supabase initialization status
console.log(
  `Supabase client initialized with URL: ${SUPABASE_CONFIG.url ? "[configured]" : "[missing]"}`,
);
