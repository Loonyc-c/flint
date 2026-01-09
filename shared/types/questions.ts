export interface QuestionPrompt {
  id: string;
  text: string;
}

export const QUESTION_POOL: ReadonlyArray<QuestionPrompt> = [
  { id: 'personality_1', text: "What's your ideal first date?" },
  { id: 'personality_2', text: 'What makes you laugh the most?' },
  { id: 'personality_3', text: "What's your biggest passion in life?" },
  { id: 'lifestyle_3', text: "What's your dream travel destination?" },
  { id: 'fun_2', text: "What's your hidden talent?" }
] as const;
