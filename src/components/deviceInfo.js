import * as Device from "expo-device";
import * as Application from 'expo-application';
import { Platform } from "react-native";

export default async function sendDeviceUserInfo(user) {
  if (!user?.uuid) return;

  try {
    const uniqueId =
      Platform.OS === "android"
        ? Application.getAndroidId()
        : await Application.getIosIdForVendorAsync();

    const deviceInfo = {
      brand: Device.brand,
      modelName: Device.deviceName || Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
      deviceType: Device.deviceType,
      uniqueId,
    };

    const payload = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      uuid: user.uuid || "",
      companyId: user.companyId || "",
      ...deviceInfo,
      openedAt: new Date().toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || moment.tz.guess(),
    };

    console.log("Payload to Send:", payload);

    // Example API call
    // await fetch("https://yourapi.com/app-open", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload),
    // });
  } catch (error) {
    console.error("Error sending device info:", error);
  }
}
