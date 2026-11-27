/**
 * Capacitor wrapper for a later Android / iOS build.
 * v1 does not generate the native projects and does not submit to the stores.
 * When that is requested:
 *   npm i @capacitor/core @capacitor/cli
 *   npx cap add android
 *   npx cap add ios
 */
const config = {
  appId: "il.mishakim.yachad",
  appName: "משחקים יחד",
  webDir: "dist",
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },
  android: {
    path: "android",
  },
  ios: {
    path: "ios",
    contentInset: "automatic",
  },
};

export default config;
