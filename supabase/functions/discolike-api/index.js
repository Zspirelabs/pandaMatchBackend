import axiod from "https://deno.land/x/axiod/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { params, user_id } = body;

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );

      // Make the API call to the external service using axiod
      const response = await axiod.get(
        "https://api.discolike.com/v1/discover",
        {
          params: params,
          withCredentials: true,
          headers: {
            "x-discolike-key": Deno.env.get("API_KEY"),
            "X-Client-Key": user_id,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data) {
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { data: user_info } = await supabaseClient
        .from("user_info")
        .select("api_count, credits")
        .eq("user_id", user_id);

      if (user_info.length === 0) {
        const { data, error } = await supabaseClient
          .from("user_info")
          .insert([{ user_id: user_id, api_count: 1 }])
          .select();

        if (error) {
          console.log("Insert error: ", error);
        } else {
          console.log("Inserted:", data);
        }
      } else {
        const { data: data1, error: error1 } = await supabaseClient
          .from("user_info")
          .update({ api_count: parseInt(user_info[0].api_count) + 1 })
          .eq("user_id", user_id)
          .select();

        if (error1) {
          console.log("Update error: ", error1);
        } else {
          console.log("Updated:", data1);
        }

        const { data: data2, error: error2 } = await supabaseClient
          .from("user_info")
          .update({ credits: parseInt(user_info[0].credits) - 1 })
          .eq("user_id", user_id)
          .select();

        if (error2) {
          console.log("Update error: ", error2);
        } else {
          console.log("Updated:", data2);
        }
      }

      return new Response(JSON.stringify(response.data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error making the API call:", error);
      return new Response(
        JSON.stringify({ response: error.message || "Invalid request" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } else {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { "Content-Type": "text/plain" },
    });
  }
});
