// import 'dotenv/config';

// export default ({ config }) => ({
//   ...config,
//   name: "BabyFlix",
//   slug: "babyflix",
//   version: "1.0.0",
//   extra: {
//     API_URL: process.env.API_URL, // Dynamically load API URL
//     ENV: process.env.ENV, // Track the current environment
//   },
//   orientation: "portrait",
//   icon: "./assets/logo.png",
//   splash: {
//     image: "./assets/splash.png",
//     resizeMode: "contain",
//     backgroundColor: "#ffffff"
//   },
//   userInterfaceStyle: "light",
//   assetBundlePatterns: ["**/*"],
//   ios: {
//     supportsTablet: true,
//     bundleIdentifier: "com.babyflix.app"
//   },
//   android: {
//     adaptiveIcon: {
//       foregroundImage: "./assets/adaptive-icon.png",
//       backgroundColor: "#ffffff"
//     },
//     package: "com.babyflix.app",
//     jsEngine: "hermes"

//   },
//   plugins: [
//     "expo-router",
//     [
//       "expo-image-picker",
//       {
//         photosPermission: "Allow BabyFlix to access your photos",
//         cameraPermission: "Allow BabyFlix to access your camera"
//       }
//     ],
//     "expo-build-properties"
//   ]
// });

import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "BabyFlix",
  slug: "babyflix",
  version: "1.0.0",
  extra: {
    API_URL: process.env.API_URL, // Dynamically load API URL
    ENV: process.env.ENV, // Track the current environment
    eas: {
      projectId: "0a6a7334-a32c-422b-ac8f-1219571b0149" // Required for EAS setup
    }
  },
  orientation: "portrait",
  icon: "./assets/logo.png",
  splash: {
    image: "./assets/images/adaptive-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  userInterfaceStyle: "light",
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.babyflix.app"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.babyflix.app",
    jsEngine: "hermes" // Correctly added Hermes JS engine
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
    "expo-build-properties"
  ]
});
