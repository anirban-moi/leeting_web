export const LEETCODE_HEADER_RULE_ID = 2001;
export const LEETCODE_COOKIE_RULE_ID = 2002;
export const FOCUS_BLOCK_RULE_ID = 3001;
export const FOCUS_PLAYABLES_RULE_ID = 3002;
export const FOCUS_LINKEDIN_VIDEO_RULE_ID = 3003;

/**
 * Deduplicate and format cookies for LeetCode
 */
export function buildCookieHeader(cookies) {
  if (!Array.isArray(cookies) || cookies.length === 0) {
    return { cookieString: '', csrfToken: '', hasSession: false };
  }

  const cookieMap = new Map();
  for (const c of cookies) {
    if (c && c.name && c.value !== undefined) {
      cookieMap.set(c.name, c.value);
    }
  }

  const parts = [];
  for (const [name, value] of cookieMap.entries()) {
    parts.push(`${name}=${value}`);
  }

  return {
    cookieString: parts.join('; '),
    csrfToken: cookieMap.get('csrftoken') || '',
    hasSession: cookieMap.has('LEETCODE_SESSION'),
  };
}

/**
 * Configure declarativeNetRequest dynamic rules to spoof Origin/Referer
 * and forward cookies & CSRF tokens for background requests.
 */
export async function syncLeetCodeNetworkRules() {
  if (typeof chrome === 'undefined' || !chrome.declarativeNetRequest) {
    return { ok: false };
  }

  let cookieString = '';
  let csrfToken = '';

  if (chrome.cookies?.getAll) {
    try {
      const cookies = await new Promise((resolve) => {
        chrome.cookies.getAll({ domain: 'leetcode.com' }, resolve);
      });
      const built = buildCookieHeader(cookies);
      cookieString = built.cookieString;
      csrfToken = built.csrfToken;
    } catch (err) {
      console.warn('Leeting: Failed to read leetcode.com cookies:', err);
    }
  }

  // Match all extension-initiated network requests to leetcode.com
  // while leaving normal leetcode.com tab traffic untouched
  const condition = {
    requestDomains: ['leetcode.com'],
    excludedInitiatorDomains: ['leetcode.com', 'www.leetcode.com'],
    resourceTypes: ['xmlhttprequest', 'other'],
  };

  // Rule 1: Origin, Referer, and x-csrftoken
  const baseHeaders = [
    { header: 'Origin', operation: 'set', value: 'https://leetcode.com' },
    { header: 'Referer', operation: 'set', value: 'https://leetcode.com/' },
  ];

  if (csrfToken) {
    baseHeaders.push({
      header: 'x-csrftoken',
      operation: 'set',
      value: csrfToken,
    });
  }

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [LEETCODE_HEADER_RULE_ID],
      addRules: [
        {
          id: LEETCODE_HEADER_RULE_ID,
          priority: 10,
          action: {
            type: 'modifyHeaders',
            requestHeaders: baseHeaders,
          },
          condition,
        },
      ],
    });
  } catch (err) {
    console.warn('Leeting: Could not set Origin/Referer DNR rule:', err);
  }

  // Rule 2: Cookie header (try 'set', fall back to 'append' if browser restricts 'set' on Cookie)
  if (cookieString) {
    for (const op of ['set', 'append']) {
      try {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [LEETCODE_COOKIE_RULE_ID],
          addRules: [
            {
              id: LEETCODE_COOKIE_RULE_ID,
              priority: 10,
              action: {
                type: 'modifyHeaders',
                requestHeaders: [
                  {
                    header: 'Cookie',
                    operation: op,
                    value: cookieString,
                  },
                ],
              },
              condition,
            },
          ],
        });
        break; // Success!
      } catch (err) {
        console.warn(`Leeting: DNR Cookie (${op}) failed:`, err.message);
      }
    }
  } else {
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [LEETCODE_COOKIE_RULE_ID],
        addRules: [],
      });
    } catch {
      // Ignore cleanup error
    }
  }

  return { ok: true };
}

/**
 * Enable or disable declarativeNetRequest blocking rules for Instagram, Facebook, and YouTube Playables
 */
export async function syncFocusModeNetworkRules(enabled) {
  if (typeof chrome === 'undefined' || !chrome.declarativeNetRequest) {
    return { ok: false };
  }

  const removeRuleIds = [FOCUS_BLOCK_RULE_ID, FOCUS_PLAYABLES_RULE_ID, FOCUS_LINKEDIN_VIDEO_RULE_ID];
  const addRules = enabled
    ? [
        {
          id: FOCUS_BLOCK_RULE_ID,
          priority: 20,
          action: {
            type: 'redirect',
            redirect: { extensionPath: '/blocked.html' },
          },
          condition: {
            requestDomains: ['instagram.com', 'facebook.com', 'fb.com'],
            resourceTypes: ['main_frame', 'sub_frame'],
          },
        },
        {
          id: FOCUS_PLAYABLES_RULE_ID,
          priority: 20,
          action: {
            type: 'redirect',
            redirect: { extensionPath: '/blocked.html' },
          },
          condition: {
            urlFilter: '||youtube.com/playables',
            resourceTypes: ['main_frame'],
          },
        },
        {
          id: FOCUS_LINKEDIN_VIDEO_RULE_ID,
          priority: 20,
          action: {
            type: 'redirect',
            redirect: { extensionPath: '/blocked.html' },
          },
          condition: {
            urlFilter: '||linkedin.com/video',
            resourceTypes: ['main_frame'],
          },
        },
      ]
    : [];

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    });
    return { ok: true };
  } catch (err) {
    console.warn('Leeting: Failed to sync Focus Mode DNR rules:', err);
    return { ok: false, error: err.message };
  }
}
