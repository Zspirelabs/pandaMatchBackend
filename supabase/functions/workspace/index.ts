import { supabaseClient } from "../_shared/supabaseClient.ts"
import { corsHeaders } from "../_shared/cors.ts"


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
	if (req.method !== "POST") {
		return new Response(JSON.stringify({ message: "Invalid method" }), {
			status: 404,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		})
	}

	const url = new URL(req.url)
	const body = await req.json()
	const pathname = url.pathname.replace("/workspace", "")

	if (pathname === "/update-member") {
		try {
			const { workspace_id, user_id, role } = body

			const { data, error } = await supabaseClient
				.from("workspace_members")
				.update({
					workspace_id: workspace_id,
					role: role,
				})
				.eq("user_id", user_id)

			console.error(error?.message)
			console.error(error)

			return new Response(JSON.stringify({ message: data }), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
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
	} else if (pathname === "/fetch-all") {
		try {
			const { workspace_id } = body

			const { data: workspace, error: workspaceError } = await supabaseClient
				.from("workspaces")
				.select("name, owner_id, id")
				.eq("id", workspace_id)
				.single()

			if (workspaceError) {
				throw new Error(workspaceError.message)
			}

			return new Response(JSON.stringify({ workspace: workspace }), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
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
	} else if (pathname === "/update-name"){
		try {
			const { workspace_name, id } = body

			const { data, error } = await supabaseClient
					.from("workspaces")
					.update({ name: workspace_name })
					.eq("id", id)

			if (error) {
				throw new Error(error.message)
			}

			return new Response(JSON.stringify({ message: data }), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		} catch (err) {
			console.error(err.message)
			return new Response(
				JSON.stringify({ message: err.message}),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
		}
	} else if (pathname === "/create"){
		try {
			const { owner_id } = body

				const { data: newWorkspace, error } = await supabaseClient
									.from("workspaces")
									.insert({ name: "My Workspace", owner_id: owner_id })
									.select()
									.maybeSingle()

			if (error) {
				throw new Error(error.message)
			}

			return new Response(JSON.stringify({ newWorkspace: newWorkspace }), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})

		} catch (err) {
			console.error(err.message)
			return new Response(
				JSON.stringify({ message: err.message }),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
		}
	} else if (pathname === "/delete"){
		try {
			const { workspace_id } = body

			const { data, error } = await supabaseClient
				.from("workspaces")
				.delete()
				.eq("id", workspace_id)

			if (error) {
				throw new Error(error.message)
			}

			return new Response(JSON.stringify({ message: data }), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		} catch (err) {
			console.error(err.message)
			return new Response(
				JSON.stringify({ message: err.message}),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
		}
	} else if (pathname === "/get-member"){
		try {
			const { user_id } = body

			const { data: currentUser, error: currentUserError } = await supabaseClient
				.from("workspace_members")
				.select("*")
				.eq("user_id", user_id)
				.single()

			if (currentUserError) {
				throw new Error(currentUserError.message)
			}

			return new Response(JSON.stringify({ currentUser: currentUser }), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		} catch (err) {
			console.error(err.message)
			return new Response(JSON.stringify({ message: err.message }), {
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		}
	} else if (pathname === "/get-all-members"){

		try {
			const { workspace_id } = body
			console.log(workspace_id)

		const { data: members, error: membersError } = await supabaseClient
			.from("workspace_members")
			.select("role, user_id")
			.eq("workspace_id", workspace_id)

			if (membersError) {
				throw new Error(membersError.message)
			}

			return new Response(JSON.stringify({ members: members }), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		} catch (err) {
			console.error(err.message)
			return new Response(
				JSON.stringify({ message: err.message}),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			)
		}

		
	}else if (pathname === "/delete-member"){
		try {
			const { user_id } = body

			const { data, error } = await supabaseClient
				.from("workspace_members")
				.delete()
				.eq("user_id", user_id)

			if (error) {
				throw new Error(error.message)
			}

			return new Response(JSON.stringify({ data: data }), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		} catch (err) {
			console.error(err.message)
			return new Response(JSON.stringify({ message: err.message }), {
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		}
	}
	else if (pathname === "/add-invitation"){
		try {
			const { workspace_id,
							email,
							invited_by,
							invitation_code} = body

		const { data, error } = await supabaseClient
			.from("invitations")
			.insert([
				{
					workspace_id: workspace_id,
					email: email,
					invited_by: invited_by,
					invitation_code: invitation_code,
				},
			])
			.select()

			if (error) {
				throw new Error(error.message)
			}

			return new Response(JSON.stringify({ data: data }), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		} catch (err) {
			console.error(err.message)
			return new Response(JSON.stringify({ message: err.message }), {
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		}
	} else if (pathname === "/get-invitations"){

		try {
			const { workspace_id } = body

			const { data: invitations, error } = await supabaseClient
				.from("invitations")
				.select("*")
				.eq("workspace_id", workspace_id)

			if (error) {
				throw new Error(error.message)
			}

			return new Response(JSON.stringify({ invitations: invitations }), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		} catch (err) {
			console.error(err.message)
			return new Response(JSON.stringify({ message: err.message }), {
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		}
	} else if (pathname === "/initialize-workspace"){
		
		try {
			const { user_id } = body

			const { data: workspace, error } = await supabaseClient
				.from("workspaces")
				.insert({ name: "My Workspace", owner_id: user_id })
				.select()
				.maybeSingle()

			if (error) {
				throw new Error(error.message)
			}

			const {data: member , error: memberError} = await supabaseClient
				.from("workspace_members")
				.insert({"workspace_id": workspace.id, "user_id": user_id, "role": "owner" })
				.select();
			
			if(memberError){
				throw new Error(memberError.message)
			}

			return new Response(JSON.stringify({ currentUser: member }), {
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		} catch (err) {
			console.error(err.message)
			return new Response(JSON.stringify({ message: err.message }), {
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			})
		}
	}else if (pathname === "/get-credits"){

	try {
		const { owner_id } = body

		const { data: ownerInfo, error: ownerInfoError } = await supabaseClient
			.from("user_info")
			.select("credits")
			.eq("user_id", owner_id)
			.single()

		if (ownerInfoError) {
			throw new Error(ownerInfoError.message)
		}

		return new Response(JSON.stringify({ ownerInfo: ownerInfo }), {
			status: 200,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		})
	} catch (err) {
		console.error(err.message)
		return new Response(JSON.stringify({ message: err.message }), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		})
	}

	} else if (pathname === "/get-emails"){
			try {
				const { userIds } = body

				const { data: users, error: usersError } = await supabaseClient
					.from("user_info")
					.select("user_id, email")
					.in("user_id", userIds)

				if (usersError) {
					throw new Error(usersError.message)
				}

				return new Response(JSON.stringify({ users: users }), {
					status: 200,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				})
			} catch (err) {
				console.error(err.message)
				return new Response(JSON.stringify({ message: err.message }), {
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				})
			}

	}
})
