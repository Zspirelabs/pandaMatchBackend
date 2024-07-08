import stripe from "./stripeInstance.ts"

export async function getSubscription(email: string) {
	try {
		const customers = await stripe.customers.list({ email })
		if (customers.data.length === 0) {
			return null
		}

		const customer = customers.data[0]
		const subscriptions = await stripe.subscriptions.list({
			customer: customer.id,
		})

		if (subscriptions.data.length === 0) {
			return null
		}

		const subscription = subscriptions.data.find(
			(subscription: { status: string; }) => subscription.status !== "canceled"
		)

		return subscription
			? {
					subscription_id: subscription.id,
					status: subscription.status,
					current_period_end: subscription.current_period_end,
					schedule: subscription.schedule,
					cancel_at: subscription.cancel_at,
					customer: subscription.customer,
			  }
			: null
	} catch (error) {
		console.error("Error getting subscription:", error.message)
		throw new Error("Failed to retrieve subscription")
	}
}
