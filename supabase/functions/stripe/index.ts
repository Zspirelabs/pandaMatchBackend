import { corsHeaders } from "../_shared/cors.ts"
import { checkoutSession } from "./checkoutSession.ts"
import { getSubscription} from './getSubscription.ts'
import process from "node:process"
import stripe from "./stripeInstance.ts";

const client_endpoint =
	process.env.NODE_ENV !== "production"
		? "http://localhost:3001"
		: "https://beta.pandamatch.io"


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

	try {
		const body = await req.json()

		const url = new URL(req.url)
		const pathname = url.pathname

		if (pathname === "/stripe/get-subscription") {
			const { email } = body

			if (!email) {
				return new Response(JSON.stringify({ error: "Email is required" }), {
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				})
			}

			const subscription = await getSubscription(email)

			return new Response(JSON.stringify({ subscription }), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		}

		if (pathname === "/stripe/subscribe") {
			try {
				const { priceId, email }: { priceId: string; email: string } = body
				console.log(email, priceId)
				const alreadyHaveSubscription = await getSubscription(email)
				if (
					alreadyHaveSubscription?.subscription_id &&
					alreadyHaveSubscription?.status !== "canceled" &&
					alreadyHaveSubscription?.status !== "incomplete"
				) {
					return new Response(
						JSON.stringify({error: "Already have an active subscription"}),
						{
							status: 400,
							headers: { ...corsHeaders, "Content-Type": "application/json" },
						}
					)
				}

				const session = await checkoutSession({ priceId, email })

				if (session?.url) {
					return new Response(JSON.stringify({ url: session.url }), {
						status: 200,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					})
				} else {
					throw new Error("Failed to create checkout session")
				}
			} catch (err) {
				return new Response(JSON.stringify({ error: err.message }), {
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				})
			}
		}

		if(pathname === "/stripe/billing-portal"){
			const { customerId } = body
			console.log(customerId)
			const return_url = `${client_endpoint}/settings`
			try {
				const session = await stripe.billingPortal.sessions.create({
					customer: customerId,
					return_url: return_url,
				})

				console.log("Customer portal session created:", session)
				return new Response(
					JSON.stringify({
						session: session,
					}),
					{
						status: 200,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					}
				)

			} catch (error) {
				console.error("Error creating customer portal session:", error.message)
				return new Response(
					JSON.stringify({
						error: "Error in creating customer portal session",
					}),
					{
						status: 404,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					}
				)
			}
		}

		return new Response(JSON.stringify({ error: "Endpoint not found" }), {
			status: 404,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		})
	} catch (error) {
		console.error("Error processing request", error)
		return new Response(
			JSON.stringify({ error: "Invalid request", details: error.message }),
			{
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			}
		)
	}
})

console.log("Server is running on http://localhost:8000")
