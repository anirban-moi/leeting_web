import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Leeting - LeetCode & Focus Companion',
    description: 'Track daily LeetCode challenges, contest alerts, auto-claim coins, and block distracting shorts.',
    version: '1.0.9',
    permissions: [
      'storage',
      'alarms',
      'notifications',
      'cookies',
      'declarativeNetRequest',
      'declarativeNetRequestWithHostAccess'
    ],
    host_permissions: [
      '*://*.leetcode.com/*',
      '*://*.youtube.com/*',
      '*://*.instagram.com/*',
      '*://*.facebook.com/*',
      '*://*.fb.com/*',
      '*://*.linkedin.com/*',
      'http://localhost/*',
      'http://127.0.0.1/*'
    ],
    web_accessible_resources: [
      {
        resources: ['blocked.html'],
        matches: ['<all_urls>']
      }
    ],
    externally_connectable: {
      matches: [
        'http://localhost:3000/*',
        'http://localhost:3001/*',
        'http://127.0.0.1:3000/*',
        'https://*.leeting.dev/*',
        'https://*.vercel.app/*'
      ]
    },
    action: {
      default_title: 'Leeting',
      default_popup: 'popup.html'
    },
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
  },
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      if (wxt.config.browser === 'firefox') {
        manifest.browser_specific_settings = {
          gecko: {
            id: 'leeting@leeting.dev',
            strict_min_version: '113.0',
          },
        };
      }
    },
  },
});
