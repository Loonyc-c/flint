// Offline sync utilities
import { getMessageQueue, removeFromMessageQueue } from "./indexedDB";
import { axiosInstance } from "./axios";

let isOnline = navigator.onLine;
let syncInProgress = false;

// Online/offline event listeners
export const initOfflineSync = (messageStore) => {
  window.addEventListener("online", () => {
    console.log("🟢 Back online - syncing queued messages");
    isOnline = true;
    syncQueuedMessages(messageStore);
  });

  window.addEventListener("offline", () => {
    console.log("🔴 Offline mode activated");
    isOnline = false;
  });

  // Initial sync if online
  if (isOnline) {
    syncQueuedMessages(messageStore);
  }
};

// Sync queued messages when back online
export const syncQueuedMessages = async (messageStore) => {
  if (syncInProgress || !isOnline) return;

  syncInProgress = true;

  try {
    const queue = await getMessageQueue();

    if (queue.length === 0) {
      syncInProgress = false;
      return;
    }

    console.log(`📤 Syncing ${queue.length} queued messages...`);

    for (const queuedMessage of queue) {
      try {
        // Prepare message data
        const messageData = {
          matchId: queuedMessage.matchId,
          localId: queuedMessage.localId,
        };

        if (queuedMessage.messageType === "voice") {
          messageData.messageType = "voice";
          messageData.voiceUrl = queuedMessage.voiceUrl;
          messageData.voiceDuration = queuedMessage.voiceDuration;
        } else {
          messageData.text = queuedMessage.text;
        }

        // Send to server
        const response = await axiosInstance.post("/messages", messageData);

        // Update local message with server response
        if (messageStore && messageStore.updateLocalMessage) {
          messageStore.updateLocalMessage(
            queuedMessage.matchId,
            queuedMessage.localId,
            response.data
          );
        }

        // Remove from queue
        await removeFromMessageQueue(queuedMessage.localId);

        console.log(`✅ Synced message: ${queuedMessage.localId}`);
      } catch (error) {
        console.error(
          `❌ Failed to sync message ${queuedMessage.localId}:`,
          error
        );
        // Keep in queue for next sync attempt
      }
    }

    console.log("✅ Message sync complete");
  } catch (error) {
    console.error("❌ Error during message sync:", error);
  } finally {
    syncInProgress = false;
  }
};

// Check if currently online
export const checkOnlineStatus = () => {
  return isOnline;
};

// Preload audio files for offline playback
export const preloadAudio = async (urls) => {
  const promises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return { url, blob, success: true };
    } catch (error) {
      console.error(`Failed to preload audio: ${url}`, error);
      return { url, blob: null, success: false };
    }
  });

  return Promise.all(promises);
};

// Create blob URL from cached audio
export const createAudioBlobUrl = (blob) => {
  return URL.createObjectURL(blob);
};

// Revoke blob URL to free memory
export const revokeAudioBlobUrl = (blobUrl) => {
  URL.revokeObjectURL(blobUrl);
};

// Generate unique local ID for offline messages
export const generateLocalId = () => {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Check if message is still pending (offline)
export const isMessagePending = (message) => {
  return message.status === "pending" || message.localId?.startsWith("local_");
};

// Retry failed sync
export const retrySync = (messageStore) => {
  if (isOnline) {
    syncQueuedMessages(messageStore);
  }
};

