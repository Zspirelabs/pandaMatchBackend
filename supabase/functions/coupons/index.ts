import { corsHeaders } from "../_shared/cors.ts"
import generateCouponCode from "./generateCoupons.ts"
import { supabaseClient } from "../discolike-api/supabaseClient.ts"

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

	const url = new URL(req.url, `http://${req.headers.get("host")}`)

	const pathname = url.pathname.replace("/coupons", "")
	console.log("out")

	if (pathname === "/create") {
		console.log("true")
		/* 
    Inorder to create credits pass these details in payload:

    credits : {
      search: 100,
      exoprt : 100,
    }

    expiry_date: "date",
    usage_limit : "limit"

    */
		const { credits, expiry_date, usage_limit } = await req.json()

		const code = generateCouponCode()
		console.log(code, credits, expiry_date, usage_limit)
		const { data, error } = await supabaseClient
			.from("coupons")
			.insert([{ code, credits, expiry_date, usage_limit }])

		if (error) {
			return new Response(
				JSON.stringify({
					response: "Unable to create coupon: try later",
				}),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
		}
		return new Response(
			JSON.stringify({
				response: "successfully created",
			}),
			{
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			}
		)
	}

	if (pathname === "/redeem") {
		console.log("redeem")
		try{
      const { code, user_id } = await req.json()

		const { data: coupon, error } = await supabaseClient
			.from("coupons")
			.select("*")
			.eq("code", code)
			.single()

		if (error || !coupon)
			return new Response(
				JSON.stringify({
					response: "Invalid coupon code!",
				}),
				{
					status: 400,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				}
			)

		const { data: used_coupons } = await supabaseClient
			.from("used_coupons")
			.select("*")
			.eq("user_id", user_id)
			.eq("coupon_id", coupon.id)
			.single()

		if (used_coupons) {
			return new Response(
				JSON.stringify({
					response: "Coupon Already Redeemed",
				}),
				{
					status: 400,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				}
			)
		}
		if (coupon.times_used >= coupon.usage_limit)
			return new Response(
				JSON.stringify({
					response: "Coupon usage limit exceeded",
				}),
				{
					status: 400,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				}
			)

		if (new Date(coupon.expiry_date) < new Date())
			return new Response(
				JSON.stringify({
					response: "Coupon has expired",
				}),
				{
					status: 400,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				}
			)

		await supabaseClient
			.from("coupons")
			.update({ times_used: coupon.times_used + 1 })
			.eq("id", coupon.id)

		await supabaseClient
			.from("used_coupons")
			.insert([{ user_id: user_id, coupon_id: coupon.id }])

		const { data: userData } = await supabaseClient
			.from("user_info")
			.select("*")
			.eq("user_id", user_id)
      .single()
    
    console.log("Updated Credits:", parseInt(userData.credits) + parseInt(coupon.credits.search))
    console.log(
			"Updated Export Credits:",
			parseInt(userData.export_credits) + parseInt(coupon.credits.export)
		)
		if (userData) {
			const { error: insertError } = await supabaseClient
				.from("user_info")
				.update({
					credits: parseInt(userData.credits) + parseInt(coupon.credits.search),
					export_credits:
						parseInt(userData.export_credits) + parseInt(coupon.credits.export),
				})
				.eq("user_id", user_id)
			if (insertError) {
				return new Response(
					JSON.stringify({
						response: "Error in updating credits!",
					}),
					{
						status: 400,
						headers: {
							...corsHeaders,
							"Content-Type": "application/json",
						},
					}
				)
			}
		}

		return new Response(
			JSON.stringify({
				response: "Coupon Redeemed Successfully!",
			}),
			{
				status: 200,
				headers: {
					...corsHeaders,
					"Content-Type": "application/json",
				},
			}
		)
    }catch(err){
      console.error(err)
    }
	}
})

console.log("Server running in port 8000...")

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:5439/functions/v1/coupons' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
