import axiod from "https://deno.land/x/axiod/mod.ts";
import { deductCredits } from "./deductCredits.ts";
import { corsHeaders } from "./corsHeaders.ts";

// Initialize a Deno server to handle API requests
Deno.serve(async (req) => {

  // Only allow GET requests; reject others with a 405 Method Not Allowed

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  else if (req.method !== "GET") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Extract query parameters and client ID from request headers
    const url = new URL(req.url);
    const requestQuery = url.searchParams;
    const user_id = req.headers.get("X-Clinet-Id");

    // API call to Discolike service
    const response = await axiod.get("https://api.discolike.com/v1/discover", {
      headers: {
        "x-discolike-key": "5130dbdc-9bbb-4254-94d8-25d8b4a8ee1e",
        "X-Clinet-Id": user_id,
      },
      params: Object.fromEntries(requestQuery),
    });

    const data = response.data;

    // Conditional credit updating based on response status and 'nl_match' flag
    if (response.status === 200) {
      // Using the ternary operator to check explicitly for null or undefined
      const creditAmount = (requestQuery.get("nl_match") != null) ? 2 : 1;
      console.log("Credit Amount:", creditAmount);
      try {
        console.log("Deducting Credits:", creditAmount);
        await deductCredits(user_id, creditAmount);
        console.log("Credits Deducted Successfully", creditAmount);
      } catch (deductError) {
        console.error("Deduct Credits Error:", deductError.message);
      }
    }
    else {
      console.log("No credits deducted for non-success response.");
    }
    

    // Return API response in JSON format
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error.message);
    // Return an error response in case of failure
    return new Response(JSON.stringify({
      error: "An error occurred while processing your request.",
      details: error.message,
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
