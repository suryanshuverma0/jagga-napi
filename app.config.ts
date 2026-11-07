import type { ConfigContext, ExpoConfig } from 'expo/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { resolveAdIds } = require('./config/ad-ids.js') as {
  resolveAdIds: (env: NodeJS.ProcessEnv) => {
    appId: string;
    banner: string;
    interstitial: string;
    rewarded: string;
    usingTestIds: boolean;
  };
};

const profile = process.env.EAS_BUILD_PROFILE ?? 'local';
const ads = resolveAdIds(process.env);

// The development profile keeps every ABI so the app runs on x86_64 emulators.
// Release profiles ship ARM only to keep the AAB inside the 25 MB budget.
const buildArchs =
  profile === 'production' || profile === 'preview' ? ['armeabi-v7a', 'arm64-v8a'] : undefined;

const BRAND_GREEN = '#1B6B4A';
const DARK_BG = '#0F1412';

const MUKTA = './node_modules/@expo-google-fonts/mukta';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Jagga Napi',
  slug: 'jagga-napi',
  scheme: 'jagganapi',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  backgroundColor: '#F7F5EF',
  android: {
    package: 'com.suryanshuverma.jagganapi',
    // versionCode is managed remotely by EAS (eas.json: appVersionSource "remote", autoIncrement).
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: BRAND_GREEN,
    },
    softwareKeyboardLayoutMode: 'resize',
    predictiveBackGestureEnabled: false,
    // The app needs no runtime permissions. AdMob merges INTERNET, ACCESS_NETWORK_STATE and AD_ID.
    permissions: [],
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.RECORD_AUDIO',
    ],
  },
  ios: {
    bundleIdentifier: 'com.suryanshuverma.jagganapi',
    supportsTablet: false,
  },
  plugins: [
    'expo-router',
    'expo-system-ui',
    'expo-localization',
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 37,
          targetSdkVersion: 36,
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          useDayNightTheme: true,
          ...(buildArchs ? { buildArchs } : {}),
        },
      },
    ],
    [
      'expo-font',
      {
        android: {
          fonts: [
            {
              fontFamily: 'Mukta',
              fontDefinitions: [
                { path: `${MUKTA}/400Regular/Mukta_400Regular.ttf`, weight: 400 },
                { path: `${MUKTA}/500Medium/Mukta_500Medium.ttf`, weight: 500 },
                { path: `${MUKTA}/600SemiBold/Mukta_600SemiBold.ttf`, weight: 600 },
                { path: `${MUKTA}/700Bold/Mukta_700Bold.ttf`, weight: 700 },
              ],
            },
          ],
        },
        ios: {
          fonts: [
            `${MUKTA}/400Regular/Mukta_400Regular.ttf`,
            `${MUKTA}/500Medium/Mukta_500Medium.ttf`,
            `${MUKTA}/600SemiBold/Mukta_600SemiBold.ttf`,
            `${MUKTA}/700Bold/Mukta_700Bold.ttf`,
          ],
        },
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 160,
        resizeMode: 'contain',
        backgroundColor: '#F7F5EF',
        dark: { image: './assets/splash-icon.png', backgroundColor: DARK_BG },
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: ads.appId,
        // iOS is not shipped in v1; the plugin still requires a value.
        iosAppId: 'ca-app-pub-3940256099942544~1458002511',
        delayAppMeasurementInit: true,
        optimizeInitialization: true,
        optimizeAdLoading: true,
      },
    ],
    'expo-sharing',
  ],
  experiments: { typedRoutes: true },
  extra: {
    buildProfile: profile,
    ads: {
      banner: ads.banner,
      interstitial: ads.interstitial,
      rewarded: ads.rewarded,
      usingTestIds: ads.usingTestIds,
    },
    privacyPolicyUrl: 'https://suryanshuverma0.github.io/jagga-napi/privacy',
    supportEmail: 'suryanshuverma.dev@gmail.com',
    // Set by `eas init` (see docs/release-checklist.md). Replace with the literal ID it prints.
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
});
