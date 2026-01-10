import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Bookmark, Users, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Features
import { EnhancedSwipeView } from "@/features/swipe";
import {
  EnhancedChatView,
  useMatchStore,
  useMessageStore,
} from "@/features/chat";
import { useSwipeStore } from "@/features/swipe";
import { useAuthStore } from "@/features/auth";

// Core
import { initDB } from "@/core/lib/indexedDB";

const OfflineDating = () => {
  const [activeView, setActiveView] = useState("swipe"); // swipe, matches, saved, chat
  const [selectedMatch, setSelectedMatch] = useState(null);

  const { matches, getMatches } = useMatchStore();
  const { savedProfiles, getSavedProfiles } = useSwipeStore();
  const { initSync } = useMessageStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    // Initialize IndexedDB and offline sync
    initDB().then(() => {
      console.log("✅ IndexedDB initialized");
    });

    initSync();
    getMatches();
    getSavedProfiles();
  }, [initSync, getMatches, getSavedProfiles]);

  const handleOpenChat = (match) => {
    // Format match data for EnhancedChatView
    const otherUser = match.users?.find((u) => u._id !== authUser?.id);
    const formattedMatch = {
      _id: match._id,
      user: otherUser || match.user, // Support both formats
      lastMessageAt: match.lastMessageAt,
      unreadCount: match.unreadCount?.get?.(authUser?.id) || 0,
      currentTurn: match.currentTurn, // For turn-based chat
    };
    setSelectedMatch(formattedMatch);
    setActiveView("chat");
  };

  const handleBackFromChat = () => {
    setActiveView("matches");
    setSelectedMatch(null);
  };

  if (activeView === "chat" && selectedMatch) {
    return (
      <EnhancedChatView match={selectedMatch} onBack={handleBackFromChat} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-inset-bottom">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-around">
            <NavButton
              icon={Sparkles}
              label="Discover"
              active={activeView === "swipe"}
              onClick={() => setActiveView("swipe")}
            />
            <NavButton
              icon={Heart}
              label="Matches"
              active={activeView === "matches"}
              onClick={() => setActiveView("matches")}
              badge={matches.filter((m) => m.unreadCount > 0).length}
            />
            <NavButton
              icon={Bookmark}
              label="Saved"
              active={activeView === "saved"}
              onClick={() => setActiveView("saved")}
              badge={savedProfiles.length}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-20">
        <AnimatePresence mode="wait">
          {activeView === "swipe" && (
            <motion.div
              key="swipe"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <EnhancedSwipeView />
            </motion.div>
          )}

          {activeView === "matches" && (
            <motion.div
              key="matches"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-6">
                  Your Matches
                </h1>

                {matches.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                      <Heart className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        No matches yet
                      </h3>
                      <p className="text-sm text-gray-600">
                        Keep swiping to find your perfect match!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matches.map((match) => {
                      const otherUser = match.users?.find(
                        (u) => u._id !== authUser?.id
                      );
                      const unreadCount =
                        match.unreadCount?.get?.(authUser?.id) || 0;

                      return (
                        <motion.button
                          key={match._id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleOpenChat(match)}
                          className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
                        >
                          <img
                            src={otherUser?.profilePic || "/default-avatar.png"}
                            alt={otherUser?.fullName || "User"}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div className="flex-1 text-left">
                            <h3 className="font-semibold text-gray-900">
                              {otherUser?.fullName || "Unknown"}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {match.lastMessageAt
                                ? "Tap to continue chatting"
                                : "Start a conversation"}
                            </p>
                          </div>
                          {unreadCount > 0 && (
                            <div className="w-6 h-6 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {unreadCount}
                              </span>
                            </div>
                          )}
                          <MessageCircle className="w-5 h-5 text-gray-400" />
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeView === "saved" && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-6">
                  Saved Profiles
                </h1>

                {savedProfiles.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto">
                      <Bookmark className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        No saved profiles
                      </h3>
                      <p className="text-sm text-gray-600">
                        Swipe up on profiles you want to save for later
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {savedProfiles.map((profile) => (
                      <motion.div
                        key={profile._id}
                        whileHover={{ scale: 1.05 }}
                        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                      >
                        <img
                          src={profile.profilePic || "/default-avatar.png"}
                          alt={profile.fullName}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-3">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {profile.fullName}
                          </h3>
                          {profile.age && (
                            <p className="text-sm text-gray-600">
                              {profile.age} years old
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const NavButton = ({ icon: Icon, label, active, onClick, badge }) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
        active ? "text-rose-600" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      <div className="relative">
        <Icon className={`w-6 h-6 ${active ? "fill-rose-100" : ""}`} />
        {badge > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{badge}</span>
          </div>
        )}
      </div>
      <span className={`text-xs font-medium ${active ? "font-semibold" : ""}`}>
        {label}
      </span>
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-rose-600 rounded-full"
        />
      )}
    </button>
  );
};

export default OfflineDating;
