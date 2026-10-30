import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Server-side privileged client with Service Role Key
// Used strictly for background jobs, automations, and audit logging
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Factory function to create a Supabase client scoped to the user's JWT
// This strictly enforces Row Level Security (RLS) rules in PostgreSQL
export const createUserClient = (userJwt) => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${userJwt}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

