import { describe, it, expect, vi, afterEach } from 'vitest';
import { executeGraphQL, fetchUserStatus } from '../src/services/leetcode.js';
import {
  syncLeetCodeNetworkRules,
  LEETCODE_HEADER_RULE_ID,
  LEETCODE_COOKIE_RULE_ID,
} from '../src/services/network.js';
import { storageGet, storageSet } from '../src/services/storage.js';

describe('Authentication & Session Handling', () => {
  afterEach(() => {
    delete globalThis.chrome;
    delete globalThis.browser;
  });

  it('attaches x-csrftoken header from chrome.cookies in GraphQL requests', async () => {
    globalThis.chrome = {
      cookies: {
        get: vi.fn((_opts, cb) => cb({ name: 'csrftoken', value: 'csrf_token_xyz' })),
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { ok: true } }),
    });

    await executeGraphQL('query ping { ok }', {}, mockFetch);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://leetcode.com/graphql',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-csrftoken': 'csrf_token_xyz',
        }),
      })
    );
  });

  it('flags hasSessionCookie=true when LEETCODE_SESSION exists even if server says signed out', async () => {
    globalThis.chrome = {
      cookies: {
        getAll: vi.fn((_query, cb) =>
          cb([{ name: 'LEETCODE_SESSION', value: 'stale_or_unverified_session' }])
        ),
        get: vi.fn((_opts, cb) => cb(null)),
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          userStatus: { isSignedIn: false, username: null, userId: null },
        },
      }),
    });

    const status = await fetchUserStatus(mockFetch);
    expect(status.isSignedIn).toBe(false);
    expect(status.hasSessionCookie).toBe(true);
    expect(status.username).toBeNull();
  });

  it('falls back from set to append operation when browser blocks Cookie set rule', async () => {
    const updateDynamicRulesMock = vi
      .fn()
      .mockResolvedValueOnce(undefined) // LEETCODE_HEADER_RULE_ID succeeds
      .mockRejectedValueOnce(new Error('Cookie header set blocked')) // op='set' fails
      .mockResolvedValueOnce(undefined); // op='append' succeeds

    globalThis.chrome = {
      cookies: {
        getAll: vi.fn((_q, cb) =>
          cb([
            { name: 'LEETCODE_SESSION', value: 'sess_abc' },
            { name: 'csrftoken', value: 'csrf_def' },
          ])
        ),
      },
      declarativeNetRequest: { updateDynamicRules: updateDynamicRulesMock },
    };

    const res = await syncLeetCodeNetworkRules();
    expect(res).toEqual({ ok: true });
    expect(updateDynamicRulesMock).toHaveBeenCalledTimes(3);
    expect(updateDynamicRulesMock.mock.calls[2][0].removeRuleIds).toEqual([LEETCODE_COOKIE_RULE_ID]);
    expect(updateDynamicRulesMock.mock.calls[2][0].addRules[0].action.requestHeaders[0]).toEqual({
      header: 'Cookie',
      operation: 'append',
      value: 'LEETCODE_SESSION=sess_abc; csrftoken=csrf_def',
    });
  });

  it('clears LeetCode cookie rule when user is logged out (no cookies)', async () => {
    const updateDynamicRulesMock = vi.fn().mockResolvedValue(undefined);
    globalThis.chrome = {
      cookies: {
        getAll: vi.fn((_q, cb) => cb([])),
      },
      declarativeNetRequest: { updateDynamicRules: updateDynamicRulesMock },
    };

    await syncLeetCodeNetworkRules();

    expect(updateDynamicRulesMock).toHaveBeenCalledTimes(2);
    expect(updateDynamicRulesMock.mock.calls[0][0].removeRuleIds).toEqual([LEETCODE_HEADER_RULE_ID]);
    expect(updateDynamicRulesMock.mock.calls[1][0]).toEqual({
      removeRuleIds: [LEETCODE_COOKIE_RULE_ID],
      addRules: [],
    });
  });

  it('supports Firefox promise-based browser.storage.local without chrome global', async () => {
    const mem = new Map();
    globalThis.browser = {
      storage: {
        local: {
          get: async ([k]) => (mem.has(k) ? { [k]: mem.get(k) } : {}),
          set: async (obj) => {
            Object.entries(obj).forEach(([k, v]) => mem.set(k, v));
          },
        },
      },
    };

    expect(await storageSet('ff_key', 'ff_value')).toBe(true);
    expect(await storageGet('ff_key')).toBe('ff_value');
    expect(await storageGet('missing_key', 'fallback')).toBe('fallback');
  });
});
