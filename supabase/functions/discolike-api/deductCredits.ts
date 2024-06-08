import { supabaseClient } from "./supabaseClient.ts";

export const deductCredits = async (
  user_id: string,
  creditsToDeduct: number
) => {
  console.log("Deducting Credits:", creditsToDeduct);
  console.log("User ID:", user_id);
  try {

    const { data: userData, error: fetchError } = await supabaseClient
			.from("user_info")
			.select("credits")
			.eq("user_id", user_id);

      
    if (fetchError) {
      console.error("Error fetching user data:", fetchError);
      throw new Error("Error fetching user data");
    }

    if (!userData) {
      throw new Error("User not found");
    }

    // Calculate new credit amount
    const newCredits = parseInt(userData.credits) - creditsToDeduct;
    console.log("New Credits:", newCredits, "Old Credits:", userData.credits);

    if (newCredits < 0) {
      throw new Error("Insufficient credits");
    }

    const { data: updateData, error: updateError } = await supabaseClient
      .from("user_info")
      .update({ credits: newCredits })
      .eq("user_id", user_id)
      .select()

    if (updateError) {
      console.error("Error updating user credits:", updateError);
      throw new Error("Error updating user credits");
    }

    console.log("Updated Data:", updateData);
    return updateData;
  } catch (error) {
    console.error("Error:", error);
    throw error; 
  }
};
