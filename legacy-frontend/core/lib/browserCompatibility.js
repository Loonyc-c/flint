/**
 * Browser Compatibility Utilities
 * Handles browser-specific issues, especially for Safari/iOS
 */

/**
 * Detect if the browser is Safari
 */
export const isSafari = () => {
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.indexOf("safari") !== -1 &&
    ua.indexOf("chrome") === -1 &&
    ua.indexOf("android") === -1
  );
};

/**
 * Detect if the device is iOS
 */
export const isIOS = () => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

/**
 * Detect if the device is iPad
 */
export const isIPad = () => {
  return (
    /iPad/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

/**
 * Check if WebRTC is supported
 */
export const isWebRTCSupported = () => {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.RTCPeerConnection
  );
};

/**
 * Check if the app is running on HTTPS (required for WebRTC on Safari)
 */
export const isHTTPS = () => {
  return window.location.protocol === "https:" || window.location.hostname === "localhost";
};

/**
 * Get browser compatibility info
 */
export const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browserName = "Unknown";
  let browserVersion = "Unknown";

  // Detect browser
  if (ua.indexOf("Firefox") > -1) {
    browserName = "Firefox";
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || "Unknown";
  } else if (ua.indexOf("SamsungBrowser") > -1) {
    browserName = "Samsung Internet";
    browserVersion = ua.match(/SamsungBrowser\/(\d+)/)?.[1] || "Unknown";
  } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
    browserName = "Opera";
    browserVersion = ua.match(/(?:Opera|OPR)\/(\d+)/)?.[1] || "Unknown";
  } else if (ua.indexOf("Trident") > -1) {
    browserName = "Internet Explorer";
    browserVersion = ua.match(/rv:(\d+)/)?.[1] || "Unknown";
  } else if (ua.indexOf("Edge") > -1) {
    browserName = "Edge (Legacy)";
    browserVersion = ua.match(/Edge\/(\d+)/)?.[1] || "Unknown";
  } else if (ua.indexOf("Edg") > -1) {
    browserName = "Edge (Chromium)";
    browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || "Unknown";
  } else if (ua.indexOf("Chrome") > -1) {
    browserName = "Chrome";
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || "Unknown";
  } else if (ua.indexOf("Safari") > -1) {
    browserName = "Safari";
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || "Unknown";
  }

  return {
    name: browserName,
    version: browserVersion,
    userAgent: ua,
    isSafari: isSafari(),
    isIOS: isIOS(),
    isIPad: isIPad(),
    isWebRTCSupported: isWebRTCSupported(),
    isHTTPS: isHTTPS(),
  };
};

/**
 * Check if the browser/device is compatible with the app
 */
export const checkCompatibility = () => {
  const info = getBrowserInfo();
  const issues = [];

  // Check WebRTC support
  if (!info.isWebRTCSupported) {
    issues.push({
      type: "error",
      message: "Your browser doesn't support video/voice calls. Please use a modern browser like Chrome, Firefox, or Safari.",
    });
  }

  // Check HTTPS on Safari
  if (info.isSafari && !info.isHTTPS) {
    issues.push({
      type: "error",
      message: "Safari requires HTTPS for video/voice calls. Please access the app via https://",
    });
  }

  // Warn about iOS Safari limitations
  if (info.isIOS) {
    issues.push({
      type: "warning",
      message: "On iOS, please allow camera and microphone access when prompted.",
    });
  }

  // Warn about old browsers
  if (info.name === "Internet Explorer") {
    issues.push({
      type: "error",
      message: "Internet Explorer is not supported. Please use a modern browser.",
    });
  }

  return {
    isCompatible: issues.filter((i) => i.type === "error").length === 0,
    issues,
    browserInfo: info,
  };
};

/**
 * Log browser info for debugging
 */
export const logBrowserInfo = () => {
  const info = getBrowserInfo();
  console.log("🌐 [Browser Info]", {
    browser: `${info.name} ${info.version}`,
    isSafari: info.isSafari,
    isIOS: info.isIOS,
    isIPad: info.isIPad,
    webRTCSupported: info.isWebRTCSupported,
    isHTTPS: info.isHTTPS,
  });
};

