import { supabaseClient } from "../_shared/supabaseClient.ts";
import axios from "https://esm.sh/axios@1.2.0";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import axiosInstance from "../_shared/axiosInstance.ts";

// Supabase configuration
const supabaseUrl = "https://aakbcwmokrispvbkgwjf.supabase.co/";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Jjd21va3Jpc3B2Ymtnd2pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNDYyNzA3MCwiZXhwIjoyMDMwMjAzMDcwfQ.Qje8K899KYoxR-mQTTGo_FV_Bj7ADZ19AUzEX31EnRI";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to serialize request parameters
const paramsSerializer = (params: any) => {
  const searchParams = new URLSearchParams();
  for (const key in params) {
    if (Array.isArray(params[key])) {
      params[key].forEach((value: string) => {
        searchParams.append(key, value);
      });
    } else {
      searchParams.append(key, params[key]);
    }
  }
  return searchParams.toString();
};

// Function to validate API key and user ID
async function validateApiKey(userId, apiKey) {
  const { data, error } = await supabase
    .from("user_info")
    .select("user_id, api_key")
    .eq("user_id", userId)
    .eq("api_key", apiKey)
    .single();

  if (error || !data) {
    console.error("Error fetching user data:", error);
    return false;
  }

  return true;
}

// Function to check rate limit and deduct credits
async function checkRateLimit(userId) {
  const { data, error } = await supabase
    .from("user_info")
    .select("request_count, last_request, credits, export_credits")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching rate limit data:", error);
    return { allowed: false, error: "Rate limit error" };
  }

  const currentTime = new Date();
  const lastRequestTime = new Date(data.last_request);
  const timeDifference = (currentTime - lastRequestTime) / 1000 / 60; // Difference in minutes

  if (data.credits <= 0) {
    return { allowed: false, error: "Not enough credits" };
  }

  if (data.export_credits <= 0) {
    return { allowed: false, error: "Not enough export credits" };
  }

  if (timeDifference < 1 && data.request_count >= 4) {
    return { allowed: false, error: "Rate limit exceeded" };
  }

  let newRequestCount = data.request_count;
  if (timeDifference >= 1) {
    newRequestCount = 1;
  } else {
    newRequestCount += 1;
  }

  // Deduct credits for the request
  await supabase
    .from("user_info")
    .update({
      request_count: newRequestCount,
      last_request: currentTime.toISOString(),
      // credits: data.credits - 1,
    })
    .eq("user_id", userId);

  return { allowed: true, exportCredits: data.export_credits };
}

// Main handler for API requests
Deno.serve(async (req) => {
  // Handle preflight requests for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  let body;
  try {
    body = await req.json();
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return new Response("Provide a Valid JSON", {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const headers = req.headers;
    const userId = headers.get("x-client-key");
    const apiKey = headers.get("api-key");

    if (!userId || !apiKey) {
      return new Response("Missing user_id or api_key in Headers", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isValidApiKey = await validateApiKey(userId, apiKey);
    if (!isValidApiKey) {
      return new Response("Invalid user_id or api_key", {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rateLimitCheck = await checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return new Response(rateLimitCheck.error, {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { exportCredits } = rateLimitCheck;

    // Call external API
    const response = await axiosInstance.get("https://api.discolike.com/v1/discover", {
      params: body,
      paramsSerializer: paramsSerializer,
      withCredentials: true,
      headers: {
        "x-discolike-key": "5130dbdc-9bbb-4254-94d8-25d8b4a8ee1e",
        "x-client-key": userId,
        "x-client-level": 0,
      },
    });

    const data = response.data;
    const dataLength = data.length;
    let export_credits = exportCredits - dataLength;

    // Update export credits

    // avoid export credits to go negative
    
    if (export_credits < 0) {
      export_credits = 0; 
    }

    await supabase
      .from("user_info")
      .update({
        export_credits: export_credits,
        credits: data.credits - 1

      })
      .eq("user_id", userId);

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    if (error.response) {
      console.error("Error Response:", error.response.data);
    }
    return new Response("Internal Server Error", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
