import { crypto } from "https://deno.land/std@0.106.0/crypto/mod.ts"

function generateCouponCode(): string {
	const randomBytes = new Uint8Array(4) 
	crypto.getRandomValues(randomBytes)
	return Array.from(randomBytes)
		.map((b) => b.toString(16).padStart(2, "0")) 
		.join("")
		.toUpperCase() 
}

console.log(generateCouponCode()) 

export default generateCouponCode