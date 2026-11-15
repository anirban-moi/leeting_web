import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  syncLeetCodeNetworkRules,
  syncFocusModeNetworkRules,
  buildCookieHeader,
  LEETCODE_HEADER_RULE_ID,
  LEETCODE_COOKIE_RULE_ID,
  FOCUS_BLOCK_RULE_ID,
  FOCUS_PLAYABLES_RULE_ID,
  FOCUS_LINKEDIN_VIDEO_RULE_ID,
} from '../src/services/network.js';

describe('buildCookieHeader', () => {
  it('deduplicates cookies and extracts csrftoken and session flag', () => {
    const { cookieString, csrfToken, hasSession } = buildCookieHeader([
      { name: 'csrftoken', value: 'old_csrf' },
      { name: 'csrftoken', value: 'fresh_csrf' },
      { name: 'LEETCODE_SESSION', value: 'sess_123' },
    ]);

    expect(csrfToken).toBe('fresh_csrf');
    expect(hasSession).toBe(true);
    expect(cookieString).toBe('csrftoken=fresh_csrf; LEETCODE_SESSION=sess_123');
  });
});

describe('syncLeetCodeNetworkRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles environment without chrome gracefully', async () => {
    await expect(syncLeetCodeNetworkRules()).resolves.not.toThrow();
  });

  it('updates declarativeNetRequest rules using requestDomains and separate Cookie rule', async () => {
    const updateDynamicRulesMock = vi.fn().mockResolvedValue(undefined);
    const getAllCookiesMock = vi.fn().mockImplementation((_opts, cb) => {
      cb([
        { name: 'LEETCODE_SESSION', value: 'fake_session_123' },
        { name: 'csrftoken', value: 'fake_csrf_456' },
      ]);
    });

    globalThis.chrome = {
      runtime: { id: 'ext_id_123' },
      declarativeNetRequest: {
        updateDynamicRules: updateDynamicRulesMock,
      },
      cookies: {
        getAll: getAllCookiesMock,
      },
    };

    await syncLeetCodeNetworkRules();

    expect(updateDynamicRulesMock).toHaveBeenCalledTimes(2);

    const headerRuleCall = updateDynamicRulesMock.mock.calls[0][0];
    expect(headerRuleCall.removeRuleIds).toContain(LEETCODE_HEADER_RULE_ID);
    const headerRule = headerRuleCall.addRules[0];
    expect(headerRule.condition.requestDomains).toEqual(['leetcode.com']);
    expect(headerRule.condition.excludedInitiatorDomains).toEqual(['leetcode.com', 'www.leetcode.com']);
    expect(headerRule.action.requestHeaders).toContainEqual({
      header: 'Origin',
      operation: 'set',
      value: 'https://leetcode.com',
    });
    expect(headerRule.action.requestHeaders).toContainEqual({
      header: 'x-csrftoken',
      operation: 'set',
      value: 'fake_csrf_456',
    });

    const cookieRuleCall = updateDynamicRulesMock.mock.calls[1][0];
    expect(cookieRuleCall.removeRuleIds).toContain(LEETCODE_COOKIE_RULE_ID);
    expect(cookieRuleCall.addRules[0].action.requestHeaders).toContainEqual({
      header: 'Cookie',
      operation: 'set',
      value: 'LEETCODE_SESSION=fake_session_123; csrftoken=fake_csrf_456',
    });

    delete globalThis.chrome;
  });
});

describe('syncFocusModeNetworkRules', () => {
  it('registers redirect rules for Instagram, Facebook, Playables, and LinkedIn Video when enabled', async () => {
    const updateDynamicRulesMock = vi.fn().mockResolvedValue(undefined);
    globalThis.chrome = {
      declarativeNetRequest: { updateDynamicRules: updateDynamicRulesMock },
    };

    await syncFocusModeNetworkRules(true);

    expect(updateDynamicRulesMock).toHaveBeenCalledTimes(1);
    const args = updateDynamicRulesMock.mock.calls[0][0];
    expect(args.removeRuleIds).toEqual([
      FOCUS_BLOCK_RULE_ID,
      FOCUS_PLAYABLES_RULE_ID,
      FOCUS_LINKEDIN_VIDEO_RULE_ID,
    ]);
    expect(args.addRules.length).toBe(3);
    expect(args.addRules[0].condition.requestDomains).toEqual(['instagram.com', 'facebook.com', 'fb.com']);
    expect(args.addRules[0].action.redirect.extensionPath).toBe('/blocked.html');
    const linkedinRule = args.addRules.find((r) => r.id === FOCUS_LINKEDIN_VIDEO_RULE_ID);
    expect(linkedinRule).toBeDefined();
    expect(linkedinRule.condition.urlFilter).toBe('||linkedin.com/video');
    expect(linkedinRule.action.redirect.extensionPath).toBe('/blocked.html');

    delete globalThis.chrome;
  });

  it('clears redirect rules when disabled', async () => {
    const updateDynamicRulesMock = vi.fn().mockResolvedValue(undefined);
    globalThis.chrome = {
      declarativeNetRequest: { updateDynamicRules: updateDynamicRulesMock },
    };

    await syncFocusModeNetworkRules(false);

    const args = updateDynamicRulesMock.mock.calls[0][0];
    expect(args.removeRuleIds).toEqual([
      FOCUS_BLOCK_RULE_ID,
      FOCUS_PLAYABLES_RULE_ID,
      FOCUS_LINKEDIN_VIDEO_RULE_ID,
    ]);
    expect(args.addRules).toEqual([]);

    delete globalThis.chrome;
  });
});
