import { toast } from "sonner";

// Gemini API configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

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

  constructor() {
    this.apiKey = GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Gemini API key not found. Story generation will use fallback method.');
    }
  }

  /**
   * Generate a story using Google Gemini API
   */
  async generateStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.'
      };
    }

    try {
      const prompt = this.buildPrompt(request);
      
      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const generatedText = data.candidates[0].content.parts[0].text;
        const { story, title } = this.parseGeneratedContent(generatedText);
        
        return {
          success: true,
          story,
          title
        };
      } else {
        throw new Error('No content generated from Gemini API');
      }

    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate story'
      };
    }
  }

  /**
   * Build the prompt for story generation
   */
  private buildPrompt(request: StoryGenerationRequest): string {
    const { words, genre, character, scenario, tone = 'engaging', length = 'medium' } = request;
    
    const lengthInstructions = {
      short: 'Write a short story (150-250 words)',
      medium: 'Write a medium-length story (300-500 words)',
      long: 'Write a longer story (500-800 words)'
    };

    const characterInstruction = character ? `The main character is ${character}.` : 'Create an interesting main character.';
    const scenarioInstruction = scenario ? `The story should be set in this scenario: ${scenario}.` : '';

    return `
You are a creative writing assistant. ${lengthInstructions[length]} in the ${genre} genre.

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

  /**
   * Parse the generated content to extract title and story
   */
  private parseGeneratedContent(content: string): { story: string; title: string } {
    const lines = content.split('\n');
    let title = '';
    let story = '';
    let storyStarted = false;

    for (const line of lines) {
      if (line.startsWith('Title:')) {
        title = line.replace('Title:', '').trim();
      } else if (line.startsWith('Story:')) {
        storyStarted = true;
      } else if (storyStarted && line.trim()) {
        story += line + '\n';
      }
    }

    // If no explicit title found, try to extract from first line
    if (!title && story) {
      const firstLine = story.split('\n')[0];
      if (firstLine.length < 100) {
        title = firstLine.trim();
        story = story.substring(firstLine.length).trim();
      }
    }

    // Default title if none found
    if (!title) {
      title = 'Generated Story';
    }

    return { story: story.trim(), title };
  }

  /**
   * Check if Gemini API is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get API status information
   */
  getStatus(): { available: boolean; message: string } {
    if (this.apiKey) {
      return {
        available: true,
        message: 'Gemini API is configured and ready to use'
      };
    } else {
      return {
        available: false,
        message: 'Gemini API key not found. Add VITE_GEMINI_API_KEY to your .env file to enable AI story generation.'
      };
    }
  }
}

// Export singleton instance
export const geminiApi = new GeminiApiService();

// Export types
export type { StoryGenerationRequest, StoryGenerationResponse };
