import React, { useMemo, useEffect, useState } from "react";
import PeopleGrid from "./PeopleGrid";
import { useSwipeStore } from "@/features/swipe";
import { useMatchStore } from "@/features/chat";
import { useAuthStore } from "@/features/auth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X } from "lucide-react";

export default function LikesPage({ onPickChat }) {
  const { likes, swipeUser, getLikes } = useSwipeStore();
  const { getMatches } = useMatchStore();
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check if user is premium
  const isPremium = useMemo(() => {
    return (
      authUser?.subscription?.isActive &&
      ["basic", "premium", "vip"].includes(authUser?.subscription?.plan)
    );
  }, [authUser]);

  // Load likes on mount only if premium
  useEffect(() => {
    if (isPremium) {
      getLikes();
    } else {
      setShowUpgradeModal(true);
    }
  }, [isPremium, getLikes]);

  // Convert likes to people format with additional metadata
  const people = useMemo(() => {
    if (!likes || !Array.isArray(likes)) return [];

    return likes
      .filter((like) => like && like.from)
      .map((like) => ({
        id: like.from._id,
        name: like.from.fullName || "Unknown",
        age: like.from.age,
        avatar: like.from.profilePic || like.from.photos?.[0],
        likedMe: true, // They liked us
        likedByMe: false, // We haven't liked them yet (they're in pending)
      }));
  }, [likes]);

  const handleLike = async (person) => {
    // Log event
    console.log("[EVENT] like_from_sidebar", {
      userId: person.id,
      userName: person.name,
    });

    // Swipe right on this person
    const result = await swipeUser(person.id, "like");

    if (result.success) {
      if (result.isMatch) {
        // Log match event
        console.log("[EVENT] match_created", {
          matchId: result.match?._id,
          userId: person.id,
          source: "sidebar",
        });

        toast.success(`🎉 You matched with ${person.name}!`);

        // Refresh matches and likes
        await getMatches();
        await getLikes();

        // Open chat with the new match
        if (onPickChat && result.match?._id) {
          onPickChat(result.match._id);
        }
      } else {
        toast.success(`Liked ${person.name}!`);
        // Refresh likes to remove from pending
        await getLikes();
      }
    }
  };

  const handleUndoLike = async (person) => {
    // This would require a backend endpoint to delete a swipe
    // For now, show a message
    toast.error("Undo like not yet implemented");
  };

  const handleOpenProfile = (person) => {
    // Log event
    console.log("[EVENT] open_profile_details", {
      userId: person.id,
      source: "sidebar",
    });

    // This would open a detailed profile view
    toast.info("Profile details view coming soon");
  };

  return (
    <div className="w-full flex flex-col gap-4 px-3 sm:px-4">
      {isPremium ? (
        <PeopleGrid
          title="People Who Liked You"
          people={people}
          onChat={(p) => onPickChat?.(p.id)}
          onLike={handleLike}
          onUndoLike={handleUndoLike}
          onOpenProfile={handleOpenProfile}
          emptyMessage="No one has liked you yet"
          emptyCTA="Go discover more people"
          onEmptyCTAClick={() => {
            // Navigate to discover view
            window.location.hash = "#discover";
          }}
        />
      ) : (
        <div className="w-full flex items-center justify-center min-h-[400px]">
          <div className="text-center p-8 bg-gradient-to-br from-[#D9776D]/10 to-[#CF5144]/10 dark:from-[#D9776D]/20 dark:to-[#CF5144]/20 rounded-2xl max-w-md">
            <Crown className="w-16 h-16 mx-auto mb-4 text-[#B33A2E] dark:text-[#D9776D]" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Premium Feature
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Upgrade to Premium to see who likes you
            </p>
            <button
              onClick={() => navigate("/subscription")}
              className="w-full bg-gradient-to-r from-[#B33A2E] to-[#CF5144] text-white font-semibold py-3 px-6 rounded-xl hover:from-[#8A2D23] hover:to-[#B33A2E] transition-all shadow-lg"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && !isPremium && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#B33A2E] to-[#CF5144] p-6 text-white relative">
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="absolute top-4 right-4 text-white/80 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <Crown className="w-12 h-12 mb-3" />
                  <h2 className="text-2xl font-bold mb-2">Premium Feature</h2>
                  <p className="text-white/90">
                    See who likes you and match instantly
                  </p>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Upgrade to Premium to unlock this feature and see everyone
                    who has liked your profile.
                  </p>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setShowUpgradeModal(false);
                        navigate("/subscription");
                      }}
                      className="w-full bg-gradient-to-r from-[#B33A2E] to-[#CF5144] text-white font-semibold py-3 px-6 rounded-xl hover:from-[#8A2D23] hover:to-[#B33A2E] transition-all shadow-lg"
                    >
                      Upgrade to Premium
                    </button>
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium py-3 px-6 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
