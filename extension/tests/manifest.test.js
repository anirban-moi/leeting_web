import { describe, it, expect } from 'vitest';
import wxtConfig from '../wxt.config.js';

describe('WXT Extension Configuration', () => {
  it('should have the correct extension name and version', () => {
    expect(wxtConfig.manifest.name).toBe('Leeting - LeetCode & Focus Companion');
    expect(wxtConfig.manifest.version).toBe('1.0.9');
  });

  it('should request necessary permissions', () => {
    const permissions = wxtConfig.manifest.permissions;
    expect(permissions).toContain('storage');
    expect(permissions).toContain('alarms');
    expect(permissions).toContain('notifications');
    expect(permissions).toContain('cookies');
    expect(permissions).toContain('declarativeNetRequest');
    expect(permissions).toContain('declarativeNetRequestWithHostAccess');
  });

  it('should have host permissions for LeetCode and focus targets', () => {
    const hostPermissions = wxtConfig.manifest.host_permissions;
    expect(hostPermissions).toContain('*://*.leetcode.com/*');
    expect(hostPermissions).toContain('*://*.youtube.com/*');
    expect(hostPermissions).toContain('*://*.instagram.com/*');
    expect(hostPermissions).toContain('*://*.facebook.com/*');
    expect(hostPermissions).toContain('*://*.fb.com/*');
    expect(hostPermissions).toContain('*://*.linkedin.com/*');
  });

  it('should expose blocked.html across all URLs for declarativeNetRequest redirects', () => {
    const war = wxtConfig.manifest.web_accessible_resources;
    expect(war).toBeDefined();
    expect(war[0].resources).toContain('blocked.html');
    expect(war[0].matches).toContain('<all_urls>');
  });
});
