import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isShortsUrl,
  isBlockedSiteUrl,
  handleShortsRedirect,
  applyFocusStyles,
  removeFocusStyles,
  hideYouTubeDistractionShelves,
} from '../src/content/focus.js';

describe('isBlockedSiteUrl', () => {
  it('blocks entire Instagram domain', () => {
    expect(isBlockedSiteUrl('https://www.instagram.com/')).toEqual({ blocked: true, platform: 'instagram' });
    expect(isBlockedSiteUrl('https://instagram.com/reels/xyz/')).toEqual({ blocked: true, platform: 'instagram' });
  });

  it('blocks entire Facebook and fb.com domains', () => {
    expect(isBlockedSiteUrl('https://www.facebook.com/')).toEqual({ blocked: true, platform: 'facebook' });
    expect(isBlockedSiteUrl('https://m.facebook.com/watch/')).toEqual({ blocked: true, platform: 'facebook' });
    expect(isBlockedSiteUrl('https://fb.com/')).toEqual({ blocked: true, platform: 'facebook' });
  });

  it('blocks YouTube Playables URLs', () => {
    expect(isBlockedSiteUrl('https://www.youtube.com/playables')).toEqual({
      blocked: true,
      platform: 'youtube-playables',
    });
  });

  it('blocks LinkedIn Video/Shorts feed URLs but allows normal LinkedIn pages', () => {
    expect(isBlockedSiteUrl('https://www.linkedin.com/video/')).toEqual({
      blocked: true,
      platform: 'linkedin-video',
    });
    expect(isBlockedSiteUrl('https://www.linkedin.com/feed/')).toEqual({ blocked: false });
  });

  it('allows normal YouTube watch pages', () => {
    expect(isBlockedSiteUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({ blocked: false });
  });
});

describe('isShortsUrl', () => {
  it('detects YouTube shorts URLs and extracts video id', () => {
    const result = isShortsUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ');
    expect(result.isShorts).toBe(true);
    expect(result.platform).toBe('youtube');
    expect(result.id).toBe('dQw4w9WgXcQ');
  });

  it('ignores standard YouTube watch URLs', () => {
    const result = isShortsUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result.isShorts).toBe(false);
  });
});

describe('handleShortsRedirect', () => {
  it('redirects YouTube shorts to normal player without reel scrolling', () => {
    const redirectMock = vi.fn();
    const handled = handleShortsRedirect('https://www.youtube.com/shorts/dQw4w9WgXcQ', redirectMock);
    expect(handled).toBe(true);
    expect(redirectMock).toHaveBeenCalledWith('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('redirects Instagram, Facebook, and LinkedIn Video to blocked page', () => {
    const redirectMock = vi.fn();
    expect(
      handleShortsRedirect('https://www.instagram.com/reels/xyz/', redirectMock, 'chrome-extension://id/blocked.html')
    ).toBe(true);
    expect(redirectMock).toHaveBeenCalledWith('chrome-extension://id/blocked.html');

    redirectMock.mockClear();
    expect(
      handleShortsRedirect('https://www.facebook.com/', redirectMock, 'chrome-extension://id/blocked.html')
    ).toBe(true);
    expect(redirectMock).toHaveBeenCalledWith('chrome-extension://id/blocked.html');

    redirectMock.mockClear();
    expect(
      handleShortsRedirect('https://www.linkedin.com/video/', redirectMock, 'chrome-extension://id/blocked.html')
    ).toBe(true);
    expect(redirectMock).toHaveBeenCalledWith('chrome-extension://id/blocked.html');
  });
});

describe('hideYouTubeDistractionShelves', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('hides YouTube Playables shelves and restores them when Focus Mode turns off', () => {
    document.body.innerHTML = `
      <ytd-rich-section-renderer id="playables-section">
        <ytd-rich-shelf-renderer>
          <span id="title">YouTube Playables</span>
        </ytd-rich-shelf-renderer>
      </ytd-rich-section-renderer>
      <ytd-rich-section-renderer id="normal-section">
        <ytd-rich-shelf-renderer>
          <span id="title">Recommended Videos</span>
        </ytd-rich-shelf-renderer>
      </ytd-rich-section-renderer>
    `;

    hideYouTubeDistractionShelves(document);
    const playables = document.getElementById('playables-section');
    const normal = document.getElementById('normal-section');

    expect(playables.style.display).toBe('none');
    expect(playables.dataset.leetingHidden).toBe('1');
    expect(normal.style.display).toBe('');

    removeFocusStyles(document);
    expect(playables.style.display).toBe('');
    expect(playables.dataset.leetingHidden).toBeUndefined();
  });
});

describe('applyFocusStyles & removeFocusStyles', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('injects focus styles including Playables, Shorts, and LinkedIn Video selectors', () => {
    applyFocusStyles(document);
    const style = document.getElementById('leeting-focus-mode-styles');
    expect(style).toBeDefined();
    expect(style.textContent).toContain('ytd-rich-shelf-renderer[is-shorts]');
    expect(style.textContent).toContain('ytd-mini-game-card-view-model');
    expect(style.textContent).toContain('a[href*="/playables"]');
    expect(style.textContent).toContain('a[href*="/video"]');
    expect(style.textContent).toContain('display: none !important');
  });

  it('does not insert duplicate style elements', () => {
    applyFocusStyles(document);
    applyFocusStyles(document);
    const styles = document.querySelectorAll('#leeting-focus-mode-styles');
    expect(styles.length).toBe(1);
  });

  it('removes style element on disable', () => {
    applyFocusStyles(document);
    expect(document.getElementById('leeting-focus-mode-styles')).not.toBeNull();
    removeFocusStyles(document);
    expect(document.getElementById('leeting-focus-mode-styles')).toBeNull();
  });
});
