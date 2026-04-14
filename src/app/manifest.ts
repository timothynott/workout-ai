import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Workout AI',
    short_name: 'Workout',
    description: 'AI-powered personal workout app',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#000000',
    // TODO(Phase 9): add proper icons once branding is finalised
    // icons: [
    //   { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    //   { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    // ],
  };
}
