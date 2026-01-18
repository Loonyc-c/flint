import { useEffect } from "react";

/**
 * Hook to handle mobile audio routing (e.g. switching to bluetooth/headset)
 */
export const useMobileAudio = () => {
  useEffect(() => {
    const handleDeviceChange = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter((d) => d.kind === "audiooutput");

        // Prefer Bluetooth or Wired Headset
        const headset = audioOutputs.find(
          (d) =>
            d.label.toLowerCase().includes("bluetooth") ||
            d.label.toLowerCase().includes("headset") ||
            d.label.toLowerCase().includes("wired"),
        );

        // Note: Agora SDK handles output routing internally via its playback devices,
        // but explicit selection can help on some mobile browsers if supported.
        if (headset) {
          console.warn("[MobileAudio] Headset detected:", headset.label);
        }
      } catch (e) {
        console.warn("[MobileAudio] Failed to enumerate devices", e);
      }
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    handleDeviceChange(); // Check on mount

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange,
      );
    };
  }, []);
};
