import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
} from "agora-rtc-sdk-ng";
import type {
  AgoraJoinOptions,
  AgoraJoinResult,
  AgoraEventHandlers,
} from "./types";
import { createAudioTrackWithRetry, createVideoTrackWithRetry } from "./tracks";
import { subscribeToExistingUser } from "./events";

export async function performJoin(
  client: IAgoraRTCClient,
  options: AgoraJoinOptions,
  eventHandlers: AgoraEventHandlers,
  remoteUsers: Map<number, IAgoraRTCRemoteUser>,
): Promise<AgoraJoinResult> {
  const { appId, channel, token, uid, enableVideo = false } = options;
  let localAudioTrack: IMicrophoneAudioTrack | null = null;
  let localVideoTrack: ICameraVideoTrack | null = null;

  try {
    await client.join(appId, channel, token, uid);

    // Check for Mock Hardware Mode
    const isMockMode = process.env.NEXT_PUBLIC_MOCK_HARDWARE === "true";

    if (isMockMode) {
      console.warn(
        "[Agora] ⚠️ Mock Hardware Mode: Skipping track creation and publishing",
      );
    } else {
      try {
        localAudioTrack = await createAudioTrackWithRetry();
        await client.publish([localAudioTrack]);
      } catch (_audioError) {
        // In production/real mode, this is a critical error
        throw new Error("Microphone access failed. Please check permissions.");
      }

      if (enableVideo) {
        try {
          localVideoTrack = await createVideoTrackWithRetry();
          await client.publish([localVideoTrack]);
        } catch (_videoError) {
          localVideoTrack = null;
        }
      }
    }

    client.remoteUsers.forEach((user) => {
      remoteUsers.set(user.uid as number, user);
      eventHandlers.onUserJoined?.(user.uid as number);
      if (user.hasAudio || user.hasVideo) {
        subscribeToExistingUser(client, user, eventHandlers);
      }
    });

    return {
      success: true,
      localAudioTrack: localAudioTrack ?? undefined,
      localVideoTrack: localVideoTrack ?? undefined,
    };
  } catch (error) {
    // Caller should handle cleanup if join fails
    throw error;
  }
}

export async function performLeave(
  client: IAgoraRTCClient | null,
  localAudioTrack: IMicrophoneAudioTrack | null,
  localVideoTrack: ICameraVideoTrack | null,
  remoteUsers: Map<number, IAgoraRTCRemoteUser>,
): Promise<void> {
  try {
    const tracksToUnpublish = [localAudioTrack, localVideoTrack].filter(
      Boolean,
    ) as (IMicrophoneAudioTrack | ICameraVideoTrack)[];

    if (
      tracksToUnpublish.length > 0 &&
      client &&
      client.connectionState === "CONNECTED"
    ) {
      try {
        await client.unpublish(tracksToUnpublish);
      } catch (_err) {}
    }

    localAudioTrack?.stop();
    localAudioTrack?.close();

    localVideoTrack?.stop();
    localVideoTrack?.close();

    remoteUsers.forEach((user) => {
      user.audioTrack?.stop();
      user.videoTrack?.stop();
    });

    if (client && client.connectionState === "CONNECTED") {
      await client.leave();
    }

    remoteUsers.clear();
    await new Promise((resolve) => setTimeout(resolve, 300));
  } catch (error) {
    console.error("Error during leave:", error);
  }
}
