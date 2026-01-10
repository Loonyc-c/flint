import HeaderStage from "@/features/staged-calls/components/HeaderStage";
import Logo from "@/assets/logo.svg";
import {
  Instagram,
  Facebook,
  Phone,
  Check,
  MessageCircle,
  Send,
  Twitter,
  Linkedin,
  Mail,
  Home,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { axiosInstance } from "@/core/lib/axios";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { agoraClient } from "@/core/lib/agoraClient";

export default function ThirdStage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { otherUser, call } = location.state || {};
  const [isCompleting, setIsCompleting] = useState(false);

  // Get contact info from otherUser
  const contactInfo = otherUser?.contactInfo || {};

  // Cleanup Agora on mount (SecondStage skips cleanup when navigating here)
  useEffect(() => {
    const cleanupAgora = async () => {
      try {
        console.log("🧹 [ThirdStage] Cleaning up Agora connection");
        await agoraClient.leave();
        console.log("✅ [ThirdStage] Agora cleanup complete");
      } catch (err) {
        // Ignore errors if already disconnected
        console.log(
          "ℹ️ [ThirdStage] Agora already disconnected or error:",
          err.message
        );
      }
    };

    // Delay cleanup to ensure both users have navigated
    setTimeout(() => {
      cleanupAgora();
    }, 1000);
  }, []);

  const handleReturnHome = async () => {
    if (isCompleting) return;

    setIsCompleting(true);

    try {
      // Call backend to mark Stage 3 as completed
      if (call?._id) {
        await axiosInstance.post("/staged-call/complete-stage3", {
          callId: call._id,
        });
        toast.success("Date completed! 🎉");
      }
    } catch (error) {
      console.error("Error completing Stage 3:", error);
      // Don't block navigation even if API fails
    } finally {
      setIsCompleting(false);
      navigate("/main");
    }
  };

  // Define contact methods with their icons and colors
  const contactMethods = [
    {
      key: "phone",
      value: contactInfo.phone,
      Icon: Phone,
      title: "Phone",
      iconBg: "bg-green-50",
      iconColor: "#14A44D",
      hint: "Call or text anytime",
    },
    {
      key: "instagram",
      value: contactInfo.instagram,
      Icon: Instagram,
      title: "Instagram",
      iconBg: "bg-pink-50",
      iconColor: "#E4405F",
      hint: "Follow for updates",
    },
    {
      key: "telegram",
      value: contactInfo.telegram,
      Icon: Send,
      title: "Telegram",
      iconBg: "bg-blue-50",
      iconColor: "#0088cc",
      hint: "Message on Telegram",
    },
    {
      key: "snapchat",
      value: contactInfo.snapchat,
      Icon: MessageCircle,
      title: "Snapchat",
      iconBg: "bg-yellow-50",
      iconColor: "#FFFC00",
      hint: "Add on Snapchat",
    },
    {
      key: "whatsapp",
      value: contactInfo.whatsapp,
      Icon: MessageCircle,
      title: "WhatsApp",
      iconBg: "bg-green-50",
      iconColor: "#25D366",
      hint: "Chat on WhatsApp",
    },
    {
      key: "wechat",
      value: contactInfo.wechat,
      Icon: MessageCircle,
      title: "WeChat",
      iconBg: "bg-green-50",
      iconColor: "#09B83E",
      hint: "Connect on WeChat",
    },
    {
      key: "facebook",
      value: contactInfo.facebook,
      Icon: Facebook,
      title: "Facebook",
      iconBg: "bg-blue-50",
      iconColor: "#1877F2",
      hint: "Connect on Facebook",
    },
    {
      key: "twitter",
      value: contactInfo.twitter,
      Icon: Twitter,
      title: "Twitter/X",
      iconBg: "bg-gray-50",
      iconColor: "#000000",
      hint: "Follow on Twitter",
    },
    {
      key: "linkedin",
      value: contactInfo.linkedin,
      Icon: Linkedin,
      title: "LinkedIn",
      iconBg: "bg-blue-50",
      iconColor: "#0A66C2",
      hint: "Connect on LinkedIn",
    },
    {
      key: "other",
      value: contactInfo.other,
      Icon: Mail,
      title: "Other Contact",
      iconBg: "bg-gray-50",
      iconColor: "#6B7280",
      hint: "Additional contact info",
    },
  ];

  // Filter to only show contact methods that have values
  const availableContacts = contactMethods.filter(
    (method) => method.value && method.value.trim() !== ""
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-neutral-100 to-neutral-200 overflow-hidden">
      <HeaderStage name={"3"} />

      <div className="w-full flex items-center justify-center px-3 sm:px-4 lg:px-6 py-4">
        <section
          className="
            w-full
            max-w-sm              /* smaller base */
            sm:max-w-md
            md:max-w-lg
            lg:max-w-[520px]
            xl:max-w-[540px]
            2xl:max-w-[560px]
            rounded-3xl shadow-2xl ring-1 ring-black/5 overflow-hidden bg-white/60
          "
        >
          <div className="w-full bg-gradient-to-b from-[#C55B4D] to-[#B14E42] px-5 sm:px-6 py-6 sm:py-7 flex flex-col items-center gap-2">
            <div className="grid place-items-center">
              <div className="col-start-1 row-start-1 rounded-full ring-3 ring-white p-1 bg-white">
                <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full overflow-hidden border-3 border-white">
                  <img
                    src={otherUser?.profilePic || Logo}
                    alt="Profile"
                    className="h-full w-full object-cover bg-white"
                  />
                </div>
              </div>

              <div className="col-start-1 row-start-1 self-start justify-self-end h-6 w-6 rounded-full bg-[#B14E42] text-white ring-2 ring-white flex items-center justify-center">
                <Check className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-0.5">
              <h2 className="text-white text-sm sm:text-base md:text-lg font-semibold">
                {otherUser?.fullName || otherUser?.nickname || "User"}
              </h2>
              <p className="text-white/90 text-[11px] sm:text-xs">
                Ready to connect!
              </p>
            </div>
          </div>

          <div className="bg-white px-4 sm:px-5 md:px-6 py-5 sm:py-6 flex flex-col gap-3.5 sm:gap-4">
            {availableContacts.length > 0 ? (
              availableContacts.map((contact) => (
                <ContactRow
                  key={contact.key}
                  iconBg={contact.iconBg}
                  iconColor={contact.iconColor}
                  Icon={contact.Icon}
                  title={contact.title}
                  handle={contact.value}
                  hint={contact.hint}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No contact information available</p>
                <p className="text-xs mt-1">
                  {otherUser?.fullName || "This user"} hasn't added contact info
                  yet
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3.5 pt-1.5">
              <button
                type="button"
                onClick={handleReturnHome}
                disabled={isCompleting}
                className="w-full rounded-xl py-3.5 text-white font-semibold bg-gradient-to-b from-[#B34A3D] to-[#A74236] hover:from-[#A33930] hover:to-[#963329] shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Home className="h-5 w-5" />
                {isCompleting ? "Finishing..." : "Back to Home"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ContactRow({ Icon, iconBg, iconColor, title, handle, hint }) {
  return (
    <div className="w-full rounded-2xl border border-gray-200 p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4">
      <div
        className={[
          "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center ring-1 ring-gray-200",
          iconBg,
        ].join(" ")}
      >
        <Icon style={{ color: iconColor }} className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-[13px] sm:text-sm md:text-base font-semibold text-gray-900">
          {title}
        </span>
        <span className="text-xs sm:text-[13px] text-gray-800">{handle}</span>
        <span className="text-[10px] sm:text-xs text-gray-400">{hint}</span>
      </div>
    </div>
  );
}
