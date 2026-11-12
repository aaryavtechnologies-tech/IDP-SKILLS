/**
 * IDP Affiliate System Landing Page Scripts
 * Initializes YouTube IFrame Player API on all 6 embeds for reliable muted autoplay
 * alongside lightweight scroll reveal animations.
 */
(function () {
  "use strict";

  const iframes = Array.from(document.querySelectorAll(".yt-autoplay-iframe"));
  const players = new Map();
  const hasPlayedOnce = new WeakSet();
  const userPaused = new WeakSet();
  const visibleFrames = new WeakSet();
  let playersInitialized = false;

  const sendRawCommand = (iframe, func) => {
    if (!iframe || !iframe.contentWindow) return;
    try {
      iframe.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func,
          args: []
        }),
        "*"
      );
    } catch (_) {
      // Ignore cross-origin postMessage failures before frame initialization.
    }
  };

  const playMuted = (iframe) => {
    const player = players.get(iframe);
    if (player && typeof player.mute === "function" && typeof player.playVideo === "function") {
      try {
        player.mute();
        player.playVideo();
        return;
      } catch (_) {
        // Fall back to direct postMessage below.
      }
    }
    sendRawCommand(iframe, "mute");
    sendRawCommand(iframe, "playVideo");
  };

  const initYouTubePlayers = () => {
    if (playersInitialized || !window.YT || typeof window.YT.Player !== "function") {
      return;
    }
    playersInitialized = true;

    iframes.forEach((iframe) => {
      if (!iframe.id) return;

      const player = new window.YT.Player(iframe.id, {
        events: {
          onReady: (event) => {
            players.set(iframe, event.target);
            event.target.mute();
            event.target.playVideo();
          },
          onStateChange: (event) => {
            const YTState = window.YT.PlayerState;
            if (!YTState) return;

            if (event.data === YTState.PLAYING) {
              hasPlayedOnce.add(iframe);
              userPaused.delete(iframe);
            } else if (event.data === YTState.PAUSED) {
              if (hasPlayedOnce.has(iframe) && visibleFrames.has(iframe)) {
                userPaused.add(iframe);
              }
            } else if (event.data === YTState.ENDED) {
              event.target.playVideo();
            }
          }
        }
      });

      players.set(iframe, player);
    });
  };

  // Register official YouTube IFrame API callback before loading the API script
  const previousReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (typeof previousReady === "function") {
      previousReady();
    }
    initYouTubePlayers();
  };

  if (window.YT && typeof window.YT.Player === "function") {
    initYouTubePlayers();
  } else if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
  }

  // 1. Subtle Scroll Fade-In Animations
  const revealItems = document.querySelectorAll(".reveal:not(.is-visible)");

  if ("IntersectionObserver" in window && revealItems.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -20px 0px"
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  // 2. "Watch My Story" Button -> Smooth Scroll + Highlight & Play Main Presentation
  const watchStoryBtn = document.getElementById("watch-story-btn");
  const presentationSection = document.getElementById("video-presentation");
  const presentationCard = document.querySelector(".presentation-card");
  const mainVideo = document.getElementById("yt-player-main");

  if (watchStoryBtn && presentationSection) {
    watchStoryBtn.addEventListener("click", (event) => {
      event.preventDefault();
      presentationSection.scrollIntoView({ behavior: "smooth", block: "center" });

      if (presentationCard) {
        presentationCard.classList.add("is-highlighted");
        window.setTimeout(() => {
          presentationCard.classList.remove("is-highlighted");
        }, 1800);
      }

      if (mainVideo) {
        userPaused.delete(mainVideo);
        playMuted(mainVideo);
      }
    });
  }

  // 3. Resume muted autoplay whenever a video scrolls into view (unless user paused it)
  if ("IntersectionObserver" in window && iframes.length > 0) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const iframe = entry.target;
          if (entry.isIntersecting) {
            visibleFrames.add(iframe);
            if (!userPaused.has(iframe)) {
              const player = players.get(iframe);
              const state =
                player && typeof player.getPlayerState === "function"
                  ? player.getPlayerState()
                  : null;
              if (state !== 1 && state !== 3) {
                playMuted(iframe);
              }
            }
          } else {
            visibleFrames.delete(iframe);
          }
        });
      },
      { threshold: 0.25 }
    );

    iframes.forEach((iframe) => videoObserver.observe(iframe));
  }
})();
