import { corsHeaders } from "../_shared/cors.ts";
import axiosInstance from "../_shared/axiosInstance.ts";
import supabaseAuth from "../middleware/supabaseAuth.ts";

Deno.serve({ port: 8000 }, async (req: Request) => {

    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                ...corsHeaders,
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            },
        });
    }

    if (req.method !== "POST") {
        return new Response("Method Not Allowed", {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    try {
        await supabaseAuth(req.headers.get("Authorization") || "")
        const body = await req.json();
        const { data, webhookUrl } = body;
        
        // Assuming data needs to be forwarded as JSON to the webhook
        const response = await axiosInstance.post(
            webhookUrl,
            data,
            {
                headers: {
                    "Content-Type": "application/json",
                },
                withCredentials: true,
            }
        );

        if (response.status === 200) {
            console.log("Successfully made the API call");
            // Returning a response to the client
            return new Response(JSON.stringify({ message: "Success" }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
    } catch (error) {
        console.error("Error making the API call", error);
        return new Response(JSON.stringify({ error: "Failed to make API call" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
