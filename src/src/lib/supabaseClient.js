import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Loud on purpose — a blank white screen with no explanation is the
  // most common "why isn't this working" support question.
  console.error(
    "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY " +
      "in a .env file locally, and in your Vercel project's Environment Variables."
  );
}

export const supabase = createClient(url, anonKey);
