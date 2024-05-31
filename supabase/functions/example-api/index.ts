import axios from 'https://cdn.skypack.dev/axios';


Deno.serve(async (req) => {


  // Check if the request method is POST
  if (req.method === "POST") {
    try {

      // Parse the JSON body from the request
      const body = await req.json();
      const query = body.query;

      // Create a response JSON object
      const response_json = { "Test": "Hello World" };

      // Return the response as a JSON string with appropriate headers
      // It's necessary to stringify the response because the Response constructor requires a string or a Blob.
      return new Response(JSON.stringify(response_json), {
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      // Return a response with an error message if JSON parsing fails
      return new Response(JSON.stringify({ error: "error", details: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else {
    // Return a response for any other HTTP method (e.g., GET, PUT)
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { "Content-Type": "text/plain" },
    });
  }
});