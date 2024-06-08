import "https://deno.land/x/dotenv@v3.2.2/load.ts" 
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4"

const supabaseUrl = "https://aakbcwmokrispvbkgwjf.supabase.co/"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Jjd21va3Jpc3B2Ymtnd2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ2MjcwNzAsImV4cCI6MjAzMDIwMzA3MH0.44_h_lcjr42rrkFndVVGbLndcpWbNf77p7NEQCrfCwk"
if (!supabaseUrl) {
	throw new Error("Environment variable SUPABASE_URL is required.")
}

if (!supabaseAnonKey) {
	throw new Error("Environment variable SUPABASE_ANON_KEY is required.")
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
