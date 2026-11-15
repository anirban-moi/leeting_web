import { registerBackgroundListeners } from '../src/background/lifecycle.js';

export default defineBackground(() => {
  console.log('Leeting background service worker started.');
  registerBackgroundListeners();
});
