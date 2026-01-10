import React, { useState } from "react";
import {
  MoreVertical,
  Volume2,
  VolumeX,
  Ban,
  Flag,
  Trash2,
  UserX,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { axiosInstance } from "@/core/lib/axios";
import { useTranslation } from "react-i18next";

const ChatSettings = ({ match, onUnmatch, onBack }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnmatchModal, setShowUnmatchModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const otherUser = match.user;

  const handleMute = async () => {
    try {
      setIsLoading(true);
      await axiosInstance.post(`/matches/${match._id}/mute`);
      toast.success("Chat muted");
      setShowMenu(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mute chat");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlock = async () => {
    try {
      setIsLoading(true);
      await axiosInstance.post(`/matches/${match._id}/block`);
      toast.success("User blocked");
      setShowMenu(false);
      onBack();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to block user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error("Please select a reason");
      return;
    }

    try {
      setIsLoading(true);
      await axiosInstance.post(`/matches/${match._id}/report`, {
        reason: reportReason,
      });
      toast.success("User reported. Thank you for keeping Flint safe.");
      setShowReportModal(false);
      setShowMenu(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to report user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await axiosInstance.delete(`/matches/${match._id}/conversation`);
      toast.success("Conversation deleted");
      setShowDeleteModal(false);
      setShowMenu(false);
      onBack();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete conversation"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnmatch = async () => {
    try {
      setIsLoading(true);
      await axiosInstance.delete(`/matches/${match._id}`);
      toast.success("Unmatched successfully");
      setShowUnmatchModal(false);
      setShowMenu(false);
      if (onUnmatch) onUnmatch();
      onBack();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unmatch");
    } finally {
      setIsLoading(false);
    }
  };

  const reportReasons = [
    "Inappropriate messages",
    "Spam or scam",
    "Fake profile",
    "Harassment",
    "Underage user",
    "Other",
  ];

  return (
    <>
      {/* Settings Button */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />

              {/* Menu */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-56 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 py-2 z-50"
              >
                <button
                  onClick={handleMute}
                  disabled={isLoading}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-left"
                >
                  {match.isMuted ? (
                    <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {match.isMuted ? "Unmute" : "Mute"} notifications
                  </span>
                </button>

                <button
                  onClick={handleBlock}
                  disabled={isLoading}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-left"
                >
                  <Ban className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t("chatSettings.block")}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowReportModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-left"
                >
                  <Flag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t("chatSettings.report")}
                  </span>
                </button>

                <div className="border-t border-gray-200 dark:border-neutral-700 my-2" />

                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-left"
                >
                  <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t("chatSettings.delete")}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowUnmatchModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                >
                  <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                    {t("chatSettings.unmatch")}
                  </span>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Report {otherUser.nickname || otherUser.fullName}
                </h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Please select a reason for reporting this user:
              </p>

              <div className="space-y-2 mb-6">
                {reportReasons.map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-3 p-3 border border-gray-200 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={reportReason === reason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-4 h-4 text-[#B33A2E] focus:ring-[#B33A2E]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {reason}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  disabled={isLoading || !reportReason}
                  className="flex-1 px-4 py-2 bg-[#B33A2E] text-white rounded-lg hover:bg-[#9a2f24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Reporting..." : "Report"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Conversation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Delete conversation?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This will delete all messages with{" "}
                {otherUser.nickname || otherUser.fullName}. You'll still be
                matched and can message again.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unmatch Modal */}
      <AnimatePresence>
        {showUnmatchModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
            onClick={() => setShowUnmatchModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Unmatch with {otherUser.nickname || otherUser.fullName}?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This will remove the match and delete all messages. This action
                cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnmatchModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnmatch}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Unmatching..." : "Unmatch"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatSettings;
