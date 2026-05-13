const openai = require('../../config/openai');
const env = require('../../config/env');

const chatCompletion = async (prompt, options = {}) => {
  try {
    console.log(`Sending prompt to AI (${env.OPENAI_MODEL}). Resume text length: ${prompt.length}`);
    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || env.OPENAI_TEMPERATURE,
      max_tokens: options.max_tokens || env.OPENAI_MAX_TOKENS,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    console.log('Raw AI Response:', content);
    
    // Try to parse JSON with better error handling
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Content that failed to parse:', content);
      
      // Try to extract JSON from content if it's wrapped in code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1]);
        } catch (secondParseError) {
          console.error('Second JSON Parse Error:', secondParseError);
          throw new Error('Invalid JSON response from AI service');
        }
      } else {
        throw new Error('Invalid JSON response from AI service');
      }
    }
    
    console.log(`AI Response parsed successfully. Work History entries: ${parsed.comprehensive_work_history?.length || 0}`);
    return parsed;
  } catch (error) {
    console.error('AI Service Error:', error);
    console.error('Full error details:', error.message);
    if (error.response) {
      console.error('OpenAI API Error:', error.response.data);
    }
    throw new Error('Failed to communicate with AI service: ' + error.message);
  }
};

module.exports = {
  chatCompletion,
};
