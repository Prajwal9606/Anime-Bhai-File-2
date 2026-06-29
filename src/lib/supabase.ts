import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://iepuqtntseotziuhfaqr.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllcHVxdG50c2VvdHppdWhmYXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjkzNDUsImV4cCI6MjA5ODI0NTM0NX0.CqcP1PnssXZqZXFYtfUsJhOaYhx5xChyhjohRAEWNSw';

// Initialize client if credentials exist, otherwise log warning
export const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
