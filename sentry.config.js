// sentry.config.js
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://94225de8dec8beebd5a14d91a7d68980@o4509394123227136.ingest.us.sentry.io/4509394126307328', // 🔁 Replace with your real DSN from Sentry.io
  enableInExpoDevelopment: true, // Optional: logs in dev mode
  debug: true, // Optional: logs Sentry events in console
});
