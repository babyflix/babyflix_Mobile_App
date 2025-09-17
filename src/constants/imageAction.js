import axios from "axios";
import { NEXT_PUBLIC_BUCKET_URL } from "@env";

export const callImageAction = async ({ object_name, action, user }) => {
  try {
    console.log('User',object_name, action,)
    if (!user?.uuid || !user?.machineId) {
      throw new Error("Missing user_id or machine_id in auth slice");
    }

     //const response = await axios.post(`https://ai.babyflix.net/image_action`, {
    const response = await axios.post(`${NEXT_PUBLIC_BUCKET_URL}/image_action`, {
      object_name,
      action,
      machine_id: user.machineId,
      user_id: user.uuid,
    });

     console.log('callImageAction response',response.data)

    return response.data;
  } catch (error) {
    console.error("Error calling /image_action:", error?.response || error);
    throw error;
  }
};
