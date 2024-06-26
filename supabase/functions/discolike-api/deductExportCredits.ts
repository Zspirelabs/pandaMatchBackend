import { supabaseClient } from "../_shared/supabaseClient.ts";
import mixpanel from "../_shared/mixpanel.ts";

const updateExportCredit = async (count: number, user_id: string) => {
  let calculatedexportcredit = 0;

  console.log("Deducting Export Credits of " + count);

  const { data, error } = await supabaseClient
    .from("user_info")
    .select("record_exports,export_credits")
    .eq("user_id", user_id)
    .single();

  //   console.log(data);

  if (error) {
    throw new Error(error.message);
  }

  calculatedexportcredit = parseInt(data.export_credits) - count;


  if (calculatedexportcredit < 0) {
    calculatedexportcredit = 0
  }

  const mixpaneltrigger = (calculatedexportcredit, user_id) => {
    try {
      console.log("Mixpanel tracking started");
      mixpanel.track(
        "Data Fetched",
        { no_of_lines_fetched: calculatedexportcredit, user_id: user_id },
        () => {
          console.log(
            `Successfully Triggered Mixpanel`,
            user_id,
            calculatedexportcredit
          );
        }
      );
    } catch (error) {
      console.error(
        `Error triggering Mixpanel for user ${user_id} with ${calculatedexportcredit} lines fetched:`,
        error
      );
    }
  };

  if (data) {
    const { error: error2 } = await supabaseClient
      .from("user_info")
      .update({
        export_credits: calculatedexportcredit,
        record_exports: parseInt(data.record_exports) + count,
      })
      .eq("user_id", user_id)
      .select();

    if (error2) {
      throw new Error(error2.message);
    }

    console.log("Export Credit Deducted Successfully.");
    mixpaneltrigger(calculatedexportcredit, user_id);
  }
};

export default updateExportCredit;
