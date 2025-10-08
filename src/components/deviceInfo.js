import axios from "axios";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { EXPO_PUBLIC_API_URL } from '@env';

export const USERACTIONS = {
  DOWNLOAD: "Download",
  VIEW: "View",
  AI: "AI",
  SHARE: "Share",
  DELETE: "Delete",
  EDIT: "Edit",
  LOGIN: "Login",
  LOGINDESC: "user logged in",
  FORGOTPASSWORD: "Forgot Password",
  RESETPASSWORD: "Reset Password",
  PAYMENT: "payment",
  LIVESTREAMINGJOINED: "Live Streaming Joined",
  LIVESTREAMINGSTARTED: "Live Streaming Started",
  DEVICE: "device-report",
  NEWSUBCRIPTION: "New Subscription",
  UNSUBSCRIBE: "Unsubscribe",
  UPDATESUBSCRIPTION: "Update Subscription",
  FLIX10: "FLIX10",
  FLIX10KBABYPROFILEIMAGE: "ai baby profile image",
  FLIX10KBABYPROFILEVIDEO: "ai baby profile video",
  FLIX10KBABYPREDICTIVEIMAGE: "predictive image",
  FLIX10KKEEP: "predicitive image-keep",
  FLIX10KREGENERATE: "predicitive image-regenerate",
  FLIX10KDELETE: "predicitive image-delete",
};

function detectEnvironment() {
  if (Platform.OS === "web") {
    const userAgent = navigator.userAgent;

    let browser = "Unknown";
    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Edg")) browser = "Edge";

    return { using_from: "BROWSER", browser };
  }

  return { using_from: "APP", browser: "" };
}

export default async function sendDeviceUserInfo({
  action_type = "",
  action_description = "",
}) {
  const { using_from, browser } = detectEnvironment();

  const userActionPayload = {
    action_type,
    device_type:
      Device.deviceType === 1
        ? "mobile"
        : Device.deviceType === 2
          ? "tablet"
          : "unknown",
    device: Device.deviceName || Device.modelName || "unknown",
    platform: Platform.OS,
    browser,
    using_from,
    action_description,
  };

  console.log("Payload to Send:", userActionPayload);
  try {

    const response = await axios.post(
      `${EXPO_PUBLIC_API_URL}/api/metrics/userActions`,
      userActionPayload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("respond userActions", response.data);
  } catch (error) {
    console.error("Error sending device info:", error);
  }
}
