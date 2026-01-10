import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      "common.loading": "Loading...",
      "common.error": "Error",
      "common.success": "Success",
      "common.cancel": "Cancel",
      "common.save": "Save",
      "common.delete": "Delete",
      "common.edit": "Edit",
      "common.close": "Close",
      "common.back": "Back",
      "common.next": "Next",
      "common.submit": "Submit",
      "common.close": "Close",

      // Chat
      "chat.messages": "Messages",
      "chat.settings": "Settings",
      "chat.matches": "Matches",
      "chat.likes": "Likes",
      "chat.yourTurn": "Your turn",
      "chat.theirTurn": "Their turn",
      "chat.typeMessage": "Type a message…",
      "chat.send": "Send",
      "chat.call": "Call",
      "chat.activeNow": "Active now",
      "chat.newChat": "New chat",
      "chat.seen": "Seen",
      "chat.sent": "Sent",

      // Chat Settings
      "chatSettings.mute": "Mute chat",
      "chatSettings.block": "Block user",
      "chatSettings.report": "Report user",
      "chatSettings.delete": "Delete conversation",
      "chatSettings.unmatch": "Unmatch",

      // Notifications
      "notification.yourTurn": "💬 Now it's your turn to text!",
      "notification.theirTurn": "⏳ Now it's {{name}}'s turn to text",

      // Theme
      "theme.dark": "Dark",
      "theme.light": "Light",

      // Language
      "language.english": "English",
      "language.mongolian": "Mongolian",

      // Swipe
      "swipe.smash": "Smash",
      "swipe.pass": "Pass",
      "swipe.super": "Super",
      "swipe.dailyLimit": "Daily limit reached",
      "swipe.upgrade": "Upgrade to continue",
      "swipe.discover": "Discover",
      "swipe.profilesRemaining": "{{count}} profiles remaining",
      "swipe.swipeToExplore": "Swipe to explore",
      "swipe.undo": "Undo",
      "swipe.itsAMatch": "It's a Match!",
      "swipe.youAndMatched": "You and {{name}} liked each other",
      "swipe.startChatting": "Start Chatting",
      "swipe.noMoreProfiles": "No more profiles",
      "swipe.checkBackLater": "Check back later for new matches",

      // Profile
      "profile.settings": "Profile Settings",
      "profile.edit": "Edit Profile",
      "profile.preferences": "Matching Preferences",
      "profile.subscription": "Subscription",
      "profile.range": "Range",
      "profile.age": "Age",
      "profile.interestedIn": "Interested in",
      "profile.female": "Female",
      "profile.male": "Male",
      "profile.all": "All",
      "profile.maximumDistance": "Maximum Distance",
      "profile.distance": "Distance",
      "profile.showPeopleWithin":
        "Show me people within {{distance}} km from my location",

      // Subscription
      "subscription.free": "Free",
      "subscription.basic": "Basic",
      "subscription.premium": "Premium",
      "subscription.vip": "VIP",
      "subscription.subscribe": "Subscribe",
      "subscription.upgrade": "Upgrade",

      // Main Page
      "main.chooseMatchingStyle": "Choose Your Matching Style",
      "main.liveCall": "Live Call",
      "main.liveCallDesc":
        "Connect instantly with someone through our matching algorithm",
      "main.startCall": "Start Call",
      "main.joining": "Joining...",
      "main.swipe": "Swipe",
      "main.swipeDesc": "Browse profiles and match with people you like",
      "main.startSwiping": "Start Swiping",
      "main.journey":
        "Start your journey through our 3-stage matching process. Connect with someone new in just one click.",
      "main.readyToFind": "Ready",
      "main.to": "to",
      "main.find": "find",
      "main.your": "your",
      "main.spark": "Spark?",

      // Tabs
      "tabs.findMatch": "Find Match",
      "tabs.matchingPreferences": "Matching Preferences",
      "tabs.subscription": "Subscription",

      // AI Wingman
      "wingman.ready": "AI Wingman Ready",
      "wingman.readyDesc":
        "Choose your AI wingman personality before each stage! Questions will automatically appear based on your selection.",
      "wingman.aiMike": "AI Mike",
      "wingman.funnyGuy": "The Funny Guy",
      "wingman.mikeDesc":
        "Helps create hilarious conversations and breaks the ice with clever jokes and fun questions.",
      "wingman.aiLila": "AI Lila",
      "wingman.spicyOne": "The Spicy One",
      "wingman.lilaDesc":
        "Creates flirty, playful conversations for those who want to add some heat to the chat.",
      "wingman.aiEmma": "AI Emma",
      "wingman.deepThinker": "The Deep Thinker",
      "wingman.emmaDesc":
        "Generates meaningful questions that help you connect on a deeper emotional level.",

      // Empty States
      "empty.noMoreProfiles": "No more profiles",
      "empty.checkBackLater":
        "Check back later for new matches, or adjust your preferences to see more people.",
      "empty.adjustPreferences": "Adjust Preferences",

      // Subscription Features
      "subscription.chooseYourPlan": "Choose Your Plan",
      "subscription.monthly": "Monthly",
      "subscription.yearly": "Yearly",
      "subscription.save17": "Save 17%",
      "subscription.currentPlan": "Current Plan",
      "subscription.feature.5likes": "5 likes per day",
      "subscription.feature.basicMatching": "Basic matching",
      "subscription.feature.textMessages": "Text messages",
      "subscription.feature.limitedFilters": "Limited filters",
      "subscription.feature.unlimitedLikes": "Unlimited likes",
      "subscription.feature.aiWingman": "AI Wingman",
      "subscription.feature.voiceMessages": "Voice messages",
      "subscription.feature.basicFilters": "Basic filters",
      "subscription.feature.priorityMatching": "Priority matching",
      "subscription.feature.advancedFilters": "Advanced filters",
      "subscription.feature.seeWhoLikes": "See who likes you",
      "subscription.feature.rewind": "Rewind feature",
      "subscription.feature.topPicks": "Top picks daily",
      "subscription.feature.exclusiveMatches": "Exclusive matches",
      "subscription.feature.concierge": "Concierge service",
      "subscription.feature.verifiedBadge": "Verified badge",
    },
  },
  mn: {
    translation: {
      // Common
      "common.loading": "Ачааллаж байна...",
      "common.error": "Алдаа",
      "common.success": "Амжилттай",
      "common.cancel": "Цуцлах",
      "common.save": "Хадгалах",
      "common.delete": "Устгах",
      "common.edit": "Засах",
      "common.back": "Буцах",
      "common.next": "Дараах",
      "common.submit": "Илгээх",
      "common.close": "Хаах",

      // Chat
      "chat.messages": "Мессеж",
      "chat.settings": "Тохиргоо",
      "chat.matches": "Таарсан",
      "chat.likes": "Таалагдсан",
      "chat.yourTurn": "Таны ээлж",
      "chat.theirTurn": "Түүний ээлж",
      "chat.typeMessage": "Мессеж бичих…",
      "chat.send": "Илгээх",
      "chat.call": "Залгах",
      "chat.activeNow": "Идэвхтэй",
      "chat.newChat": "Шинэ чат",
      "chat.seen": "Үзсэн",
      "chat.sent": "Илгээсэн",

      // Chat Settings
      "chatSettings.mute": "Дуугүй болгох",
      "chatSettings.block": "Блоклох",
      "chatSettings.report": "Мэдээлэх",
      "chatSettings.delete": "Чат устгах",
      "chatSettings.unmatch": "Таарлыг цуцлах",

      // Notifications
      "notification.yourTurn": "💬 Одоо таны ээлж байна!",
      "notification.theirTurn": "⏳ Одоо {{name}}-ийн ээлж байна",

      // Theme
      "theme.dark": "Харанхуй",
      "theme.light": "Гэрэл",

      // Language
      "language.english": "Англи",
      "language.mongolian": "Монгол",

      // Swipe
      "swipe.smash": "Таалагдсан",
      "swipe.pass": "Алгасах",
      "swipe.super": "Супер",
      "swipe.dailyLimit": "Өдрийн хязгаар дууссан",
      "swipe.upgrade": "Үргэлжлүүлэхийн тулд шинэчлэх",
      "swipe.discover": "Олох",
      "swipe.profilesRemaining": "{{count}} профайл үлдсэн",
      "swipe.swipeToExplore": "Swipe хийж үзээрэй",
      "swipe.undo": "Буцаах",
      "swipe.itsAMatch": "Таарлаа!",
      "swipe.youAndMatched": "Та болон {{name}} бие биедээ таалагдлаа",
      "swipe.startChatting": "Чатлаж эхлэх",
      "swipe.noMoreProfiles": "Профайл дууссан",
      "swipe.checkBackLater": "Шинэ таарлын тулд дараа дахин орж үзээрэй",

      // Profile
      "profile.settings": "Профайл тохиргоо",
      "profile.edit": "Профайл засах",
      "profile.preferences": "Таарах тохиргоо",
      "profile.subscription": "Гишүүнчлэл",
      "profile.range": "Хайх хүрээ",
      "profile.age": "Нас",
      "profile.interestedIn": "Сонирхол",
      "profile.female": "Эмэгтэй",
      "profile.male": "Эрэгтэй",
      "profile.all": "Бүгд",
      "profile.maximumDistance": "Дундын зай",
      "profile.distance": "Зай",
      "profile.showPeopleWithin":
        "Ойролцоох {{distance}} км доторх хүмүүсийг харуулна",

      // Subscription
      "subscription.free": "Үнэгүй",
      "subscription.basic": "Үндсэн",
      "subscription.premium": "Премиум",
      "subscription.vip": "VIP",
      "subscription.subscribe": "Бүртгүүлэх",
      "subscription.upgrade": "Шинэчлэх",

      // Main Page
      "main.chooseMatchingStyle": "Match хийх хэв маягаа сонгоно уу",
      "main.liveCall": "Шууд дуудлага",
      "main.liveCallDesc":
        "Манай алгоритмаар шууд өөрт тохирох хэн нэгэнтэй холбогдоорой.",
      "main.startCall": "Дуудлага эхлүүлэх",
      "main.joining": "Нэгдэж байна...",
      "main.swipe": "Swipe",
      "main.swipeDesc":
        "Профайлуудыг үзээд үзээд, таалагдсан хүмүүстэйгээ танилцаарай.",
      "main.startSwiping": "Swipe эхлэх",
      "main.journey":
        "3 шаттай дуудлага аяллаа эхлүүлээд, нэг товчоор шинэ хүнтэй match болоорой.",
      "main.readyToFind": "Очоо",
      "main.to": "",
      "main.find": "олоход",
      "main.your": "бэлэн",
      "main.spark": "үү?",

      // Tabs
      "tabs.findMatch": "Match хайх",
      "tabs.matchingPreferences": "Сонирхлын тохиргоо",
      "tabs.subscription": "Гишүүнчлэл",

      // AI Wingman
      "wingman.ready": "AI Wingman бэлэн",
      "wingman.readyDesc":
        "Шат бүрийн өмнө Wingman төрлөө сонгоорой! Таны сонголтоор автоматаар асуултууд та 2-ооё асууж туслах болно.",
      "wingman.aiMike": "AI Майк",
      "wingman.funnyGuy": "Инээдтэй",
      "wingman.mikeDesc":
        "Шат бүрийн өмнө Wingman төрлөө сонгоорой! Таны сонголтоор автоматаар асуултууд та 2-ооё асууж туслах болно.",
      "wingman.aiLila": "AI Лила",
      "wingman.spicyOne": "Токсик",
      "wingman.lilaDesc":
        "Чатанд халуун дулаан нэмэхийг хүсдэг хүмүүст зориулж сэтгэл хөдөлгөм, тоглоомтой яриа үүсгэдэг.",
      "wingman.aiEmma": "AI Эмма",
      "wingman.deepThinker": "Гүн гүнзгий",
      "wingman.emmaDesc":
        "Сэтгэл хөдлөлийн түвшинд илүү гүнзгий холбоо тогтооход тусалдаг утга учиртай асуултууд үүсгэдэг.",

      // Empty States
      "empty.noMoreProfiles": "Профайл дууссан",
      "empty.checkBackLater":
        "Шинэ таарлын тулд дараа дахин орж үзээрэй, эсвэл тохиргоогоо өөрчилж илүү олон хүнийг харна уу.",
      "empty.adjustPreferences": "Тохиргоо өөрчлөх",

      // Subscription Features
      "subscription.chooseYourPlan": "Төлөвлөгөөгөө сонгох",
      "subscription.monthly": "Сар бүр",
      "subscription.yearly": "Жил бүр",
      "subscription.save17": "17% хэмнэх",
      "subscription.currentPlan": "Одоогийн төлөвлөгөө",
      "subscription.feature.5likes": "Өдөрт 5 таалагдсан",
      "subscription.feature.basicMatching": "Үндсэн таарал",
      "subscription.feature.textMessages": "Текст мессеж",
      "subscription.feature.limitedFilters": "Хязгаарлагдмал шүүлтүүр",
      "subscription.feature.unlimitedLikes": "Хязгааргүй таалагдсан",
      "subscription.feature.aiWingman": "AI туслах",
      "subscription.feature.voiceMessages": "Дуут мессеж",
      "subscription.feature.basicFilters": "Үндсэн шүүлтүүр",
      "subscription.feature.priorityMatching": "Тэргүүлэх таарал",
      "subscription.feature.advancedFilters": "Нарийвчилсан шүүлтүүр",
      "subscription.feature.seeWhoLikes": "Хэн таалагдсаныг харах",
      "subscription.feature.rewind": "Буцаах функц",
      "subscription.feature.topPicks": "Өдөр бүр шилдэг сонголт",
      "subscription.feature.exclusiveMatches": "Онцгой таарал",
      "subscription.feature.concierge": "Консьерж үйлчилгээ",
      "subscription.feature.verifiedBadge": "Баталгаажсан тэмдэг",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("language") || "en", // Default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
