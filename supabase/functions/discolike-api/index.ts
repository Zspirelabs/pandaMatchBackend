import axiod from "https://deno.land/x/axiod/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

console.log("Supabase ULR is ", Deno.env.get("_SUPABASE_URL"));
console.log("Supabase KEY is ", Deno.env.get("_SUPABASE_ANON_KEY"));

Deno.serve(async (req) => {
  // fetch user
  // Get the session or user object
  const supabaseClient = createClient(
    Deno.env.get("_SUPABASE_URL") ?? "",
    Deno.env.get("_SUPABASE_ANON_KEY") ?? "",
    // {
    //   global: { headers: { Authorization: req.headers.get("Authorization")! } },
    // }
  );

  console.log("Auth Header is ", req.headers.get("Authorization")!);
  // Database queries will have RLS policies enforced
  supabaseClient
    .from("user_info")
    .select("*")
    .then(({ data, error }) => {
      console.log('data',data, error);
    })
    .catch((error) => {
      console.error("Error:", error);
    });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "POST") {
    try {
      console.log("Request received");

      // Parse the request body to get the query parameters
      const body = await req.json();
      const requestQuery = body.params;
      console.log("Request query:", requestQuery);

      const response = await axiod.get(
        "https://api.discolike.com/v1/discover",
        {
          headers: {
            "x-discolike-key": "5130dbdc-9bbb-4254-94d8-25d8b4a8ee1e",
          },
          params: requestQuery,
        }
      );

      const responseJson = response.data;

      return new Response(JSON.stringify(responseJson), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error:", error.message);

      return new Response(
        JSON.stringify({
          error: "An error occurred while processing your request.",
          details: error.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } else {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
