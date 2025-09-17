import axios from "axios";
import { NEXT_PUBLIC_BUCKET_URL } from "@env";

const BASE_URL = NEXT_PUBLIC_BUCKET_URL;
//const BASE_URL = "https://ai.babyflix.net";

export async function generateImage(imageUrl, objectType, user) {
  const MAX_RETRIES = 10;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(`${BASE_URL}/generate`, {
        params: {
          user_id: user.uuid,
          image_url: imageUrl,
          object_type: objectType,
        },
      });

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
