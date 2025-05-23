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
      projectId: "e45a100e-0d86-40a2-9119-4d54a93e0cf3"
    }
  },
  updates: {
  fallbackToCacheTimeout: 0
  },
  orientation: "portrait",
  icon: "./assets/icon.png",
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
    icon: "./assets/icon.png",
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
        NSAllowsArbitraryLoadsInWebContent: true
      },
      UISupportedInterfaceOrientations: [
        "UIInterfaceOrientationPortrait",
        "UIInterfaceOrientationLandscapeLeft",
        "UIInterfaceOrientationLandscapeRight"
      ],
      NSPhotoLibraryUsageDescription: "This app requires access to your photo library.",
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon2.png",
      backgroundColor: "#ffffff"
    },
    icon: "./assets/icon2.png", 
    adaptiveIcon: {
      foregroundImage: "./assets/icon-foreground.png", 
      backgroundColor: "#FF6996" 
    },
    package: "com.babyflix.app",
    jsEngine: "hermes",
    permissions: [
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
      "android.permission.READ_EXTERNAL_STORAGE", 
      "android.permission.WRITE_EXTERNAL_STORAGE"
    ] 
  },
  plugins: [
    "expo-router",
    [
      "expo-image-picker",
      {
        photosPermission: "Allow BabyFlix to access your photos",
      }
    ],
    "expo-video",
    "expo-build-properties",
    "expo-font"
  ],
});
