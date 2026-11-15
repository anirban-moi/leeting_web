import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Extension Build Artifacts', () => {
  it('should have built valid Chrome MV3 manifest', () => {
    const chromeManifestPath = path.resolve(__dirname, '../.output/chrome-mv3/manifest.json');
    expect(fs.existsSync(chromeManifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(chromeManifestPath, 'utf-8'));
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.version).toBe('1.0.9');
    expect(manifest.name).toBe('Leeting - LeetCode & Focus Companion');
    expect(manifest.content_scripts).toBeDefined();
    expect(manifest.content_scripts.some((c) => c.js.includes('content-scripts/focus.js'))).toBe(true);
  });

  it('should have built valid Firefox MV3 manifest', () => {
    const firefoxManifestPath = path.resolve(__dirname, '../.output/firefox-mv3/manifest.json');
    expect(fs.existsSync(firefoxManifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(firefoxManifestPath, 'utf-8'));
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.version).toBe('1.0.9');
    expect(manifest.name).toBe('Leeting - LeetCode & Focus Companion');
    expect(manifest.background?.scripts).toContain('background.js');
    expect(manifest.browser_specific_settings?.gecko?.id).toBe('leeting@leeting.dev');
    expect(manifest.content_scripts).toBeDefined();
    expect(manifest.content_scripts.some((c) => c.js.includes('content-scripts/focus.js'))).toBe(true);
  });
});
