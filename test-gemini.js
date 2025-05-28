// Simple script to test the Gemini API

const API_KEY = 'AIzaSyCVhvx7Pi9pLfJ7cSHAWdMGYKEQNTyuTOM';
const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

async function testGeminiAPI() {
  console.log('Testing Gemini API connection...');
  
  try {
    // Test simple connection
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello, please respond with "Gemini API is working correctly" if you receive this message.'
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 50,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      console.log('API Response:', text);
      console.log('\nConnection test successful!');
      
      // Test story generation
      console.log('\nTesting story generation...');
      const storyResponse = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `
You are a creative writing assistant. Write a short story (150-250 words) in the mystery genre.

Requirements:
- Genre: mystery
- Tone: suspenseful
- The main character is a retired detective.
- You MUST naturally incorporate ALL of these vocabulary words into the story: eloquent, tenacious, enigmatic, profound
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
              `.trim()
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

      if (!storyResponse.ok) {
        const errorData = await storyResponse.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${storyResponse.status}`);
      }

      const storyData = await storyResponse.json();
      
      if (storyData.candidates && storyData.candidates[0] && storyData.candidates[0].content) {
        const generatedText = storyData.candidates[0].content.parts[0].text;
        
        // Parse the generated content
        const lines = generatedText.split('\n');
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
        
        console.log('\nStory generation successful!');
        console.log('Title:', title);
        console.log('\nStory:');
        console.log(story.trim());
      } else {
        throw new Error('No content generated from Gemini API for story');
      }
    } else {
      throw new Error('No content generated from Gemini API');
    }

  } catch (error) {
    console.error('Gemini API test error:', error);
  }
}

testGeminiAPI();