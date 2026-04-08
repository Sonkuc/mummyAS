import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nayivuagrbjklmtinfjv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_S5YU_t06KFcDHaBfwAGgRQ_m8zNvSys";              

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
}); 