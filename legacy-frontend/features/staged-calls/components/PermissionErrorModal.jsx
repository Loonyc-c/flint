import { AlertCircle, Camera, Mic, RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PermissionErrorModal({ type, onExit, onRetry }) {
  const errorConfig = {
    microphone: {
      icon: Mic,
      title: "Microphone Access Denied",
      message:
        "We need access to your microphone for voice calls. Please enable it in your browser settings.",
      instructions: [
        "Click the lock icon in your browser's address bar",
        'Find "Microphone" in the permissions list',
        'Change it to "Allow"',
        "Refresh the page or click Retry below",
      ],
    },
    camera: {
      icon: Camera,
      title: "Camera Access Denied",
      message:
        "We need access to your camera for video calls. Please enable it in your browser settings.",
      instructions: [
        "Click the lock icon in your browser's address bar",
        'Find "Camera" in the permissions list',
        'Change it to "Allow"',
        "Refresh the page or click Retry below",
      ],
    },
    "no-device": {
      icon: AlertCircle,
      title: "No Device Found",
      message:
        "We couldn't find a microphone or camera. Please connect one and try again.",
      instructions: [
        "Make sure your microphone/camera is connected",
        "Check if another app is using it",
        "Try unplugging and reconnecting the device",
        "Click Retry below after connecting",
      ],
    },
    connection: {
      icon: AlertCircle,
      title: "Connection Failed",
      message:
        "We couldn't establish a connection. Please check your internet and try again.",
      instructions: [
        "Check your internet connection",
        "Disable VPN if you're using one",
        "Try switching between WiFi and mobile data",
        "Click Retry below",
      ],
    },
  };

  const config = errorConfig[type] || errorConfig["no-device"];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">{config.title}</h2>
            </div>
            <button
              onClick={onExit}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-4">
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {config.message}
            </p>

            {/* Instructions */}
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                How to fix:
              </p>
              <ol className="space-y-2">
                {config.instructions.map((instruction, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 dark:text-gray-300 flex gap-2"
                  >
                    <span className="font-semibold text-brand dark:text-[#D9776D] flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Browser-specific help */}
            <details className="text-sm">
              <summary className="cursor-pointer text-brand dark:text-[#D9776D] font-medium hover:underline">
                Browser-specific instructions
              </summary>
              <div className="mt-2 space-y-2 text-gray-600 dark:text-gray-400 pl-4">
                <p>
                  <strong>Chrome:</strong> Settings → Privacy and security →
                  Site Settings → Camera/Microphone
                </p>
                <p>
                  <strong>Firefox:</strong> Preferences → Privacy & Security →
                  Permissions
                </p>
                <p>
                  <strong>Safari:</strong> Preferences → Websites →
                  Camera/Microphone
                </p>
              </div>
            </details>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-neutral-800 flex gap-3">
            <button
              onClick={onRetry}
              className="flex-1 bg-gradient-to-r from-brand to-[#D9776D] text-white px-4 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={onExit}
              className="flex-1 bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
            >
              Exit Call
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

