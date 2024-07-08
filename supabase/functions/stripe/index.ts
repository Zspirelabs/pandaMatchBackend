import { corsHeaders } from '../_shared/cors.ts';
import { subscribeUser } from './checkoutSession.ts';
import { getSubscription } from './getSubscription.ts';


Deno.serve({ port: 8000 }, async (req: Request) => {
	if (req.method === "OPTIONS") {
		return new Response(null, {
			status: 204,
			headers: {
				...corsHeaders,
				"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			},
		})
	}

	if (!(req.method === "POST")) {
		return new Response("Method Not Allowed", {
			status: 405,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		})
	}

	try {
		const body = await req.json()

        const url = new URL(req.url, `http://${req.headers.get("host")}`)

	    const pathname = url.pathname.replace("/coupons", "")

    	if (pathname === "/get-subscription") {

            const {email} = body

            const subscription = await getSubscription(email)

			return new Response(JSON.stringify({
				data: subscription
			}), {
                status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" }
			});

        }

        if(pathname === "/subscribe"){
            await subscribeUser(req)
        }

	} catch (error) {
	
			return new Response(
				JSON.stringify({
					response: "Invalid request"+ error,
				}),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
	}
})

console.log("Server is running on http://localhost:8000")
