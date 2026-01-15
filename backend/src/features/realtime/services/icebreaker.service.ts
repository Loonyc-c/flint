import { getUserCollection } from '@/data/db/collection'
import { ObjectId } from 'mongodb'

class IcebreakerService {
  private systemPrompt = `
    You are an AI Wingman for a dating app called Flint. 
    Your goal is to help two users break the ice during a live voice or video call.
    Based on the provided interests of both users, generate 3 unique, fun, and engaging ice-breaker questions.
    
    Rules:
    1. Keep it lighthearted, playful, and safe.
    2. Focus on their shared interests if any, or interesting unique ones.
    3. Questions should be open-ended to encourage conversation.
    4. Format: Return ONLY a JSON array of strings.
    5. Language: English.
  `

  /**
   * Generate ice-breaker questions for two users
   */
  public async generateIcebreakers(user1Id: string, user2Id: string): Promise<string[]> {
    try {
      const userCollection = await getUserCollection()
      const users = await userCollection.find({
        _id: { $in: [new ObjectId(user1Id), new ObjectId(user2Id)] }
      }, { projection: { 'profile.interests': 1, 'auth.firstName': 1 } }).toArray()

      if (users.length < 2) return this.getFallbackQuestions()

      const user1Interests = users[0]?.profile?.interests || []
      const user2Interests = users[1]?.profile?.interests || []

      // In a real production app, we would call OpenAI/Gemini here.
      // For this implementation, I'll use a fetch to Gemini API if key exists, 
      // or a robust rule-based generator as a fallback.
      
      const apiKey = process.env.GEMINI_API_KEY
      if (apiKey) {
        return await this.callGemini(user1Interests, user2Interests, apiKey)
      }

      return this.generateRuleBasedIcebreakers(user1Interests, user2Interests)
    } catch (error) {
      console.error('[IcebreakerService] Error generating icebreakers:', error)
      return this.getFallbackQuestions()
    }
  }

  private async callGemini(interests1: string[], interests2: string[], apiKey: string): Promise<string[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    
    const prompt = `
      User 1 Interests: ${interests1.join(', ')}
      User 2 Interests: ${interests2.join(', ')}
      
      Generate 3 ice-breaker questions based on these interests.
    `

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: this.systemPrompt + '\n' + prompt }] }],
          generationConfig: { response_mime_type: 'application/json' }
        })
      })

      const data = await response.json() as any
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) {
        return JSON.parse(text)
      }
    } catch (e) {
      console.error('[IcebreakerService] Gemini API call failed:', e)
    }
    
    return this.generateRuleBasedIcebreakers(interests1, interests2)
  }

  private generateRuleBasedIcebreakers(interests1: string[], interests2: string[]): string[] {
    const shared = interests1.filter(i => interests2.includes(i))
    const questions: string[] = []

    if (shared.length > 0) {
      questions.push(`I see you both love ${shared[0]}! What's your favorite thing about it?`)
    }

    if (interests1.length > 0) {
      questions.push(`To User 2: User 1 is into ${interests1[0]}. Have you ever tried that?`)
    }

    if (interests2.length > 0) {
      questions.push(`To User 1: User 2 really enjoys ${interests2[0]}. What's the coolest experience you've had with that?`)
    }

    // Fill up to 3 if needed
    const fallbacks = this.getFallbackQuestions()
    while (questions.length < 3) {
      questions.push(fallbacks[questions.length])
    }

    return questions.slice(0, 3)
  }

  private getFallbackQuestions(): string[] {
    return [
      "If you could travel anywhere right now, where would you go?",
      "What's the best meal you've ever had?",
      "What's your go-to karaoke song?",
      "Are you a morning person or a night owl?",
      "What's one thing on your bucket list?"
    ]
  }
}

export const icebreakerService = new IcebreakerService()
