import "https://deno.land/x/dotenv@v3.2.2/load.ts" 
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4"

const supabaseUrl = Deno.env.get("_SUPABASE_URL")
const supabaseServiceKey = Deno.env.get("_SUPABASE_SERVICE_KEY")

if(supabaseUrl === undefined){
    throw new Error("No SUPABASE_URL")
}
if(supabaseServiceKey === undefined){
    throw new Error("No SUPABASE_Service key")
}

export const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
