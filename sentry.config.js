import * as Sentry from '@sentry/react-native';

const isDev = __DEV__; // true in development, including Expo Go

Sentry.init({
  dsn: "https://94225de8dec8beebd5a14d91a7d68980@o4509394123227136.ingest.us.sentry.io/4509394126307328",
  enableNative: true,
  enableNativeCrashHandling: true,
  debug: isDev, // Optional: shows logs in dev
  enableInExpoDevelopment: true, // REQUIRED for Expo Go
  environment: isDev ? 'development' : 'production', // Set environment
});
