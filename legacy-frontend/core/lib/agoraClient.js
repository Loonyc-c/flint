import AgoraRTC from "agora-rtc-sdk-ng";

/**
 * Agora RTC Client for Voice and Video Calls
 * Handles all WebRTC functionality for 3-stage dating
 */

class AgoraClient {
  constructor() {
    this.client = null;
    this.localAudioTrack = null;
    this.localVideoTrack = null;
    this.remoteUsers = {};
    this.isJoined = false;
    this.isJoining = false; // Lock to prevent concurrent join attempts
    this.joinPromise = null; // Store the current join promise
  }

  /**
   * Initialize Agora client
   */
  async init() {
    if (this.client) {
      console.warn("Agora client already initialized");
      return;
    }

    this.client = AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8",
    });

    // Set up event listeners
    this.setupEventListeners();

    console.log("✅ Agora client initialized");
  }

  /**
   * Set up event listeners for remote users
   */
  setupEventListeners() {
    if (!this.client) return;

    // User joined channel
    this.client.on("user-joined", (user) => {
      console.log("👤 [AgoraClient] User joined channel:", user.uid);
      this.remoteUsers[user.uid] = user;
      this.onUserJoined?.(user.uid);
    });

    // User published (started sharing audio/video)
    this.client.on("user-published", async (user, mediaType) => {
      console.log("👤 [AgoraClient] User published:", user.uid, mediaType);

      try {
        // Subscribe to the remote user
        await this.client.subscribe(user, mediaType);
        console.log(
          "✅ [AgoraClient] Subscribed to user:",
          user.uid,
          mediaType
        );

        // Store remote user
        this.remoteUsers[user.uid] = user;

        // Play remote audio
        if (mediaType === "audio") {
          const remoteAudioTrack = user.audioTrack;
          if (remoteAudioTrack) {
            remoteAudioTrack.play();
            console.log(
              "🔊 [AgoraClient] Playing remote audio from user:",
              user.uid
            );
          } else {
            console.warn(
              "⚠️ [AgoraClient] No audio track found for user:",
              user.uid
            );
          }
        }

        // Play remote video
        if (mediaType === "video") {
          const remoteVideoTrack = user.videoTrack;
          if (remoteVideoTrack) {
            console.log(
              "📹 [AgoraClient] Remote video track received from user:",
              user.uid
            );
            // Video will be played in the component using remoteVideoTrack.play(elementId)
            this.onRemoteVideoAdded?.(user.uid, remoteVideoTrack);
          } else {
            console.warn(
              "⚠️ [AgoraClient] No video track found for user:",
              user.uid
            );
          }
        }
      } catch (error) {
        console.error(
          "❌ [AgoraClient] Error subscribing to user:",
          user.uid,
          error
        );
      }
    });

    // User unpublished (stopped sharing)
    this.client.on("user-unpublished", (user, mediaType) => {
      console.log("👤 User unpublished:", user.uid, mediaType);

      if (mediaType === "video") {
        this.onRemoteVideoRemoved?.(user.uid);
      }
    });

    // User left
    this.client.on("user-left", (user) => {
      console.log("👋 User left:", user.uid);
      delete this.remoteUsers[user.uid];
      this.onUserLeft?.(user.uid);
    });
  }

  /**
   * Join a channel (voice or video call)
   * @param {string} appId - Agora App ID
   * @param {string} channel - Channel name
   * @param {string} token - Agora token
   * @param {number} uid - User ID
   * @param {boolean} enableVideo - Enable video (false for voice-only)
   */
  async join(appId, channel, token, uid, enableVideo = false) {
    // Prevent concurrent join attempts - return existing promise if joining
    if (this.isJoining) {
      console.log("⚠️ [AgoraClient] Join already in progress, waiting for it to complete...");
      if (this.joinPromise) {
        return this.joinPromise;
      }
      return { success: false, message: "Join already in progress" };
    }

    // If already joined to the same channel, just return success
    if (this.isJoined && this.client?.connectionState === "CONNECTED") {
      console.log("✅ [AgoraClient] Already connected to channel");
      return { success: true, message: "Already connected" };
    }

    this.isJoining = true;

    this.joinPromise = (async () => {
      try {
        console.log("🔍 [AgoraClient] Joining channel:", {
          appId: appId?.substring(0, 8) + "...",
          appIdFull: appId, // Log full App ID for debugging
          channel,
          token: token?.substring(0, 20) + "...", // Log partial token
          uid,
          enableVideo,
        });

        // Leave any existing connection first
        if (this.isJoined || this.client?.connectionState === "CONNECTING" || this.client?.connectionState === "CONNECTED") {
          console.log("⚠️ [AgoraClient] Already connected/connecting, leaving first...");
          await this.leave();
          // Wait a bit for cleanup to complete
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Create new client
        if (!this.client) {
          await this.init();
        }

        // Join the channel
        console.log("🔍 [AgoraClient] Calling client.join...");
        await this.client.join(appId, channel, token, uid);
        this.isJoined = true;
        console.log("✅ [AgoraClient] Joined channel:", channel);

      // Create and publish local audio track
      console.log("🎤 [AgoraClient] Creating microphone audio track...");
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      console.log("✅ [AgoraClient] Microphone audio track created");

      await this.client.publish([this.localAudioTrack]);
      console.log("✅ [AgoraClient] Published audio track");

      // Create and publish local video track if enabled
      if (enableVideo) {
        try {
          console.log("📹 [AgoraClient] Creating camera video track...");
          this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
          console.log("✅ [AgoraClient] Camera video track created");

          await this.client.publish([this.localVideoTrack]);
          console.log("✅ [AgoraClient] Published video track");
        } catch (videoError) {
          console.warn("⚠️ [AgoraClient] Could not create video track:", videoError.message);
          console.warn("⚠️ [AgoraClient] Continuing with audio only...");
          // Continue without video - audio is already published
          this.localVideoTrack = null;
        }
      }

      console.log("🎉 [AgoraClient] Successfully joined and published tracks");

      // Check if there are already remote users in the channel
      const remoteUsers = this.client.remoteUsers;
      console.log(
        `👥 [AgoraClient] Remote users already in channel: ${remoteUsers.length}`
      );

      if (remoteUsers.length > 0) {
        remoteUsers.forEach((user) => {
          console.log(
            `👤 [AgoraClient] Found existing remote user: ${user.uid}`
          );
          this.remoteUsers[user.uid] = user;
          this.onUserJoined?.(user.uid);

          // Check if they have video published
          if (user.hasVideo) {
            console.log(
              `📹 [AgoraClient] Remote user ${user.uid} has video published`
            );
          }

          // Check if they have audio published
          if (user.hasAudio) {
            console.log(
              `🔊 [AgoraClient] Remote user ${user.uid} has audio published`
            );
          }
        });
      }

        return {
          success: true,
          localAudioTrack: this.localAudioTrack,
          localVideoTrack: this.localVideoTrack,
        };
      } catch (error) {
        console.error("❌ [AgoraClient] Error joining channel:", error);
        console.error("❌ [AgoraClient] Error details:", {
          name: error.name,
          code: error.code,
          message: error.message,
          stack: error.stack,
        });
        throw error;
      } finally {
        this.isJoining = false;
        this.joinPromise = null;
      }
    })();

    return this.joinPromise;
  }

  /**
   * Leave the channel and clean up
   */
  async leave() {
    try {
      console.log("🧹 [AgoraClient] Starting cleanup...");

      // Stop and close local audio track FIRST (to stop voice immediately)
      if (this.localAudioTrack) {
        console.log("🔇 [AgoraClient] Stopping local audio track...");
        try {
          this.localAudioTrack.stop();
          this.localAudioTrack.close();
          console.log("✅ [AgoraClient] Local audio track stopped");
        } catch (err) {
          console.error("❌ [AgoraClient] Error stopping audio track:", err);
        }
        this.localAudioTrack = null;
      }

      // Stop and close local video track
      if (this.localVideoTrack) {
        console.log("📹 [AgoraClient] Stopping local video track...");
        try {
          this.localVideoTrack.stop();
          this.localVideoTrack.close();
          console.log("✅ [AgoraClient] Local video track stopped");
        } catch (err) {
          console.error("❌ [AgoraClient] Error stopping video track:", err);
        }
        this.localVideoTrack = null;
      }

      // Stop all remote tracks
      console.log("🔇 [AgoraClient] Stopping remote tracks...");
      Object.values(this.remoteUsers).forEach((user) => {
        if (user.audioTrack) {
          try {
            user.audioTrack.stop();
            console.log(
              `✅ [AgoraClient] Stopped remote audio for user ${user.uid}`
            );
          } catch (err) {
            console.error(`❌ [AgoraClient] Error stopping remote audio:`, err);
          }
        }
        if (user.videoTrack) {
          try {
            user.videoTrack.stop();
            console.log(
              `✅ [AgoraClient] Stopped remote video for user ${user.uid}`
            );
          } catch (err) {
            console.error(`❌ [AgoraClient] Error stopping remote video:`, err);
          }
        }
      });

      // Leave the channel
      if (this.client && this.isJoined) {
        console.log("🚪 [AgoraClient] Leaving channel...");
        await this.client.leave();
        this.isJoined = false;
        console.log("✅ [AgoraClient] Left channel");
      }

      // Clear remote users
      this.remoteUsers = {};

      // Reset joining state
      this.isJoining = false;
      this.joinPromise = null;

      // Destroy client for clean state
      this.client = null;

      console.log("✅ [AgoraClient] Cleanup complete");
    } catch (error) {
      console.error("❌ [AgoraClient] Error leaving channel:", error);
      // Reset state even on error
      this.isJoining = false;
      this.joinPromise = null;
      // Don't throw - we want cleanup to complete even if there are errors
    }
  }

  /**
   * Toggle microphone on/off
   */
  async toggleMicrophone() {
    if (!this.localAudioTrack) return false;

    const enabled = this.localAudioTrack.enabled;
    await this.localAudioTrack.setEnabled(!enabled);
    console.log(`🎤 Microphone ${!enabled ? "enabled" : "disabled"}`);
    return !enabled;
  }

  /**
   * Toggle camera on/off
   */
  async toggleCamera() {
    if (!this.localVideoTrack) return false;

    const enabled = this.localVideoTrack.enabled;
    await this.localVideoTrack.setEnabled(!enabled);
    console.log(`📹 Camera ${!enabled ? "enabled" : "disabled"}`);
    return !enabled;
  }

  /**
   * Enable video (upgrade from voice to video call)
   */
  async enableVideo() {
    try {
      if (this.localVideoTrack) {
        console.warn("Video already enabled");
        return this.localVideoTrack;
      }

      // Create and publish video track
      this.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
      await this.client.publish([this.localVideoTrack]);
      console.log("✅ Video enabled");

      return this.localVideoTrack;
    } catch (error) {
      console.error("❌ Error enabling video:", error);
      throw error;
    }
  }

  /**
   * Disable video (downgrade to voice-only)
   */
  async disableVideo() {
    try {
      if (!this.localVideoTrack) {
        console.warn("Video already disabled");
        return;
      }

      // Unpublish and close video track
      await this.client.unpublish([this.localVideoTrack]);
      this.localVideoTrack.stop();
      this.localVideoTrack.close();
      this.localVideoTrack = null;
      console.log("✅ Video disabled");
    } catch (error) {
      console.error("❌ Error disabling video:", error);
      throw error;
    }
  }

  /**
   * Get local video track for rendering
   */
  getLocalVideoTrack() {
    return this.localVideoTrack;
  }

  /**
   * Get remote users
   */
  getRemoteUsers() {
    return Object.values(this.remoteUsers);
  }

  /**
   * Clean up and destroy client
   */
  destroy() {
    this.leave();
    this.client = null;
    this.onRemoteVideoAdded = null;
    this.onRemoteVideoRemoved = null;
    this.onUserLeft = null;
  }
}

// Export singleton instance
export const agoraClient = new AgoraClient();

// Export class for creating multiple instances if needed
export default AgoraClient;
