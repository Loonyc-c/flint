import { create } from "zustand";

/**
 * Global Audio Manager Store
 * Ensures only one audio plays at a time across the entire app
 * Handles preloading for smooth playback
 */
const useAudioStore = create((set, get) => ({
  // Current playing audio
  currentAudio: null, // { id: string, url: string, element: HTMLAudioElement }
  isPlaying: false,
  currentTime: 0,
  duration: 0,

  // Preloaded audio cache
  preloadedAudio: new Map(), // Map<url, HTMLAudioElement>

  // Playback state
  playbackState: {}, // { [audioId]: { isPlaying, currentTime, duration } }

  /**
   * Play an audio file
   * Automatically pauses any currently playing audio
   */
  playAudio: (audioId, audioUrl) => {
    const { currentAudio, pauseAudio, preloadedAudio } = get();

    // Log play event
    console.log("[EVENT] audio_play", { audioId, audioUrl });

    // Pause current audio if different
    if (currentAudio && currentAudio.id !== audioId) {
      pauseAudio();
    }

    // Get or create audio element
    let audioElement = preloadedAudio.get(audioUrl);

    if (!audioElement) {
      audioElement = new Audio(audioUrl);
      audioElement.preload = "auto";

      // Add event listeners
      audioElement.addEventListener("timeupdate", () => {
        set({
          currentTime: audioElement.currentTime,
          playbackState: {
            ...get().playbackState,
            [audioId]: {
              isPlaying: !audioElement.paused,
              currentTime: audioElement.currentTime,
              duration: audioElement.duration,
            },
          },
        });
      });

      audioElement.addEventListener("loadedmetadata", () => {
        set({ duration: audioElement.duration });
      });

      audioElement.addEventListener("ended", () => {
        set({
          isPlaying: false,
          currentAudio: null,
          playbackState: {
            ...get().playbackState,
            [audioId]: {
              isPlaying: false,
              currentTime: 0,
              duration: audioElement.duration,
            },
          },
        });
      });

      audioElement.addEventListener("error", (e) => {
        console.error("Audio playback error:", e);
        set({
          isPlaying: false,
          currentAudio: null,
        });
      });

      // Cache the audio element
      const newCache = new Map(preloadedAudio);
      newCache.set(audioUrl, audioElement);
      set({ preloadedAudio: newCache });
    }

    // Play the audio
    audioElement.play().catch((error) => {
      console.error("Failed to play audio:", error);
    });

    set({
      currentAudio: { id: audioId, url: audioUrl, element: audioElement },
      isPlaying: true,
      currentTime: audioElement.currentTime,
      duration: audioElement.duration || 0,
    });
  },

  /**
   * Pause the currently playing audio
   */
  pauseAudio: () => {
    const { currentAudio } = get();
    if (currentAudio?.element) {
      // Log pause event
      console.log("[EVENT] audio_pause", { audioId: currentAudio.id });

      currentAudio.element.pause();
      set({
        isPlaying: false,
        playbackState: {
          ...get().playbackState,
          [currentAudio.id]: {
            isPlaying: false,
            currentTime: currentAudio.element.currentTime,
            duration: currentAudio.element.duration,
          },
        },
      });
    }
  },

  /**
   * Toggle play/pause for a specific audio
   */
  toggleAudio: (audioId, audioUrl) => {
    const { currentAudio, isPlaying, playAudio, pauseAudio } = get();

    if (currentAudio?.id === audioId && isPlaying) {
      pauseAudio();
    } else {
      playAudio(audioId, audioUrl);
    }
  },

  /**
   * Stop and reset current audio
   */
  stopAudio: () => {
    const { currentAudio } = get();
    if (currentAudio?.element) {
      currentAudio.element.pause();
      currentAudio.element.currentTime = 0;
    }
    set({
      currentAudio: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    });
  },

  /**
   * Seek to a specific time
   */
  seekTo: (time) => {
    const { currentAudio } = get();
    if (currentAudio?.element) {
      currentAudio.element.currentTime = time;
      set({ currentTime: time });
    }
  },

  /**
   * Preload audio files for smooth playback
   * @param {string[]} urls - Array of audio URLs to preload
   */
  preloadAudio: (urls) => {
    const { preloadedAudio } = get();
    const newCache = new Map(preloadedAudio);

    urls.forEach((url) => {
      if (!newCache.has(url)) {
        const audio = new Audio(url);
        audio.preload = "auto";
        newCache.set(url, audio);
      }
    });

    set({ preloadedAudio: newCache });
  },

  /**
   * Clear preloaded audio cache
   * Useful for memory management
   */
  clearPreloadCache: () => {
    const { preloadedAudio, currentAudio } = get();

    // Pause and clean up all audio elements except current
    preloadedAudio.forEach((audio, url) => {
      if (currentAudio?.url !== url) {
        audio.pause();
        audio.src = "";
      }
    });

    // Keep only the current audio in cache
    const newCache = new Map();
    if (currentAudio) {
      newCache.set(currentAudio.url, currentAudio.element);
    }

    set({ preloadedAudio: newCache });
  },

  /**
   * Get playback state for a specific audio
   */
  getPlaybackState: (audioId) => {
    const { playbackState, currentAudio, isPlaying } = get();

    if (currentAudio?.id === audioId) {
      return {
        isPlaying,
        currentTime: get().currentTime,
        duration: get().duration,
      };
    }

    return (
      playbackState[audioId] || {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
      }
    );
  },

  /**
   * Check if a specific audio is currently playing
   */
  isAudioPlaying: (audioId) => {
    const { currentAudio, isPlaying } = get();
    return currentAudio?.id === audioId && isPlaying;
  },

  /**
   * Cleanup - stop all audio and clear cache
   */
  cleanup: () => {
    const { preloadedAudio, stopAudio } = get();

    stopAudio();

    preloadedAudio.forEach((audio) => {
      audio.pause();
      audio.src = "";
    });

    set({
      preloadedAudio: new Map(),
      playbackState: {},
    });
  },
}));

export default useAudioStore;
