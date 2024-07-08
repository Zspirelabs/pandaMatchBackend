import stripe from "./stripeInstance.ts"
import { corsHeaders } from "../_shared/cors.ts";
import process from "node:process";
import { getSubscription } from "./getSubscription.ts";

const client_endpoint =
	process.env.NODE_ENV !== "production"
		? "http://localhost:3001"
		: "https://app.pandamatch.io"


export async function subscribeUser(req : Request) {
	try {
		const { price_id,email}: {price_id: string, email: string} = await req.json()
		console.log(email)
		const alreadyHaveSubscription = await getSubscription(email)
		if (
			alreadyHaveSubscription?.subscription_id &&
			alreadyHaveSubscription?.status !== "canceled" &&
			alreadyHaveSubscription?.status !== "incomplete"
		) {
        return new Response(
                        "Already have an active subscription",
                        {
                            status: 400,
                            headers: { ...corsHeaders, "Content-Type": "application/json" },
                        }
                    )
		}

		const session = await checkoutSession({ price_id, email })

		if (session?.url) {
			return new Response(
				JSON.stringify({ url: session.url }),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
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


export async function checkoutSession({ price_id, email }: {price_id: string, email: string}) {
	try {
		let _customer
		const customers = await stripe.customers.list({ email })

		if (customers.data.length > 0) {
			_customer = customers.data[0].id
		} else {
			const newCustomer = await stripe.customers.create({ email })
			_customer = newCustomer.id
		}

		return await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: [{ price: price_id, quantity: 1 }],
			mode: "subscription",
			success_url: `${client_endpoint}/settings`,
			cancel_url: `${client_endpoint}`,
			customer_email: email,
		})
	} catch (err) {
		console.error(`Subscription creation failed: ${err.message}`)
		throw new Error("Failed to create checkout session")
	}
}