import { geminiApi } from './services/geminiApi';

async function testGeminiAPI() {
  console.log('Testing Gemini API connection...');
  
  // Test the connection
  const connectionTest = await geminiApi.testConnection();
  console.log('Connection test result:', connectionTest);
  
  if (connectionTest.success) {
    // Test story generation
    console.log('\nTesting story generation...');
    const storyResult = await geminiApi.generateStory({
      words: ['eloquent', 'tenacious', 'enigmatic', 'profound'],
      genre: 'mystery',
      character: 'a retired detective',
      length: 'short'
    });
    
    if (storyResult.success) {
      console.log('\nStory generation successful!');
      console.log('Title:', storyResult.title);
      console.log('\nStory:');
      console.log(storyResult.story);
    } else {
      console.error('Story generation failed:', storyResult.error);
    }
  }
}

testGeminiAPI().catch(error => {
  console.error('Test failed with error:', error);
});