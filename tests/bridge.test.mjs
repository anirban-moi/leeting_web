import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  fetchRegisteredDevices,
  registerDeviceHeartbeat,
  registerDevice,
} from '../lib/services/device-service.js';

describe('Web ↔ Extension Bridge Services & Device Registry', () => {
  it('exports registerDevice alias identical to registerDeviceHeartbeat', () => {
    assert.strictEqual(typeof registerDevice, 'function');
    assert.strictEqual(registerDevice, registerDeviceHeartbeat);
  });

  it('returns fallback registered devices when unauthenticated or local', async () => {
    const devices = await fetchRegisteredDevices(null);
    assert.ok(Array.isArray(devices));
    assert.ok(devices.length >= 1);
    assert.strictEqual(devices[0].isCurrent, true);
    assert.ok(devices[0].name.length > 0);
  });

  it('fails registerDeviceHeartbeat gracefully if userId is missing', async () => {
    const result = await registerDeviceHeartbeat(null, {
      deviceId: 'dev_123',
      deviceName: 'Chrome Companion',
      browserType: 'Chrome',
      extensionVersion: '1.0.9',
    });
    assert.strictEqual(result, false);
  });
});
