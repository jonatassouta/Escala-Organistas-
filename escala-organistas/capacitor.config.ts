import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.escalaorganistas',
  appName: 'Escala Organistas',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
};

export default config;
