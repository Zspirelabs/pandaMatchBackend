import { supabaseClient } from "../_shared/supabaseClient.ts";
import { v4 as uuidv4 } from "npm:uuid";
import { corsHeaders } from "../_shared/cors.ts";

// Function to generate a new API key
function createApiKey() {
  return uuidv4();
}

async function generateOrUpdateApiKey(userId) {
  const apiKey = createApiKey();

  // Try to update the API key, if the user exists
  const { error: updateError } = await supabaseClient
    .from('user_info')
    .upsert({ user_id: userId, api_key: apiKey }, { onConflict: 'user_id' });

  if (updateError) {
    throw updateError;
  }

  return { api_key: apiKey };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const userId = body.user_id;

      if (!userId) {
        return new Response('Missing user_id in request body', {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { api_key } = await generateOrUpdateApiKey(userId);
      return new Response(JSON.stringify({ api_key }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error:', error);
      return new Response('Internal Server Error', {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } else {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }
});
