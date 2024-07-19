import { supabaseClient } from "../_shared/supabaseClient.ts"
import { corsHeaders } from "../_shared/cors.ts"
import process from "node:process"
interface WorkspaceMember {
	user_id: string
	email: string
	role: string
}

const server_end_point = "https://aakbcwmokrispvbkgwjf.supabase.co/functions/v1"

const client_endpoint =
	process.env.NODE_ENV !== "production"
		? "http://localhost:3000"
		: "https://app.pandamatch.io"

Deno.serve(async (req) => {
	// Handle preflight requests for CORS
	if (req.method === "OPTIONS") {
		return new Response(null, {
			status: 204,
			headers: {
				...corsHeaders,
				"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			},
		})
	}

	// Only allow GET requests
	if (req.method !== "GET") {
		return new Response(JSON.stringify({ message: "Invalid method" }), {
			status: 404,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		})
	}

	
	const url = new URL(req.url)
	const code = url.searchParams.get("code")
	const body = await req.json()
	const id = url.searchParams.get("id")
	const pathname = url.pathname.replace("/workspace", "")

	if (pathname === "/invitations/accept") {
		if (!code || !id) {
			return new Response(
				JSON.stringify({ message: "Missing code or id in query parameters" }),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
		}
		
		try {
			const { data: invitationData, error: invitationError } =
				await supabaseClient
					.from("invitations")
					.select("*")
					.eq("invitation_code", code)
					.eq("id", id)
					.single()

			if (invitationError) {
				console.error(invitationError.message)
				return new Response(
					JSON.stringify({ message: "Error fetching invitation data" }),
					{
						status: 500,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					}
				)
			}

			if (invitationData) {
				if (invitationData.status === "pending") {
					// Get user current workspace details
					const { data: userData, error: userError } = await supabaseClient
						.from("user_info")
						.select("*")
						.eq("email", invitationData.email)
						.single()
					console.log(userData)

					if (userError) {
						console.log(invitationData)
						console.error(userError.message, "No an user.")
						return Response.redirect(`${client_endpoint}/auth`)
					}

					const { data: workspaceData, error: workspaceError } =
						await supabaseClient
							.from("workspace_members")
							.select("*")
							.eq("user_id", userData.user_id)
							.single()

					if (workspaceError) {
						console.log(userData.user_id)
						console.error(workspaceError.message)
						return new Response(
							JSON.stringify({ message: "Error fetching workspace data" }),
							{
								status: 500,
								headers: {
									...corsHeaders,
									"Content-Type": "application/json",
								},
							}
						)
					}

					console.log(workspaceData, "workspace")

					if (workspaceData.role === "owner") {
						console.log(userData.email)
						const url = `${server_end_point}/stripe/get-subscription`
						const response = await fetch(url, {
							method: "POST",
							body: JSON.stringify({
								email: userData.email,
							}),
						})
						const data = await response.json()

						// if the owner is a paid user? (he can't leave this workspace.)
						if (data?.subscription?.status === "active") {
							return Response.redirect(
								`${client_endpoint}/invitations?reason="You currently hold the role of owner within our premium workspace subscription."`
							)
						} else {
							const { data: workspaceMembers } = await supabaseClient
								.from("workspace_members")
								.select("*")
								.eq("workspace_id", workspaceData.workspace_id)

							//transfer all the members to a new workspace
							workspaceMembers?.forEach(async (member: WorkspaceMember) => {
								if (member.role === "member") {
									// create new default workspace for each members
									const { data: newWorkspace } = await supabaseClient
										.from("workspaces")
										.insert({
											name: "My Workspace",
											owner_id: member.user_id,
										})
										.select()
										.single()

									// change them as owners to new workspace
									await supabaseClient
										.from("workspace_members")
										.update({
											workspace_id: newWorkspace.id,
											role: "owner",
										})
										.eq("user_id", member.user_id)
								} else if (member.role === "owner") {
									// change him as member to the invited workspace
									await supabaseClient
										.from("workspace_members")
										.update({
											workspace_id: invitationData.workspace_id,
											role: "member",
										})
										.eq("user_id", userData.user_id)
								}
							})
							console.log("done")
							console.log(workspaceData)

							// finally delete the previous workspace
							const { data, error } = await supabaseClient
								.from("workspaces")
								.delete()
								.eq("id", workspaceData.workspace_id)

							console.log(error, "error")
						}

						// Update the status of the invitation to accepted
						await supabaseClient
							.from("invitations")
							.update({ status: "accepted" })
							.eq("invitation_code", code)
							.eq("id", id)

						return Response.redirect(
							`${client_endpoint}/invitations?success=true`
						)
					} else if (workspaceData.role === "member") {
						// you can't proceed as a member, leave your current workspace first.
						return Response.redirect(
							`${client_endpoint}/invitations?reason="You are already a member of another workspace. Please leave your current workspace before joining a new one."`
						)
					}
				} else {
					return Response.redirect(
						`${client_endpoint}/invitations?reason=Invitation expired! it is no longer available`
					)
				}
			}
		} catch (err) {
			console.error(err.message)
			return new Response(
				JSON.stringify({ message: "Internal Server Error" }),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
		}
	} else if (pathname === "/update-member") {
		try {
			const {workspace_id, user_id, role} = body
			await supabaseClient
				.from("workspace_members")
				.update({
					workspace_id: workspace_id,
					role: role,
				})
				.eq("user_id", user_id)

		} catch (err) {
			console.error(err.message)
			return new Response(
				JSON.stringify({ message: "Internal Server Error" }),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
		}
	}
})
