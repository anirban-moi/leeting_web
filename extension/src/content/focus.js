export const FOCUS_STYLES = {
  YOUTUBE: `
    /* Hide Shorts button in left sidebar and mini guide */
    ytd-guide-entry-renderer:has(a[title="Shorts"]),
    ytd-mini-guide-entry-renderer[aria-label="Shorts"],
    ytd-guide-entry-renderer:has(a[href^="/shorts"]),
    ytd-guide-entry-renderer a[href^="/shorts"],
    /* Hide Shorts shelves on home feed and search results */
    ytd-rich-shelf-renderer[is-shorts],
    ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
    ytd-rich-section-renderer:has(a[href^="/shorts"]),
    ytd-reel-shelf-renderer,
    grid-shelf-view-model:has(a[href^="/shorts"]),
    ytm-shorts-lockup-view-model,
    ytm-shorts-lockup-view-model-v2,
    /* Hide YouTube Playables (Games) shelves and sidebar links */
    ytd-mini-game-card-view-model,
    yt-mini-game-card-view-model,
    ytd-game-card-renderer,
    ytd-rich-shelf-renderer:has(a[href*="/playables"]),
    ytd-rich-section-renderer:has(a[href*="/playables"]),
    ytd-rich-shelf-renderer:has(ytd-mini-game-card-view-model),
    ytd-rich-section-renderer:has(ytd-mini-game-card-view-model),
    ytd-rich-shelf-renderer:has(yt-mini-game-card-view-model),
    ytd-rich-section-renderer:has(yt-mini-game-card-view-model),
    ytd-guide-entry-renderer:has(a[href*="/playables"]),
    ytd-guide-entry-renderer:has(a[title="Playables"]),
    ytd-mini-guide-entry-renderer:has(a[href*="/playables"]) {
      display: none !important;
    }
  `,
  INSTAGRAM: `
    /* Hide Reels tab from sidebar & navigation */
    a[href*="/reels/"],
    div:has(> a[href*="/reels/"]) {
      display: none !important;
    }
  `,
  LINKEDIN: `
    /* Hide LinkedIn Video (Shorts) nav tab, carousels, and short-form video posts */
    a[href*="/video"],
    li:has(> a[href*="/video"]),
    .global-nav__primary-item:has(a[href*="/video"]),
    div[data-view-name="feed-carousel"],
    div[data-view-name="feed-full-update"]:has(video),
    .feed-shared-update-v2:has(video),
    .feed-shared-update-v2:has(.video-js),
    .feed-shared-linkedin-video {
      display: none !important;
    }
  `,
};

const STYLE_ELEMENT_ID = 'leeting-focus-mode-styles';

/**
 * Check if a URL belongs to a fully blocked site when Focus Mode is ON
 */
export function isBlockedSiteUrl(url = window.location.href) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
      return { blocked: true, platform: 'instagram' };
    }
    if (
      host === 'facebook.com' ||
      host.endsWith('.facebook.com') ||
      host === 'fb.com' ||
      host.endsWith('.fb.com')
    ) {
      return { blocked: true, platform: 'facebook' };
    }
    if (host.includes('youtube.com') && path.startsWith('/playables')) {
      return { blocked: true, platform: 'youtube-playables' };
    }
    if (host.includes('linkedin.com') && path.startsWith('/video')) {
      return { blocked: true, platform: 'linkedin-video' };
    }
    return { blocked: false };
  } catch {
    return { blocked: false };
  }
}

/**
 * Check if the current URL is a distracting short-form video URL
 */
export function isShortsUrl(url = window.location.href) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;

    if (host.includes('youtube.com') && path.toLowerCase().startsWith('/shorts/')) {
      const id = path.slice(8).split('/')[0];
      return { isShorts: true, platform: 'youtube', id };
    }
    if (
      host.includes('instagram.com') &&
      (path.toLowerCase().startsWith('/reels/') || path.toLowerCase().startsWith('/reel/'))
    ) {
      return { isShorts: true, platform: 'instagram' };
    }
    return { isShorts: false };
  } catch {
    return { isShorts: false };
  }
}

/**
 * Handle URL redirection when Focus Mode blocks sites, Playables, or Shorts
 */
export function handleShortsRedirect(
  url = window.location.href,
  redirectFn = (newUrl) => window.location.replace(newUrl),
  blockedPageUrl = null
) {
  const siteCheck = isBlockedSiteUrl(url);
  if (siteCheck.blocked) {
    const target =
      blockedPageUrl ||
      (typeof chrome !== 'undefined' && chrome.runtime?.getURL
        ? chrome.runtime.getURL('blocked.html')
        : 'https://leetcode.com/problemset/');
    redirectFn(target);
    return true;
  }

  const result = isShortsUrl(url);
  if (!result.isShorts) return false;

  if (result.platform === 'youtube' && result.id) {
    redirectFn(`https://www.youtube.com/watch?v=${result.id}`);
    return true;
  }

  if (result.platform === 'instagram') {
    redirectFn('https://www.instagram.com/');
    return true;
  }

  return false;
}

/**
 * Hide YouTube Playables / Shorts shelves matched by header text (covers dynamic view-model renderers)
 */
export function hideYouTubeDistractionShelves(doc = document) {
  if (!doc || !doc.querySelectorAll) return;

  const sections = doc.querySelectorAll('ytd-rich-section-renderer, ytd-rich-shelf-renderer');
  for (const section of sections) {
    if (section.dataset && section.dataset.leetingHidden === '1') continue;

    const titleEl = section.querySelector('#title, h2, span#title-text');
    const titleText = titleEl && titleEl.textContent ? titleEl.textContent.trim().toLowerCase() : '';
    const hasPlayablesLink = Boolean(section.querySelector('a[href*="/playables"]'));
    const hasGameCard = Boolean(
      section.querySelector('ytd-mini-game-card-view-model, yt-mini-game-card-view-model, ytd-game-card-renderer')
    );

    if (
      titleText.includes('playables') ||
      titleText === 'shorts' ||
      hasPlayablesLink ||
      hasGameCard
    ) {
      section.style.setProperty('display', 'none', 'important');
      if (section.dataset) {
        section.dataset.leetingHidden = '1';
      }
    }
  }
}

/**
 * Restore any shelves hidden inline when Focus Mode is disabled
 */
export function restoreYouTubeDistractionShelves(doc = document) {
  if (!doc || !doc.querySelectorAll) return;

  const hiddenSections = doc.querySelectorAll('[data-leeting-hidden="1"]');
  for (const section of hiddenSections) {
    section.style.removeProperty('display');
    delete section.dataset.leetingHidden;
  }
}

/**
 * Apply CSS rules to hide distraction shelves
 */
export function applyFocusStyles(doc = document) {
  if (doc.getElementById(STYLE_ELEMENT_ID)) return;

  const styleEl = doc.createElement('style');
  styleEl.id = STYLE_ELEMENT_ID;
  styleEl.textContent = `
    ${FOCUS_STYLES.YOUTUBE}
    ${FOCUS_STYLES.INSTAGRAM}
    ${FOCUS_STYLES.LINKEDIN}
  `;

  if (doc.head) {
    doc.head.appendChild(styleEl);
  } else {
    doc.documentElement.appendChild(styleEl);
  }
}

/**
 * Remove injected CSS rules when focus mode is disabled
 */
export function removeFocusStyles(doc = document) {
  const styleEl = doc.getElementById(STYLE_ELEMENT_ID);
  if (styleEl && styleEl.parentNode) {
    styleEl.parentNode.removeChild(styleEl);
  }
  restoreYouTubeDistractionShelves(doc);
}
