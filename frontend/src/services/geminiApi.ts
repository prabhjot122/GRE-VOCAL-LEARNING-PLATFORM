import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from 'sonner';

// Gemini API configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface StoryGenerationRequest {
  words: string[];
  genre: string;
  character?: string;
  scenario?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
}

export interface StoryGenerationResponse {
  success: boolean;
  story?: string;
  title?: string;
  error?: string;
}

class GeminiApiService {
  private apiKey: string;
  private aiClient: GoogleGenerativeAI;

  // 提取 lengthInstructions 为静态属性，便于复用
  private static readonly lengthInstructions = {
    short: 'Write a short story (150-250 words)',
    medium: 'Write a medium-length story (300-500 words)',
    long: 'Write a longer story (500-800 words)',
  };

  constructor() {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is missing.');
    }
    this.apiKey = GEMINI_API_KEY;
    this.aiClient = new GoogleGenerativeAI(this.apiKey);
  }

  private buildPrompt(request: StoryGenerationRequest): string {
    const { words, genre, character, scenario, tone = 'engaging', length = 'medium' } = request;

    const characterInstruction = character ? `The main character is ${character}.` : 'Create an interesting main character.';
    const scenarioInstruction = scenario ? `The story should be set in this scenario: ${scenario}.` : '';

    return `
      You are a creative writing assistant. ${GeminiApiService.lengthInstructions[length]} in the ${genre} genre.

      Requirements:
      - Genre: ${genre}
      - Tone: ${tone}
      - ${characterInstruction}
      - ${scenarioInstruction}
      - You MUST naturally incorporate ALL of these vocabulary words into the story: ${words.join(', ')}
      - Make the story engaging and well-structured with a clear beginning, middle, and end
      - Use the vocabulary words in context so they feel natural, not forced
      - Bold the vocabulary words when they appear in the story using **word** format

      Please provide:
      1. A creative title for the story
      2. The complete story

      Format your response as:
      Title: [Your Creative Title]

      Story:
      [Your story here with vocabulary words in bold]
    `.trim();
  }

  private parseGeneratedContent(content: string): { story: string; title: string } {
    // 使用正则表达式解析标题和故事内容
    const titleMatch = content.match(/Title:\s*(.*)/);
    const storyMatch = content.match(/Story:\s*([\s\S]*)/);

    const title = titleMatch ? titleMatch[1].trim() : 'Generated Story';
    const story = storyMatch ? storyMatch[1].trim() : '';

    return { story, title };
  }

  async generateStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse> {
    try {
      const prompt = this.buildPrompt(request);
      const model = this.aiClient.getGenerativeModel({ model: 'gemini-2.0-flash-001' });
      const result = await model.generateContent(prompt);
      const response = result.response;

      // Check if response has text
      if (response.text()) {
        const { story, title } = this.parseGeneratedContent(response.text());
        return { success: true, story, title };
      } else {
        throw new Error('No content generated from Gemini API');
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate story');
      return { success: false, error: error instanceof Error ? error.message : 'Failed to generate story' };
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  getStatus(): { available: boolean; message: string } {
    if (this.apiKey) {
      return { available: true, message: 'Gemini API is configured and ready to use' };
    } else {
      return { available: false, message: 'Gemini API key not found. Add GEMINI_API_KEY to your .env file to enable AI story generation.' };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const model = this.aiClient.getGenerativeModel({ model: 'gemini-2.0-flash-001' });
      const result = await model.generateContent('Hello, please respond with "Gemini API is working correctly" if you receive this message.');
      const response = result.response;

      // Validate response content
      if (response.text() && response.text().includes('Gemini API is working correctly')) {
        return { success: true, message: 'Gemini API connection successful!' };
      } else {
        throw new Error('Unexpected response from Gemini API');
      }
    } catch (error) {
      console.error('Gemini API test error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to connect to Gemini API' };
    }
  }
}

export const geminiApi = new GeminiApiService();
