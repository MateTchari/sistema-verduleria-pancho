import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl ?? "https://yzzufvqrcnnlbcnwocis.supabase.co", supabaseAnonKey ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6enVmdnFyY25ubGJjbndvY2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5ODE2NzYsImV4cCI6MjEwMTU1NzY3Nn0.QC9w43iTTBh6gOs5xL2mVP1uHw45-A0zYlIsH8efgao", {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
