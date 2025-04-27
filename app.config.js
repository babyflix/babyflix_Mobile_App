import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "BabyFlix",
  slug: "babyflix",
  version: "1.0.0",
  extra: {
    API_URL: process.env.API_URL,
    ENV: process.env.ENV,
    eas: {
      projectId: "0a6a7334-a32c-422b-ac8f-1219571b0149" 
    }
  },
  orientation: "portrait",
  icon: "./assets/logo.png",
  splash: {
    image: "./assets/images/adaptive-icon2.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  userInterfaceStyle: "light",
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.babyflix.app",
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
        "NSAllowsArbitraryLoadsInWebContent": true
      },
      UISupportedInterfaceOrientations: [
        "UIInterfaceOrientationPortrait",
        "UIInterfaceOrientationLandscapeLeft",
        "UIInterfaceOrientationLandscapeRight"
      ]
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon2.png",
      backgroundColor: "#ffffff"
    },
    package: "com.babyflix.app",
    jsEngine: "hermes",
    permissions: [
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "CAMERA"
    ] 
  },
  plugins: [
    "expo-router",
    [
      "expo-image-picker",
      {
        photosPermission: "Allow BabyFlix to access your photos",
        cameraPermission: "Allow BabyFlix to access your camera"
      }
    ],
    "expo-video",
    "expo-build-properties",
    "expo-font"
  ]
});
