export interface QuestionPrompt {
  id: string;
  category: string
  text: string;
}




export const QUESTION_POOL:ReadonlyArray<QuestionPrompt> = [
  // Personality & Values
  {
    id: "personality_1",
    category: "Personality",
    text: "What's your ideal first date?",
  },
  {
    id: "personality_2",
    category: "Personality",
    text: "What makes you laugh the most?",
  },
  {
    id: "personality_3",
    category: "Personality",
    text: "What's your biggest passion in life?",
  },
  {
    id: "personality_4",
    category: "Personality",
    text: "How would your best friend describe you?",
  },
  {
    id: "personality_5",
    category: "Personality",
    text: "What's something you're really proud of?",
  },
  {
    id: "personality_6",
    category: "Personality",
    text: "What's your love language?",
  },

  // Lifestyle & Hobbies
  {
    id: "lifestyle_1",
    category: "Lifestyle",
    text: "What's your favorite hobby?",
  },
  {
    id: "lifestyle_2",
    category: "Lifestyle",
    text: "How do you spend your weekends?",
  },
  {
    id: "lifestyle_3",
    category: "Lifestyle",
    text: "What's your dream travel destination?",
  },
  {
    id: "lifestyle_4",
    category: "Lifestyle",
    text: "Are you a morning person or night owl?",
  },
  {
    id: "lifestyle_5",
    category: "Lifestyle",
    text: "What's your favorite way to stay active?",
  },
  {
    id: "lifestyle_6",
    category: "Lifestyle",
    text: "What's your go-to comfort food?",
  },

  // Dating & Relationships
  {
    id: "dating_1",
    category: "Dating",
    text: "What are you looking for in a relationship?",
  },
  {
    id: "dating_2",
    category: "Dating",
    text: "What's your idea of a perfect relationship?",
  },
  {
    id: "dating_3",
    category: "Dating",
    text: "What's a dealbreaker for you in dating?",
  },
  {
    id: "dating_4",
    category: "Dating",
    text: "What's the most romantic thing you've ever done?",
  },
  {
    id: "dating_5",
    category: "Dating",
    text: "How do you show someone you care?",
  },
  {
    id: "dating_6",
    category: "Dating",
    text: "What's your biggest relationship goal?",
  },

  // Fun & Random
  {
    id: "fun_1",
    category: "Fun",
    text: "If you could have dinner with anyone, who would it be?",
  },
  {
    id: "fun_2",
    category: "Fun",
    text: "What's your hidden talent?",
  },
  {
    id: "fun_3",
    category: "Fun",
    text: "What's the best advice you've ever received?",
  },
  {
    id: "fun_4",
    category: "Fun",
    text: "What's your favorite movie or TV show?",
  },
  {
    id: "fun_5",
    category: "Fun",
    text: "If you won the lottery, what would you do first?",
  },
  {
    id: "fun_6",
    category: "Fun",
    text: "What's something on your bucket list?",
  },

  // Career & Ambitions
  {
    id: "career_1",
    category: "Career",
    text: "What do you do for work, and do you love it?",
  },
  {
    id: "career_2",
    category: "Career",
    text: "What's your biggest career goal?",
  },
  {
    id: "career_3",
    category: "Career",
    text: "What motivates you every day?",
  },
  {
    id: "career_4",
    category: "Career",
    text: "Where do you see yourself in 5 years?",
  },
];