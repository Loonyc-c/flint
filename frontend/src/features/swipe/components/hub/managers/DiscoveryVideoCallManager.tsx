"use client";

import { IncomingCallModal, VideoCallModal } from "@/features/video";
import { type ChatConversation, type StagedCallRingingPayload } from "@shared/types";

interface DiscoveryVideoCallManagerProps {
  incomingCall: StagedCallRingingPayload | null;
  incomingCallMatch: ChatConversation | undefined;
  videoCallChannel: string | null;
  videoCallMatchId: string | null;
  isVideoCallOpen: boolean;
  activeConversation: ChatConversation | undefined;
  handleAcceptCall: () => void;
  handleDeclineCall: () => void;
  handleEndVideoCall: () => void;
}

export const DiscoveryVideoCallManager = ({
  incomingCall,
  incomingCallMatch,
  videoCallChannel,
  videoCallMatchId,
  isVideoCallOpen,
  activeConversation,
  handleAcceptCall,
  handleDeclineCall,
  handleEndVideoCall,
}: DiscoveryVideoCallManagerProps) => {
  return (
    <>
      <IncomingCallModal
        isOpen={!!incomingCall}
        callerName={
          incomingCall?.callerName ||
          incomingCallMatch?.otherUser.name ||
          "Someone"
        }
        callerAvatar={incomingCallMatch?.otherUser.avatar}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />

      {videoCallChannel && videoCallMatchId && (
        <VideoCallModal
          isOpen={isVideoCallOpen}
          channelName={videoCallChannel}
          localUserName="You"
          remoteUserName={activeConversation?.otherUser.name || "Partner"}
          onClose={handleEndVideoCall}
          onCallEnded={handleEndVideoCall}
        />
      )}
    </>
  );
};
