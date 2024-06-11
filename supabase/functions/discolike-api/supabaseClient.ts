import "https://deno.land/x/dotenv@v3.2.2/load.ts" 
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4"

const supabaseUrl = "https://aakbcwmokrispvbkgwjf.supabase.co/"
const supabaseServiceKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Jjd21va3Jpc3B2Ymtnd2pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNDYyNzA3MCwiZXhwIjoyMDMwMjAzMDcwfQ.Qje8K899KYoxR-mQTTGo_FV_Bj7ADZ19AUzEX31EnRI"

export const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
