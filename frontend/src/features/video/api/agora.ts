import { apiRequest } from "@/lib/api-client";

export interface AgoraTokenResponse {
  token: string;
  channelName: string;
  uid: number;
  appId: string;
  expiresAt: number;
}

export const fetchAgoraToken = async (
  channelName: string,
): Promise<AgoraTokenResponse> => {
  return apiRequest<AgoraTokenResponse>("/agora/token", {
    method: "POST",
    body: JSON.stringify({ channelName }),
  });
};
