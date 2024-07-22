import stripe from "./stripeInstance.ts"
import process from "node:process";

const client_endpoint =
	process.env.NODE_ENV !== "production"
		? "http://localhost:3001"
		: "https://beta.pandamatch.io"




export async function checkoutSession({ priceId, email }: {priceId: string, email: string}) {
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
			line_items: [{ price: priceId, quantity: 1 }],
			mode: "subscription",
			success_url: `${client_endpoint}/settings/billing`,
			cancel_url: `${client_endpoint}`,
			customer_email: email,
		})
	} catch (err) {
		console.error(`Subscription creation failed: ${err.message}`)
		throw new Error("Failed to create checkout session")
	}
}