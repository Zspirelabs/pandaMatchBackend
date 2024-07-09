import Stripe from "npm:stripe"
import "https://deno.land/x/dotenv@v3.2.0/load.ts"

console.log(Deno.env.get("STRIPE_SECRET_KEY"))
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
	apiVersion: "2024-06-20",
})

export default stripe
