import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Crown, Check, Eye, Sparkles, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LikeLimitModal = ({ isOpen, onClose, limit = 5, used = 5 }) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate("/subscription");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-[#B33A2E] via-[#CF5144] to-[#8A2D23] p-8 text-white">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4"
                  >
                    <Heart className="w-10 h-10 fill-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">
                    Daily Like Limit Reached!
                  </h2>
                  <p className="text-white/90 text-sm">
                    You've used {used} out of {limit} free likes today
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  Upgrade to Premium to unlock unlimited likes and more amazing
                  features!
                </p>

                {/* Premium Features */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#D9776D]/20 dark:bg-[#D9776D]/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Heart className="w-4 h-4 text-[#B33A2E] dark:text-[#D9776D]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        Unlimited Likes
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Like as many profiles as you want, every day
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#D9776D]/20 dark:bg-[#D9776D]/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Eye className="w-4 h-4 text-[#B33A2E] dark:text-[#D9776D]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        See Who Likes You
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Know who's interested before you swipe
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#D9776D]/20 dark:bg-[#D9776D]/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-[#B33A2E] dark:text-[#D9776D]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        AI Wingmen
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get personalized conversation starters and tips
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#D9776D]/20 dark:bg-[#D9776D]/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Target className="w-4 h-4 text-[#B33A2E] dark:text-[#D9776D]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        Priority Matching
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get shown to more people and match faster
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleUpgrade}
                    className="w-full bg-gradient-to-r from-[#B33A2E] to-[#CF5144] text-white font-semibold py-3.5 px-6 rounded-xl hover:from-[#8A2D23] hover:to-[#B33A2E] transition-all shadow-lg shadow-[#D9776D]/30 flex items-center justify-center gap-2"
                  >
                    <Crown className="w-5 h-5" />
                    Upgrade to Premium
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>

                {/* Reset Info */}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                  Your free likes will reset in 24 hours
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LikeLimitModal;
