/**
 * IDP Landing Page - Video Players & Single-Active Audio/Video Controller
 * Integrates with YouTube IFrame Player API
 * Enforces EXCLUSIVE single-video playback: ONLY ONE video/audio plays at any time.
 * Supports instant scroll autoplay for Featured Story and Testimonial Reels.
 */

(function () {
  'use strict';

  // Video Configuration
  const MAIN_VIDEO_ID = 'BuX7INWrzcg';
  const SHORTS_CONFIG = [
    { id: 'B10gWnKpgoA', elementId: 'yt-short-1', cardId: 'reel-card-0', author: 'Sarukh' },
    { id: 'kfmXz1S4IsM', elementId: 'yt-short-2', cardId: 'reel-card-1', author: 'Rahul' },
    { id: 'scMvuTBuanI', elementId: 'yt-short-3', cardId: 'reel-card-2', author: 'Pooja' },
    { id: '9rmWN-xnZAo', elementId: 'yt-short-4', cardId: 'reel-card-3', author: 'Aman' },
    { id: 'srTf_2jnwdQ', elementId: 'yt-short-5', cardId: 'reel-card-4', author: 'Kunal' }
  ];

  // State Management
  let mainPlayer = null;
  const shortPlayers = {};
  let currentActiveId = null; // 'main' or 0, 1, 2, 3, 4
  let hasUserInteracted = false;
  let userReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let scrollTicking = false;

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
    setupCardInteractions();
    setupIntersectionObservers();
    setupScrollAndFocusManager();
    setupAudioUnmuteInteraction();
    // Run initial focus check
    setTimeout(checkCurrentFocus, 200);
  }

  /**
   * Safe Video Play Helper
   */
  function tryPlay(player) {
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

      const res = player.playVideo();
      if (res && typeof res.catch === 'function') {
        res.catch(() => {
          try {
            player.mute();
            player.playVideo();
          } catch (_) {}
        });
      }
    } catch (_) {
      try {
        player.mute();
        player.playVideo();
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
   * EXCLUSIVE Single-Player Playback
   * Enforces that ONLY ONE video and audio stream plays at any moment.
   */
  function playExclusive(targetId) {
    if (userReducedMotion) return;

    if (currentActiveId === targetId && targetId !== null) {
      const activePlayer = targetId === 'main' ? mainPlayer : shortPlayers[targetId];
      if (activePlayer && typeof activePlayer.getPlayerState === 'function') {
        const state = activePlayer.getPlayerState();
        if (state !== YT.PlayerState.PLAYING && state !== YT.PlayerState.BUFFERING) {
          tryPlay(activePlayer);
        }
      }
      return;
    }

    currentActiveId = targetId;

    // 1. Pause and mute main player if it's not the target
    if (targetId !== 'main' && mainPlayer) {
      pauseVideo(mainPlayer);
      try {
        mainPlayer.mute();
      } catch (_) {}
    }

    // 2. Pause and mute all reels except the target
    SHORTS_CONFIG.forEach((short, idx) => {
      const card = document.getElementById(short.cardId);
      const player = shortPlayers[idx];

      if (targetId !== idx) {
        if (card) card.classList.remove('is-active-video');
        if (player) {
          pauseVideo(player);
          try {
            player.mute();
          } catch (_) {}
        }
      } else {
        if (card) card.classList.add('is-active-video');
      }
    });

    // 3. Play ONLY the target player
    if (targetId === 'main' && mainPlayer) {
      tryPlay(mainPlayer);
    } else if (typeof targetId === 'number' && shortPlayers[targetId]) {
      tryPlay(shortPlayers[targetId]);
    }
  }

  /**
   * Pause ALL videos when user scrolls out of video sections
   */
  function pauseAll() {
    currentActiveId = null;
    if (mainPlayer) {
      pauseVideo(mainPlayer);
      try {
        mainPlayer.mute();
      } catch (_) {}
    }
    Object.values(shortPlayers).forEach(p => {
      if (p) {
        pauseVideo(p);
        try {
          p.mute();
        } catch (_) {}
      }
    });
    document.querySelectorAll('.reel-card, .short-card').forEach(c => c.classList.remove('is-active-video'));
  }

  /**
   * Initialize Main Featured Story Player
   */
  function initMainPlayer() {
    const targetEl = document.getElementById('main-yt-iframe');
    if (!targetEl) return;

    try {
      mainPlayer = new YT.Player('main-yt-iframe', {
        events: {
          onReady: function (event) {
            mainPlayer = event.target;
            checkCurrentFocus();
            // Immediate autoplay if currently in viewport
            if (mainVideoContainer) {
              const rect = mainVideoContainer.getBoundingClientRect();
              if (rect.top < window.innerHeight && rect.bottom > 0) {
                playExclusive('main');
              }
            }
          },
          onStateChange: function (event) {
            // If visitor directly clicks play on the iframe, make it exclusive
            if (event.data === YT.PlayerState.PLAYING) {
              if (currentActiveId !== 'main') {
                hasUserInteracted = true;
                playExclusive('main');
              }
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
          events: {
            onReady: function (event) {
              shortPlayers[index] = event.target;
              checkCurrentFocus();
            },
            onStateChange: function (event) {
              // Continuous loop for active reel only
              if (event.data === YT.PlayerState.ENDED) {
                if (currentActiveId === index) {
                  event.target.playVideo();
                }
              }
              // If visitor directly clicks play on this reel, make it exclusive
              if (event.data === YT.PlayerState.PLAYING) {
                if (currentActiveId !== index) {
                  hasUserInteracted = true;
                  playExclusive(index);
                }
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
   * Card Click & Hover Focus Switching
   */
  function setupCardInteractions() {
    SHORTS_CONFIG.forEach((short, index) => {
      const card = document.getElementById(short.cardId);
      if (!card) return;

      // Click or tap switches audio & video to this reel immediately
      card.addEventListener('click', () => {
        hasUserInteracted = true;
        playExclusive(index);
      });

      // Desktop hover switches focus smoothly
      card.addEventListener('mouseenter', () => {
        if (window.innerWidth >= 992) {
          playExclusive(index);
        }
      });
    });

    if (mainVideoContainer) {
      mainVideoContainer.addEventListener('click', () => {
        hasUserInteracted = true;
        playExclusive('main');
      });
    }
  }

  /**
   * Viewport Center-Focus Algorithm:
   * Finds the ONE video closest to the center of the user's screen.
   */
  function checkCurrentFocus() {
    if (userReducedMotion) return;

    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    const windowH = window.innerHeight;

    let closestId = null;
    let minDistance = Infinity;

    // 1. Check Main Video Container
    if (mainVideoContainer) {
      const rect = mainVideoContainer.getBoundingClientRect();
      const inView = rect.top < windowH * 0.95 && rect.bottom > windowH * 0.05;
      if (inView) {
        const centerY = (rect.top + rect.bottom) / 2;
        const centerX = (rect.left + rect.right) / 2;
        const dist = Math.hypot(centerX - viewportCenterX, centerY - viewportCenterY);
        if (dist < minDistance) {
          minDistance = dist;
          closestId = 'main';
        }
      }
    }

    // 2. Check Each Reel Card
    SHORTS_CONFIG.forEach((short, index) => {
      const card = document.getElementById(short.cardId);
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const inView = rect.top < windowH * 0.95 && rect.bottom > windowH * 0.05;
      if (inView) {
        const centerY = (rect.top + rect.bottom) / 2;
        const centerX = (rect.left + rect.right) / 2;
        const dist = Math.hypot(centerX - viewportCenterX, centerY - viewportCenterY);
        if (dist < minDistance) {
          minDistance = dist;
          closestId = index;
        }
      }
    });

    // 3. Apply Exclusive Playback
    if (closestId !== null) {
      playExclusive(closestId);
    } else {
      pauseAll();
    }
  }

  /**
   * Intersection Observers for Instant Viewport Visibility
   */
  function setupIntersectionObservers() {
    if (!('IntersectionObserver' in window)) return;

    // Main featured video
    if (mainVideoContainer) {
      const mainObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              checkCurrentFocus();
            } else if (currentActiveId === 'main') {
              pauseAll();
            }
          });
        },
        { threshold: [0, 0.1, 0.25], rootMargin: '60px 0px 60px 0px' }
      );
      mainObserver.observe(mainVideoContainer);
    }

    // Reel cards
    const cards = document.querySelectorAll('.reel-card, .short-card');
    if (cards.length > 0) {
      const reelsObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              checkCurrentFocus();
            }
          });
        },
        { threshold: [0, 0.1, 0.25], rootMargin: '60px 0px 60px 0px' }
      );
      cards.forEach(c => reelsObserver.observe(c));
    }
  }

  /**
   * Scroll and Resize Focus Manager
   */
  function setupScrollAndFocusManager() {
    window.addEventListener(
      'scroll',
      () => {
        if (!scrollTicking) {
          window.requestAnimationFrame(() => {
            checkCurrentFocus();
            scrollTicking = false;
          });
          scrollTicking = true;
        }
      },
      { passive: true }
    );

    window.addEventListener('resize', checkCurrentFocus, { passive: true });
  }

  /**
   * Unmute Audio on First User Gesture (for currently active video only)
   */
  function setupAudioUnmuteInteraction() {
    function enableAudio() {
      if (hasUserInteracted) return;
      hasUserInteracted = true;

      if (currentActiveId === 'main' && mainPlayer) {
        try {
          mainPlayer.unMute();
          mainPlayer.setVolume(100);
        } catch (_) {}
      } else if (typeof currentActiveId === 'number' && shortPlayers[currentActiveId]) {
        try {
          shortPlayers[currentActiveId].unMute();
          shortPlayers[currentActiveId].setVolume(100);
        } catch (_) {}
      }

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
