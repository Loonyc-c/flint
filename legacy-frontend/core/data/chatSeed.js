// src/data/chatSeed.js
export const SEED = [
  {
    id: "lexi",
    name: "Lexi",
    age: 22,
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop",
    messages: [
      { id: "m1", from: "system", text: "You liked Lexi’s photo." },
      { id: "m2", from: "system", text: "Start the chat with Lexi" },
      { id: "m3", from: "them", text: "Is that your horse?" },
      { id: "m4", from: "them", text: "Haha long story 🤭" },
      { id: "m5", from: "me", text: "I’d love to hear more about that" },
    ],
  },
  {
    id: "jaz",
    name: "Jaz",
    age: 18,
    avatar:
      "https://images.unsplash.com/photo-1548142813-c348350df52b?q=80&w=256&auto=format&fit=crop",
    messages: [
      { id: "j1", from: "them", text: "Nice! What else do you like?" },
    ],
  },
  {
    id: "nella",
    name: "Nella",
    age: 27,
    avatar:
      "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=256&auto=format&fit=crop",
    messages: [
      { id: "n1", from: "them", text: "Looking forward to chatting!" },
    ],
  },
];
