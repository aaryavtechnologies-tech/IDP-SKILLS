/**
 * IDP Landing Page - Video Players & Instagram Reels Controller
 * Integrates with YouTube IFrame Player API
 * Implements IntersectionObserver visibility playback for all 5 continuous reels with sound.
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
  let isMainInViewport = false;
  let hasUserInteracted = false;
  let userReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // DOM Elements
  const mainVideoContainer = document.getElementById('featured-video-container');
  const mainSoundBtn = document.getElementById('main-video-sound-btn');
  const mainFallback = document.getElementById('main-video-fallback');

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
    setupAudioUnmuteInteraction();
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
            event.target.mute();
            if (!userReducedMotion && isMainInViewport) {
              tryPlayVideo(event.target);
            }
          },
          onStateChange: function (event) {
            if (event.data === YT.PlayerState.PLAYING && mainFallback) {
              mainFallback.classList.add('is-hidden');
            }
          }
        }
      });
    } catch (e) {
      console.warn('Error initializing main YouTube player:', e);
    }

    // Main sound toggle
    if (mainSoundBtn) {
      mainSoundBtn.addEventListener('click', function () {
        if (!mainPlayer || typeof mainPlayer.isMuted !== 'function') return;
        if (mainPlayer.isMuted()) {
          mainPlayer.unMute();
          mainPlayer.setVolume(85);
          mainSoundBtn.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            <span>Sound On</span>
          `;
        } else {
          mainPlayer.mute();
          mainSoundBtn.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            <span>Muted</span>
          `;
        }
      });
    }

    // Main Fallback Click
    if (mainFallback) {
      mainFallback.addEventListener('click', function () {
        if (mainPlayer && typeof mainPlayer.playVideo === 'function') {
          mainPlayer.playVideo();
          mainFallback.classList.add('is-hidden');
        }
      });
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
            mute: 1, // Start muted to satisfy browser autoplay requirements
            playsinline: 1,
            controls: 1, // Allow visitor full native YouTube volume & sound control
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            loop: 1,
            playlist: short.id
          },
          events: {
            onReady: function (event) {
              event.target.mute();
              tryPlayVideo(event.target);
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
   * First User Interaction Unmute: Unmutes sound as soon as user touches/clicks anywhere
   */
  function setupAudioUnmuteInteraction() {
    function enableAudio() {
      if (hasUserInteracted) return;
      hasUserInteracted = true;

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

  /**
   * Safe Video Play Helper
   */
  function tryPlayVideo(player) {
    if (!player || typeof player.playVideo !== 'function') return;
    try {
      const promise = player.playVideo();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(err => {
          // Handled gracefully when browser restricts unmuted playback
        });
      }
    } catch (e) {
      // Ignore sync errors
    }
  }

  function pauseVideo(player) {
    if (!player || typeof player.pauseVideo !== 'function') return;
    try {
      player.pauseVideo();
    } catch (e) {}
  }

  /**
   * Intersection Observers for Viewport Detection
   */
  function setupIntersectionObservers() {
    // 1. Observe Main Featured Video
    if (mainVideoContainer) {
      const mainObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            isMainInViewport = entry.isIntersecting && entry.intersectionRatio >= 0.25;
            if (isMainInViewport) {
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
        { threshold: [0, 0.25, 0.7] }
      );
      mainObserver.observe(mainVideoContainer);
    }

    // 2. Observe Each Reel Card individually for optimal Reels autoplay
    const reelCards = document.querySelectorAll('.reel-card, .short-card');
    if (reelCards.length > 0) {
      const reelsObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            const card = entry.target;
            const index = Array.from(reelCards).indexOf(card);
            const player = shortPlayers[index];

            if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
              card.classList.add('is-active-video');
              if (player && !userReducedMotion) {
                if (hasUserInteracted) {
                  try {
                    player.unMute();
                    player.setVolume(100);
                  } catch (_) {}
                }
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
        { threshold: [0, 0.25, 0.6] }
      );

      reelCards.forEach(card => reelsObserver.observe(card));
    }
  }

  // Kickstart
  document.addEventListener('DOMContentLoaded', () => {
    loadYouTubeIframeApi();
  });
})();
