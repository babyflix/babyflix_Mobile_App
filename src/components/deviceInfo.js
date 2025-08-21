// import * as Device from "expo-device";
// import * as Application from 'expo-application';
// import { Platform } from "react-native";

// export default async function sendDeviceUserInfo(user) {
//   if (!user?.uuid) return;

//   try {
//     const uniqueId =
//       Platform.OS === "android"
//         ? Application.getAndroidId()
//         : await Application.getIosIdForVendorAsync();

//     const deviceInfo = {
//       brand: Device.brand,
//       modelName: Device.deviceName || Device.modelName,
//       osName: Device.osName,
//       osVersion: Device.osVersion,
//       deviceType: Device.deviceType,
//       uniqueId,
//     };

//     const payload = {
//       firstName: user.firstName || "",
//       lastName: user.lastName || "",
//       uuid: user.uuid || "",
//       companyId: user.companyId || "",
//       ...deviceInfo,
//       openedAt: new Date().toISOString(),
//       timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || moment.tz.guess(),
//     };

//     console.log("Payload to Send:", payload);

//     // Example API call
//     // await fetch("https://yourapi.com/app-open", {
//     //   method: "POST",
//     //   headers: { "Content-Type": "application/json" },
//     //   body: JSON.stringify(payload),
//     // });
//   } catch (error) {
//     console.error("Error sending device info:", error);
//   }
// }


import * as Device from "expo-device";
import { Platform } from "react-native";

export const USERACTIONS = {
  DOWNLOAD: "download",
  VIEW: "view",
  AI: "ai",
  SHARE: "share",
  DELETE: "delete",
  EDIT: "edit",
  LOGIN: "login",
  LOGOUT: "logout",
  LOGINDESC: "user logged in",
  FORGOTPASSWORD: "forgot-password",
  RESETPASSWORD: "reset-password",
  PAYMENT: "payment",
  LIVESTREAMINGJOINED: "live-streaming-joined",
  LIVESTREAMINGSTARTED: "live-streaming-started",
};

// Detect if environment is browser or app
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

  // Default → Expo/React Native app
  return { using_from: "APP", browser: "" };
}

export default async function sendDeviceUserInfo({
  action_type = "",
  action_description = "",
}) {
  try {
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
      platform: Platform.OS, // ios / android / web
      browser,
      using_from,
      action_description,
    };

    console.log("Payload to Send:", userActionPayload);

    // await fetch("/api/metrics/userActions", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(userActionPayload),
    // });
  } catch (error) {
    console.error("Error sending device info:", error);
  }
}
