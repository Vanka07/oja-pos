import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://bjpqdfcpclmcxyydtcmm.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqcHFkZmNwY2xtY3h5eWR0Y21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDU5MjksImV4cCI6MjA4NTUyMTkyOX0.uDaWROwrMuCFt4kU-n3IaX5Fy3jGVwtbWGJQLPzcbsY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
