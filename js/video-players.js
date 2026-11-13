/**
 * IDP Landing Page - Video Players & Intelligent Autoplay Controller
 * Integrates with YouTube IFrame Player API
 * Implements IntersectionObserver visibility playback, smart carousel tracking,
 * and accessible mute/unmute toggles.
 */

(function () {
  'use strict';

  // Video Configuration
  const MAIN_VIDEO_ID = 'BuX7INWrzcg';
  const SHORTS_CONFIG = [
    {
      id: 'B10gWnKpgoA',
      elementId: 'yt-short-1',
      author: 'Sarukh',
      highlight: 'From Zero to Success Journey',
      quote: '"Guidance and 1-on-1 mentorship made all the difference."'
    },
    {
      id: 'kfmXz1S4IsM',
      elementId: 'yt-short-2',
      author: 'Rahul',
      highlight: 'Business Owner · Scaling Leads',
      quote: '"Learned organic client acquisition without spending on ads."'
    },
    {
      id: 'scMvuTBuanI',
      elementId: 'yt-short-3',
      author: 'Pooja',
      highlight: 'Homemaker · Financial Independence',
      quote: '"Managed just 2 hours daily from home with steady results."'
    },
    {
      id: '9rmWN-xnZAo',
      elementId: 'yt-short-4',
      author: 'Aman',
      highlight: 'College Student · Consistent Earnings',
      quote: '"Transformed my phone time into practical digital skills."'
    },
    {
      id: 'srTf_2jnwdQ',
      elementId: 'yt-short-5',
      author: 'Kunal',
      highlight: '3-Month Growth Transformation',
      quote: '"The step-by-step roadmap gave me clear direction."'
    }
  ];

  // State Management
  let mainPlayer = null;
  const shortPlayers = {};
  let activeShortIndex = -1;
  let isMainInViewport = false;
  let isCarouselInViewport = false;
  let userReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // DOM Elements
  const mainVideoContainer = document.getElementById('featured-video-container');
  const mainSoundBtn = document.getElementById('main-video-sound-btn');
  const mainFallback = document.getElementById('main-video-fallback');
  const carouselTrack = document.getElementById('shorts-track');
  const prevBtn = document.getElementById('carousel-prev-btn');
  const nextBtn = document.getElementById('carousel-next-btn');
  const markersContainer = document.getElementById('carousel-markers');
  const carouselStatus = document.getElementById('carousel-live-status');

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
    setupCarouselNavigation();
    setupIntersectionObservers();
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
          mainPlayer.setVolume(80);
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
   * Initialize Shorts Players
   */
  function initShortPlayers() {
    SHORTS_CONFIG.forEach((short, index) => {
      const container = document.getElementById(short.elementId);
      if (!container) return;

      try {
        const player = new YT.Player(short.elementId, {
          videoId: short.id,
          playerVars: {
            autoplay: 0,
            mute: 1,
            playsinline: 1,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            loop: 1,
            playlist: short.id
          },
          events: {
            onReady: function (event) {
              event.target.mute();
            },
            onStateChange: function (event) {
              if (event.data === YT.PlayerState.PLAYING) {
                const poster = document.getElementById(`short-poster-${index}`);
                if (poster) poster.classList.add('is-hidden');
              }
            }
          }
        });
        shortPlayers[index] = player;
      } catch (err) {
        console.warn(`Error initializing short ${index}:`, err);
      }

      // Poster click fallback
      const poster = document.getElementById(`short-poster-${index}`);
      if (poster) {
        poster.addEventListener('click', function () {
          activateShort(index, true);
        });
      }

      // Sound button per short
      const muteBtn = document.getElementById(`short-mute-${index}`);
      if (muteBtn) {
        muteBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          const p = shortPlayers[index];
          if (!p || typeof p.isMuted !== 'function') return;

          if (p.isMuted()) {
            p.unMute();
            p.setVolume(85);
            muteBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
            muteBtn.setAttribute('aria-label', 'Mute video');
          } else {
            p.mute();
            muteBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
            muteBtn.setAttribute('aria-label', 'Unmute video');
          }
        });
      }
    });
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
          console.warn('Autoplay prevented:', err);
        });
      }
    } catch (e) {
      console.warn('Play error:', e);
    }
  }

  function pauseVideo(player) {
    if (!player || typeof player.pauseVideo !== 'function') return;
    try {
      player.pauseVideo();
    } catch (e) {}
  }

  /**
   * Set Active Short Video
   */
  function activateShort(index, forcePlay = false) {
    if (index < 0 || index >= SHORTS_CONFIG.length) return;

    // Pause previously active short
    if (activeShortIndex !== -1 && activeShortIndex !== index) {
      const prevPlayer = shortPlayers[activeShortIndex];
      if (prevPlayer) pauseVideo(prevPlayer);

      const prevCard = document.getElementById(`short-card-${activeShortIndex}`);
      if (prevCard) prevCard.classList.remove('is-active-video');
    }

    activeShortIndex = index;
    const currentCard = document.getElementById(`short-card-${index}`);
    if (currentCard) currentCard.classList.add('is-active-video');

    updateMarkers(index);

    // Announce to screen reader
    if (carouselStatus) {
      carouselStatus.textContent = `Slide ${index + 1} of ${SHORTS_CONFIG.length}: ${SHORTS_CONFIG[index].author} testimonial`;
    }

    // Play active short muted only if carousel is in view
    if (isCarouselInViewport || forcePlay) {
      const currentPlayer = shortPlayers[index];
      if (currentPlayer && !userReducedMotion) {
        currentPlayer.mute(); // Enforce muted autoplay
        tryPlayVideo(currentPlayer);
      }
    }
  }

  function pauseAllShorts() {
    Object.values(shortPlayers).forEach(p => pauseVideo(p));
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

    // 2. Observe Carousel Section Visibility
    const carouselSection = document.getElementById('testimonials');
    if (carouselSection) {
      const carouselObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            isCarouselInViewport = entry.isIntersecting && entry.intersectionRatio >= 0.2;
            if (isCarouselInViewport) {
              const nearest = getNearestSlideIndex();
              activateShort(nearest);
            } else {
              pauseAllShorts();
            }
          });
        },
        { threshold: [0, 0.2, 0.6] }
      );
      carouselObserver.observe(carouselSection);
    }
  }

  /**
   * Determine Which Slide Is Closest to Center of Carousel Track
   */
  function getNearestSlideIndex() {
    if (!carouselTrack) return 0;
    const trackRect = carouselTrack.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;

    const cards = carouselTrack.querySelectorAll('.short-card');
    let closestIndex = 0;
    let minDistance = Infinity;

    cards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(trackCenter - cardCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  /**
   * Setup Carousel Navigation, Scroll Snapping, & Dots
   */
  function setupCarouselNavigation() {
    if (!carouselTrack) return;

    // Create marker dots
    if (markersContainer) {
      markersContainer.innerHTML = '';
      SHORTS_CONFIG.forEach((short, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-marker-dot';
        dot.setAttribute('aria-label', `Go to slide ${i + 1}: ${short.author}`);
        dot.setAttribute('aria-current', i === 0 ? 'true' : 'false');
        dot.addEventListener('click', () => {
          scrollToSlide(i);
        });
        markersContainer.appendChild(dot);
      });
    }

    // Arrow navigation
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const currentIndex = getNearestSlideIndex();
        const target = Math.max(0, currentIndex - 1);
        scrollToSlide(target);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const currentIndex = getNearestSlideIndex();
        const target = Math.min(SHORTS_CONFIG.length - 1, currentIndex + 1);
        scrollToSlide(target);
      });
    }

    // Scroll listener with debounce for settled scroll
    let scrollTimeout = null;
    carouselTrack.addEventListener(
      'scroll',
      () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const nearest = getNearestSlideIndex();
          if (nearest !== activeShortIndex && isCarouselInViewport) {
            activateShort(nearest);
          }
        }, 120);
      },
      { passive: true }
    );
  }

  function scrollToSlide(index) {
    const card = document.getElementById(`short-card-${index}`);
    if (!card || !carouselTrack) return;

    const trackRect = carouselTrack.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const scrollOffset = cardRect.left - trackRect.left + carouselTrack.scrollLeft - (trackRect.width / 2 - cardRect.width / 2);

    carouselTrack.scrollTo({
      left: scrollOffset,
      behavior: userReducedMotion ? 'auto' : 'smooth'
    });

    activateShort(index);
  }

  function updateMarkers(activeIndex) {
    if (!markersContainer) return;
    const dots = markersContainer.querySelectorAll('.carousel-marker-dot');
    dots.forEach((dot, idx) => {
      dot.setAttribute('aria-current', idx === activeIndex ? 'true' : 'false');
    });

    // Update arrow disabled states
    if (prevBtn) prevBtn.disabled = activeIndex === 0;
    if (nextBtn) nextBtn.disabled = activeIndex === SHORTS_CONFIG.length - 1;
  }

  // Kickstart
  document.addEventListener('DOMContentLoaded', () => {
    loadYouTubeIframeApi();
  });
})();
