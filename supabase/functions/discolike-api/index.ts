// deno-lint-ignore-file no-explicit-any
import { deductCredits } from "./deductCredits.ts"
import { corsHeaders } from "../_shared/cors.ts"
import axiosInstance from "./axiosInstance.ts";

const paramsSerializer = (params: any) => {
	const searchParams = new URLSearchParams()

	for (const key in params) {
		if (Array.isArray(params[key])) {
			params[key].forEach((value: string) => {
				searchParams.append(key, value)
			})
		} else {
			searchParams.append(key, params[key])
		}
	}
	return searchParams.toString()
}

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
			const { params, user_id } = body
			
			const response = await axiosInstance.get(
				"https://api.discolike.com/v1/discover",
				{
					params: params,
					paramsSerializer: paramsSerializer,
					withCredentials: true,
					headers: {
						"x-discolike-key": "5130dbdc-9bbb-4254-94d8-25d8b4a8ee1e",
						"X-Client-Id": user_id,
					},
				}
			)
			const data = response.data

			if (response.status === 200) {
				const creditAmount = params.nl_match ? 2 : 1
				console.log("Credit Amount:", creditAmount)
				try {
					console.log("Deducting Credits:", creditAmount)
					await deductCredits(user_id, creditAmount)
					console.log("Credits Deducted Successfully:", creditAmount)
				} catch (deductError) {
					return new Response(
						JSON.stringify({
							response: deductError.message,
						}),
						{
							status: 400,
							headers: { ...corsHeaders, "Content-Type": "application/json" },
						}
					)
				}
			} else {
				console.log("No credits deducted for non-success response.")
			}
			console.log("Response From Disco Like", response.data);
			console.log("Request Sent To Disco Like", {
				Params: params,
				"Params Serialized": paramsSerializer(params),
				Headers: {
					"x-discolike-key": "5130dbdc-9bbb-4254-94d8-25d8b4a8ee1e",
					"X-Client-Id": user_id,
				},
			})
			return new Response(JSON.stringify(data), {
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		} catch (error) {
			console.error("Error making the API call:", error)
			if (error.response?.data?.detail) {
				return new Response(
					JSON.stringify({
						response: error.response.data.detail,
					}),
					{
						status: 400,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					}
				)
			} else {
				return new Response(
					JSON.stringify({
						response: "Invalid request",
					}),
					{
						status: 400,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					}
				)
			}
		}
	},
)

console.log("Server is running on http://localhost:8000")
