import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.portalibadah.app',
  appName: 'Portal Ibadah',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      backgroundColor: "#ffffff",
      launchShowDuration: 2000,
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "adzannotif.mp3",
    },
  },
};

export default config;
