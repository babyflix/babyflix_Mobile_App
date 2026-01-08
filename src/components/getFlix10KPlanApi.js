import {
  getPlanStart,
  getPlanSuccess,
  getPlanError,
} from "../state/slices/planSlice";

export const getFlix10KPlanApi = async (dispatch) => {
  try {
    dispatch(getPlanStart());

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/getpa`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    console.log("Flix10K storage plan details",result)

    if (result.actionStatus === "success") {
      dispatch(getPlanSuccess(result.data));
    } else {
      dispatch(getPlanError("Failed to fetch plan"));
    }
  } catch (error) {
    dispatch(getPlanError(error.message));
  }
};
