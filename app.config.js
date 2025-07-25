import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "BabyFlix",
  slug: "babyflix",
  version: "1.1.4",
  scheme: "babyflix",
  extra: {
    eas: {
      projectId: "e45a100e-0d86-40a2-9119-4d54a93e0cf3"
    },
  },
  updates: {
  fallbackToCacheTimeout: 0
  },
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.babyflix.mobile.app",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/icon-foreground.png", 
      resizeMode: "contain",    
      backgroundColor: "#ffffff"
    },
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
      NSPhotoLibraryUsageDescription: "BabyFlix allows you to select baby ultrasound images and videos from your photo library to view them in the app",
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: ["fetch", "remote-notification"],
      CFBundleURLTypes: [ 
        {
          CFBundleURLSchemes: ["babyflix"]
        }
      ]
    }
  },
  android: {
    icon: "./assets/icon2.png", 
    adaptiveIcon: {
      foregroundImage: "./assets/icon-foreground.png", 
      backgroundColor: "#FF6996" 
    },
    package: "com.babyflix.app",
    splash: {
      image: "./assets/icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    //jsEngine: "hermes",
    intentFilters: [ // ✅ Android deep linking
      {
        action: "VIEW",
        data: [
          {
            scheme: "babyflix",
            host: "*",
            pathPrefix: "/"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ],
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
        photosPermission: "Allow BabyFlix to access your photo library to select baby-related images and videos.",
      }
    ],
    "expo-web-browser",
    "expo-notifications",
    "expo-av",
    [
      "expo-build-properties",
      {
        ios: {
          jsEngine: "jsc",
          turboModules: false,  // Disable TurboModules for iOS
        },
        android: {
          jsEngine: "hermes",
        },
      }
    ],
    "expo-font",
  ],
});
