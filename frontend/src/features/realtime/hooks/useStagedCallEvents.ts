import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import type {
  StagedCallRingingPayload,
  StagePromptPayload,
  ContactInfoDisplay,
} from "@shared/types";
import type {
  StagedCallStatus,
  UseStagedCallOptions,
  IncomingStagedCall,
  IcebreakerPayload,
  UseStagedCallReturn,
} from "../types/staged-call";
import { useStagedCallHandlers } from "./useStagedCallHandlers";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import type { StartCallParams } from "@/features/call-system/context/CallSystemContext";

interface UseStagedCallEventsProps {
  socket: Socket | null;
  user: { id: string } | null;
  busyStates: Record<string, string>;
  options: UseStagedCallOptions;
  startTimer: (duration: number) => void;
  cleanupCall: () => void;
  // State Setters
  setIncomingCall: Dispatch<SetStateAction<IncomingStagedCall | null>>;
  setCallStatus: Dispatch<SetStateAction<StagedCallStatus>>;
  setCurrentCall: Dispatch<SetStateAction<UseStagedCallReturn["currentCall"]>>;
  setStagePrompt: Dispatch<SetStateAction<StagePromptPayload | null>>;
  setPartnerContact: Dispatch<SetStateAction<ContactInfoDisplay | null>>;
  setIcebreaker: Dispatch<SetStateAction<IcebreakerPayload | null>>;
  // Refs
  callStatusRef: MutableRefObject<StagedCallStatus>;
  joiningRef: MutableRefObject<boolean>;
  // Call System
  setCalling: (params: StartCallParams) => void;
  setIncoming: (params: StartCallParams) => void;
  closeCall: () => void;
  isCallActive: boolean;
}

export const useStagedCallEvents = (props: UseStagedCallEventsProps) => {
  const { socket } = props;
  const {
    handleRinging,
    handleConnected,
    handleDeclined,
    handleEnded,
    handleWaiting,
    handlePrompt,
    handlePromptResult,
    handleContactExchange,
    handleIcebreaker,
    handleReset,
  } = useStagedCallHandlers(props);

  useEffect(() => {
    if (!socket) return;

    // Wrapper to handle the BUSY return case
    const onRinging = (data: StagedCallRingingPayload) => {
      const result = handleRinging(data);
      if (result === "BUSY") {
        socket.emit("staged-call-decline", { matchId: data.matchId });
      }
    };

    socket.on("request-call", onRinging);
    socket.on("staged-call-waiting", handleWaiting);
    socket.on("call-started", handleConnected);
    socket.on("staged-call-declined", handleDeclined);
    socket.on("staged-call-ended", handleEnded);
    socket.on("staged-call-timeout", handleReset);
    socket.on("staged-call-missed", handleReset);
    socket.on("staged-call-cancelled", handleReset);
    socket.on("stage-prompt", handlePrompt);
    socket.on("stage-prompt-result", handlePromptResult);
    socket.on("contact-exchange", handleContactExchange);
    socket.on("staged-call-icebreaker", handleIcebreaker);

    return () => {
      socket.off("request-call", onRinging);
      socket.off("staged-call-waiting", handleWaiting);
      socket.off("call-started", handleConnected);
      socket.off("staged-call-declined", handleDeclined);
      socket.off("staged-call-ended", handleEnded);
      socket.off("staged-call-timeout", handleReset);
      socket.off("staged-call-missed", handleReset);
      socket.off("staged-call-cancelled", handleReset);
      socket.off("stage-prompt", handlePrompt);
      socket.off("stage-prompt-result", handlePromptResult);
      socket.off("contact-exchange", handleContactExchange);
      socket.off("staged-call-icebreaker", handleIcebreaker);
    };
  }, [
    socket,
    handleRinging,
    handleConnected,
    handleDeclined,
    handleEnded,
    handleWaiting,
    handlePrompt,
    handlePromptResult,
    handleContactExchange,
    handleIcebreaker,
    handleReset,
  ]);
};
