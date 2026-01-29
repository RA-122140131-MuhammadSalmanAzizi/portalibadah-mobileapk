import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.portalibadah.app',
  appName: 'Portal Ibadah',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      backgroundColor: '#ffffff',
      launchShowDuration: 2000,
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'adzannotif.mp3'
    },
    CapacitorUpdater: {
      autoUpdate: true,
      updateUrl: 'https://cdn.jsdelivr.net/gh/RA-122140131-MuhammadSalmanAzizi/portalibadah-mobileapk@main/update.json'
    }
  }
};

export default config;
