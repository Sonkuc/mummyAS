import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bvqbcvfuztfxmhxytjwl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2cWJjdmZ1enRmeG1oeHl0andsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMDYwMTQsImV4cCI6MjA3ODg4MjAxNH0.93jls0PbAxXZ4BmMomji8IAVOs6TE1AUL3au1_77imo";              

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
