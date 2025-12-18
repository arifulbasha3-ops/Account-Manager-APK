import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.accountmanager',
  appName: 'Account Manager',
  webDir: 'dist',
  android: {
    fullscreen: false
  }
};

export default config;
