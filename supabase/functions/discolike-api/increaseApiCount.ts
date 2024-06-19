import { supabaseClient } from "../_shared/supabaseClient.ts";


export const increaseApiCount = async (user_id: string) => {
  try {
    const { data: userData, error: fetchError } = await supabaseClient
      .from("user_info")
      .select("api_count")
      .eq("user_id", user_id)
      .single();

    if (fetchError) {
      console.error("Error fetching user data:", fetchError);
      throw new Error("Error fetching user data");
    }

    if (!userData) {
      throw new Error("User not found");
    }

    // Calculate new API count
    const newApiCount = (userData.api_count as number) + 1;
    console.log("New Api Count:", newApiCount, "Old Api Count:", userData.api_count);

    const { data: updateData, error: updateError } = await supabaseClient
      .from("user_info")
      .update({ api_count: newApiCount })
      .eq("user_id", user_id)
      .select();

    if (updateError) {
      console.error("Error updating user API count:", updateError);
      throw new Error("Error updating user API count");
    }

    console.log("Updated Data:", updateData);
    return updateData;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
