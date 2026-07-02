import { createClient } from "@supabase/supabase-js";

// Replace these with your own Supabase project URL and public anon key
const SUPABASE_URL = "https://iepuqtntseotziuhfaqr.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_9vOKwFpntT48IoKytovOlw_BRv2qqwR";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
