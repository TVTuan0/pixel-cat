// Lets players install the game to their home screen, and keeps it working offline.
import { track } from './analytics.js';

let installPrompt = null;

export function startInstallSupport() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Offline copy is a bonus; the game works without it.
    });
  }
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    track('install');
  });
}

// 'installed' (already running as an app), 'prompt' (browser can install it), 'ios' (needs manual steps), or 'none'.
export function installState() {
  if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) return 'installed';
  if (installPrompt) return 'prompt';
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return 'ios';
  return 'none';
}

export async function promptInstall() {
  if (!installPrompt) return;
  const prompt = installPrompt;
  installPrompt = null;
  await prompt.prompt();
}
