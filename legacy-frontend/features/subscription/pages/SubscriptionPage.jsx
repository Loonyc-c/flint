import { useState, useEffect } from "react";
import { axiosInstance } from "@/core/lib/axios";
import { QRCodeSVG } from "react-qr-code";
import { Check, X, Sparkles, Zap, Crown, ArrowLeft, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth";
import { useTranslation } from "react-i18next";

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState("monthly");
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState(null);

  const currentPlan = authUser?.subscription?.plan || "free";

  // Fetch prices on mount
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await axiosInstance.get("/qpay/prices");
        setPrices(res.data.prices);
      } catch (error) {
        console.error("Error fetching prices:", error);
      }
    };
    fetchPrices();
  }, []);

  const handleSubscribe = async (plan) => {
    setLoading(true);
    setSelectedPlan(plan);

    try {
      // TEMPORARY: Skip QPay and directly update subscription for testing
      const res = await axiosInstance.post("/subscription/update", {
        plan,
        duration: selectedDuration,
      });

      if (res.data.success) {
        alert(`🎉 Subscription updated to ${plan.toUpperCase()}!`);
        // Refresh user data
        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      alert("Failed to update subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startPollingPayment = (invoiceId) => {
    const interval = setInterval(async () => {
      try {
        const res = await axiosInstance.get(`/qpay/check-payment/${invoiceId}`);

        if (res.data.paid) {
          clearInterval(interval);
          alert("🎉 Subscription activated successfully!");
          navigate("/main");
        }
      } catch (error) {
        console.error("Error checking payment:", error);
      }
    }, 3000); // Check every 3 seconds

    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(interval), 600000);
  };

  const plans = [
    {
      id: "free",
      name: t("subscription.free"),
      icon: Heart,
      color: "from-gray-400 to-gray-500",
      isFree: true,
      features: [
        t("subscription.feature.5likes"),
        t("subscription.feature.basicMatching"),
        t("subscription.feature.textMessages"),
        t("subscription.feature.limitedFilters"),
      ],
    },
    {
      id: "basic",
      name: t("subscription.basic"),
      icon: Sparkles,
      color: "from-blue-500 to-blue-600",
      features: [
        t("subscription.feature.unlimitedLikes"),
        t("subscription.feature.aiWingman"),
        t("subscription.feature.voiceMessages"),
        t("subscription.feature.basicFilters"),
      ],
    },
    {
      id: "premium",
      name: t("subscription.premium"),
      icon: Zap,
      color: "from-purple-500 to-purple-600",
      popular: true,
      features: [
        t("subscription.feature.unlimitedLikes"),
        t("subscription.feature.seeWhoLikes"),
        t("subscription.feature.advancedFilters"),
        t("subscription.feature.priorityMatching"),
        t("subscription.feature.rewind"),
      ],
    },
    {
      id: "vip",
      name: t("subscription.vip"),
      icon: Crown,
      color: "from-amber-500 to-amber-600",
      features: [
        t("subscription.feature.exclusiveMatches"),
        t("subscription.feature.topPicks"),
        t("subscription.feature.concierge"),
        t("subscription.feature.verifiedBadge"),
        t("subscription.feature.priorityMatching"),
      ],
    },
  ];

  if (!prices) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B33A2E]"></div>
      </div>
    );
  }

  if (invoice) {
    return (
      <div className="h-screen overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Scan to Pay
            </h2>
            <p className="text-gray-600">
              Use your bank app to scan the QR code
            </p>
          </div>

          {/* QR Code */}
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 flex justify-center">
            <QRCodeSVG value={invoice.qrText} size={256} />
          </div>

          {/* Amount */}
          <div className="text-center mb-6">
            <p className="text-4xl font-bold text-[#B33A2E]">
              {invoice.amount.toLocaleString()}₮
            </p>
            <p className="text-gray-600 mt-2">{invoice.description}</p>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-[#B33A2E]/10 to-[#D9776D]/10 rounded-xl p-4 mb-6">
            <p className="font-semibold text-gray-800 mb-2">
              Төлбөр төлөх заавар:
            </p>
            <ol className="text-sm text-gray-700 space-y-1">
              <li>1. Банкны app нээх (Khan Bank, TDB, Golomt гэх мэт)</li>
              <li>2. QPay цэс сонгох</li>
              <li>3. QR code scan хийх</li>
              <li>4. Төлбөр баталгаажуулах</li>
            </ol>
          </div>

          {/* Loading indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#B33A2E]"></div>
            <span className="text-gray-600">Waiting for payment...</span>
          </div>

          {/* Cancel button */}
          <button
            onClick={() => {
              setInvoice(null);
              setSelectedPlan(null);
            }}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
          >
            Cancel
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800 p-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/main")}
          className="mb-8 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          {t("common.back")}
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            {t("subscription.chooseYourPlan")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t("main.journey")}
          </p>

          {/* Duration Toggle */}
          <div className="mt-8 inline-flex bg-white dark:bg-neutral-800 rounded-full p-1 shadow-md">
            <button
              onClick={() => setSelectedDuration("monthly")}
              className={`px-6 py-2 rounded-full transition-all ${
                selectedDuration === "monthly"
                  ? "bg-[#B33A2E] text-white"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              }`}
            >
              {t("subscription.monthly")}
            </button>
            <button
              onClick={() => setSelectedDuration("yearly")}
              className={`px-6 py-2 rounded-full transition-all ${
                selectedDuration === "yearly"
                  ? "bg-[#B33A2E] text-white"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              }`}
            >
              {t("subscription.yearly")}
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                {t("subscription.save17")}
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = plan.isFree ? 0 : prices[plan.id][selectedDuration];
            const isCurrentPlan = currentPlan === plan.id;

            return (
              <motion.div
                key={plan.id}
                whileHover={{ scale: 1.02 }}
                className={`relative bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8 ${
                  plan.popular ? "ring-4 ring-[#B33A2E]" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#B33A2E] text-white px-4 py-1 rounded-full text-sm font-semibold">
                      {t("subscription.premium")}
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${plan.color} mb-4`}
                >
                  <Icon className="h-8 w-8 text-white" />
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  {plan.isFree ? (
                    <span className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                      {t("subscription.free")}
                    </span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                        {price.toLocaleString()}₮
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        /{" "}
                        {selectedDuration === "monthly"
                          ? t("subscription.monthly").toLowerCase()
                          : t("subscription.yearly").toLowerCase()}
                      </span>
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Subscribe Button */}
                <button
                  onClick={() => !plan.isFree && handleSubscribe(plan.id)}
                  disabled={
                    plan.isFree
                      ? isCurrentPlan
                      : loading && selectedPlan === plan.id
                  }
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                    isCurrentPlan
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : plan.popular
                      ? "bg-[#B33A2E] hover:bg-[#8B2E24] text-white"
                      : "bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-800 dark:text-gray-100"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isCurrentPlan
                    ? t("subscription.currentPlan")
                    : loading && selectedPlan === plan.id
                    ? t("common.loading")
                    : plan.isFree
                    ? t("subscription.free")
                    : t("subscription.subscribe")}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="text-center text-gray-600 text-sm">
          <p>💳 Secure payment powered by QPay</p>
          <p className="mt-2">Cancel anytime • No hidden fees</p>
        </div>
      </div>
    </div>
  );
}
