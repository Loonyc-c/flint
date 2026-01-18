import { useEffect, type MutableRefObject } from "react";
import { AgoraClient } from "../lib/agora-client";
import { forceStopHardware } from "../lib/agora/hardware";

export const useAgoraLifecycle = (
  clientRef: MutableRefObject<AgoraClient | null>,
  isMounted: MutableRefObject<boolean>,
) => {
  useEffect(() => {
    isMounted.current = true;
    clientRef.current = new AgoraClient();

    return () => {
      // Set unmounted immediately to abort pending operations
      isMounted.current = false;
      const client = clientRef.current;
      if (client) {
        // Force cleanup regardless of state
        client
          .leave()
          .catch((err) => console.error("[useAgora] Cleanup error:", err));
        client.destroy();
        // Safety net: Force stop ALL hardware tracks
        forceStopHardware().catch((err) =>
          console.error("[useAgora] Force stop error:", err),
        );
      }
      clientRef.current = null;
    };
  }, [clientRef, isMounted]);
};
