import { supabaseClient } from "../_shared/supabaseClient.ts"

const updateExportCredit = async (count: number, user_id: string) => {
    console.log("Deducting Export Credits of "+ count)

	const { data, error } = await supabaseClient
		.from("user_info")
		.select("record_exports,export_credits")
		.eq("user_id", user_id)
		.single()

    if(error){
        throw new Error(error.message)
    }
    
	if (data) {
		const {error: error2 } = await supabaseClient
			.from("user_info")
			.update({
				export_credits: parseInt(data.export_credits) - count,
				record_exports: parseInt(data.record_exports) + count,
			})
			.eq("user_id", user_id)
			.select()

		if (error2) {
			throw new Error(error2.message)
		}
		
        console.log("Export Credit Deducted Successfully.")
	}
}

export default updateExportCredit
