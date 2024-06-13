import { supabaseClient } from "../_shared/supabaseClient.ts"

const supabaseAuth = async (authHeader: string) => {

		const token = authHeader.replace("Bearer ", "")
		const user = await supabaseClient.auth.getUser(token)
		
		if(!(user?.data?.user)){
			throw new Error("Request Unauthorized")
		}
		else{
			console.log("User Found: " + user.data.user.id)
			return user.data.user
		}
}

export default supabaseAuth
