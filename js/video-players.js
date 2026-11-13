/**
 * IDP Landing Page - Video Players & Continuous Scroll Autoplay Controller
 * Integrates with YouTube IFrame Player API
 * Implements reliable scroll-triggered autoplay across all browsers (Desktop & Mobile).
 */

(function () {
  'use strict';

  // Video Configuration
  const MAIN_VIDEO_ID = 'BuX7INWrzcg';
  const SHORTS_CONFIG = [
    {
      id: 'B10gWnKpgoA',
      elementId: 'yt-short-1',
      author: 'Sarukh'
    },
    {
      id: 'kfmXz1S4IsM',
      elementId: 'yt-short-2',
      author: 'Rahul'
    },
    {
      id: 'scMvuTBuanI',
      elementId: 'yt-short-3',
      author: 'Pooja'
    },
    {
      id: '9rmWN-xnZAo',
      elementId: 'yt-short-4',
      author: 'Aman'
    },
    {
      id: 'srTf_2jnwdQ',
      elementId: 'yt-short-5',
      author: 'Kunal'
    }
  ];

  // State Management
  let mainPlayer = null;
  const shortPlayers = {};
  let hasUserInteracted = false;
  let userReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // DOM Elements
  const mainVideoContainer = document.getElementById('featured-video-container');

  /**
   * Safe YouTube API Loading
   */
  function loadYouTubeIframeApi() {
    if (window.YT && window.YT.Player) {
      initPlayers();
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  // YouTube API Callback
  window.onYouTubeIframeAPIReady = function () {
    initPlayers();
  };

  /**
   * Initialize All YouTube Players
   */
  function initPlayers() {
    initMainPlayer();
    initShortPlayers();
    setupIntersectionObservers();
    setupScrollListener();
    setupAudioUnmuteInteraction();
  }

  /**
   * Helper: Check if element is currently in viewport
   */
  function isElementInViewport(el, offset = 0) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top < (windowHeight + offset) && rect.bottom > -offset;
  }

  /**
   * Safe Video Play Helper: Guarantees video starts playing
   */
  function tryPlayVideo(player) {
    if (!player || typeof player.playVideo !== 'function') return;
    try {
      if (hasUserInteracted) {
        try {
          player.unMute();
          player.setVolume(100);
        } catch (_) {}
      } else {
        try {
          player.mute();
        } catch (_) {}
      }

      const promise = player.playVideo();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {
          // If browser restricted unmuted autoplay, mute and resume immediately
          try {
            if (typeof player.mute === 'function') {
              player.mute();
              player.playVideo();
            }
          } catch (_) {}
        });
      }
    } catch (e) {
      try {
        if (typeof player.mute === 'function') {
          player.mute();
          player.playVideo();
        }
      } catch (_) {}
    }
  }

  /**
   * Safe Video Pause Helper
   */
  function pauseVideo(player) {
    if (!player || typeof player.pauseVideo !== 'function') return;
    try {
      player.pauseVideo();
    } catch (_) {}
  }

  /**
   * Initialize Main Featured Story Player
   */
  function initMainPlayer() {
    const targetEl = document.getElementById('main-yt-iframe');
    if (!targetEl) return;

    try {
      mainPlayer = new YT.Player('main-yt-iframe', {
        videoId: MAIN_VIDEO_ID,
        playerVars: {
          autoplay: 1,
          mute: 1,
          playsinline: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1
        },
        events: {
          onReady: function (event) {
            try {
              event.target.mute();
            } catch (_) {}
            if (!userReducedMotion && isElementInViewport(mainVideoContainer, 100)) {
              tryPlayVideo(event.target);
            }
          }
        }
      });
    } catch (e) {
      console.warn('Error initializing main YouTube player:', e);
    }
  }

  /**
   * Initialize Shorts (Instagram Reels-style) Players
   */
  function initShortPlayers() {
    SHORTS_CONFIG.forEach((short, index) => {
      const container = document.getElementById(short.elementId);
      if (!container) return;

      try {
        const player = new YT.Player(short.elementId, {
          videoId: short.id,
          playerVars: {
            autoplay: 1,
            mute: 1,
            playsinline: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            loop: 1,
            playlist: short.id
          },
          events: {
            onReady: function (event) {
              try {
                event.target.mute();
              } catch (_) {}
              const card = document.getElementById(`reel-card-${index}`);
              if (!userReducedMotion && card && isElementInViewport(card, 100)) {
                card.classList.add('is-active-video');
                tryPlayVideo(event.target);
              }
            },
            onStateChange: function (event) {
              // Continuous Reels Loop
              if (event.data === YT.PlayerState.ENDED) {
                event.target.playVideo();
              }
            }
          }
        });
        shortPlayers[index] = player;
      } catch (err) {
        console.warn(`Error initializing reel ${index}:`, err);
      }
    });
  }

  /**
   * Setup Intersection Observers for Smooth Scroll Autoplay
   */
  function setupIntersectionObservers() {
    // 1. Main Featured Video Observer
    if (mainVideoContainer && 'IntersectionObserver' in window) {
      const mainObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
              if (mainPlayer && !userReducedMotion) {
                tryPlayVideo(mainPlayer);
              }
            } else {
              if (mainPlayer) {
                pauseVideo(mainPlayer);
              }
            }
          });
        },
        { threshold: [0, 0.1, 0.25, 0.5], rootMargin: '60px 0px 60px 0px' }
      );
      mainObserver.observe(mainVideoContainer);
    }

    // 2. Reel Cards Observer
    const reelCards = document.querySelectorAll('.reel-card, .short-card');
    if (reelCards.length > 0 && 'IntersectionObserver' in window) {
      const reelsObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            const card = entry.target;
            const index = Array.from(reelCards).indexOf(card);
            const player = shortPlayers[index];

            if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
              card.classList.add('is-active-video');
              if (player && !userReducedMotion) {
                tryPlayVideo(player);
              }
            } else {
              card.classList.remove('is-active-video');
              if (player) {
                pauseVideo(player);
              }
            }
          });
        },
        { threshold: [0, 0.1, 0.25, 0.5], rootMargin: '60px 0px 60px 0px' }
      );

      reelCards.forEach(card => reelsObserver.observe(card));
    }
  }

  /**
   * Scroll Event Backup: Ensures autoplay activates reliably as user scrolls
   */
  function setupScrollListener() {
    let ticking = false;

    function onScrollCheck() {
      if (userReducedMotion) return;

      // Check main video
      if (mainVideoContainer && mainPlayer) {
        if (isElementInViewport(mainVideoContainer, 60)) {
          tryPlayVideo(mainPlayer);
        } else {
          pauseVideo(mainPlayer);
        }
      }

      // Check reel cards
      const reelCards = document.querySelectorAll('.reel-card, .short-card');
      reelCards.forEach((card, idx) => {
        const player = shortPlayers[idx];
        if (!player) return;

        if (isElementInViewport(card, 60)) {
          card.classList.add('is-active-video');
          tryPlayVideo(player);
        } else {
          card.classList.remove('is-active-video');
          pauseVideo(player);
        }
      });

      ticking = false;
    }

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(onScrollCheck);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  /**
   * Unmute Audio on First User Gesture
   */
  function setupAudioUnmuteInteraction() {
    function enableAudio() {
      if (hasUserInteracted) return;
      hasUserInteracted = true;

      // Unmute main video
      if (mainPlayer && typeof mainPlayer.unMute === 'function') {
        try {
          mainPlayer.unMute();
          mainPlayer.setVolume(100);
        } catch (_) {}
      }

      // Unmute active reel players
      Object.values(shortPlayers).forEach(p => {
        try {
          if (typeof p.unMute === 'function') {
            p.unMute();
            p.setVolume(100);
          }
        } catch (_) {}
      });

      window.removeEventListener('click', enableAudio, true);
      window.removeEventListener('touchstart', enableAudio, true);
      window.removeEventListener('pointerdown', enableAudio, true);
      window.removeEventListener('keydown', enableAudio, true);
    }

    window.addEventListener('click', enableAudio, { capture: true, once: true });
    window.addEventListener('touchstart', enableAudio, { capture: true, once: true });
    window.addEventListener('pointerdown', enableAudio, { capture: true, once: true });
    window.addEventListener('keydown', enableAudio, { capture: true, once: true });
  }

  // Kickstart
  document.addEventListener('DOMContentLoaded', () => {
    loadYouTubeIframeApi();
  });
})();
