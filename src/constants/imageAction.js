import axios from "axios";
import { NEXT_PUBLIC_BUCKET_URL } from "@env";

const BASE_URL = NEXT_PUBLIC_BUCKET_URL;
//const BASE_URL = "https://babyflix.ai";

export const callImageAction = async ({ object_name, action, user, imageUrl, imageId }) => {
  try {
    console.log('User',object_name, action, imageUrl, imageId)
    if (!user?.uuid || !user?.machineId) {
      throw new Error("Missing user_id or machine_id in auth slice");
    }
    console.log("`${BASE_URL}/image_action`",`${BASE_URL}/image_action`)

     //const response = await axios.post(`https://ai.babyflix.net/image_action`, { 
    const response = await axios.post(`${BASE_URL}/image_action`, {
      object_name,
      action,
      machine_id: user.machineId,
      user_id: user.uuid,
      image_url: imageUrl,
      image_id: String(imageId),
    });

     console.log('callImageAction response',response.data)

    return response.data;
  } catch (error) {
    console.error("Error calling /image_action:", error?.response || error);
    throw error;
  }
};
