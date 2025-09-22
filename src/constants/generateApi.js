import axios from "axios";
import { NEXT_PUBLIC_BUCKET_URL } from "@env";

const BASE_URL = NEXT_PUBLIC_BUCKET_URL;
//const BASE_URL = "https://babyflix.ai";

export async function generateImage(imageUrl, objectType, user, imageId) {
  const MAX_RETRIES = 10;
  let lastError = null;
  console.log('imageUrl, objectType, user, imageId',{imageUrl, objectType, imageId})

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
       console.log("`${BASE_URL}/generate`",`${BASE_URL}/generate`) 
      const response = await axios.get(`${BASE_URL}/generate`, {
        params: {
          user_id: user.uuid,
          image_url: imageUrl,
          image_id: imageId,
          object_type: objectType,
        },
      });

      console.log("response of generate",response.data)
      return response.data;
    } catch (error) {
      lastError = error;

      await new Promise((resolve) => setTimeout(resolve, 200));

      console.warn(
        `Attempt ${attempt} failed, retrying... (${error.message || error})`
      );
    }
  }

  throw new Error(
    `All ${MAX_RETRIES} attempts failed. Last error: ${
      lastError?.message || lastError
    }`
  );
}
