const openai = require('../../config/openai');
const env = require('../../config/env');
const { jsonrepair } = require('jsonrepair');

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
    const finishReason = response.choices[0].finish_reason;
    const usage = response.usage;
    
    if (usage) {
      console.log(`Token Usage - Prompt: ${usage.prompt_tokens}, Completion: ${usage.completion_tokens}, Total: ${usage.total_tokens}`);
    }

    console.log('AI Finish Reason:', finishReason);
    
    if (finishReason === 'length') {
      console.warn('AI Response truncated due to token limit.');
    }

    console.log('Raw AI Response length:', content.length);
    
    // Try to parse JSON with better error handling
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      
      let repairSuccess = false;
      if (finishReason === 'length') {
        try {
          console.log('Attempting to repair truncated JSON...');
          parsed = JSON.parse(jsonrepair(content));
          console.log('Successfully repaired truncated JSON.');
          repairSuccess = true;
        } catch (repairError) {
          console.error('JSON Repair Error:', repairError.message);
          console.warn('AI response truncated and could not be repaired. Returning empty object for this chunk to prevent full crash.');
          return {};
        }
      }
      
      if (!repairSuccess) {
        // Try to extract JSON from content if it's wrapped in code blocks
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[1]);
          } catch (secondParseError) {
            console.error('Second JSON Parse Error:', secondParseError.message);
            console.warn('Invalid JSON in code block. Returning empty object.');
            return {};
          }
        } else {
          console.error('Invalid JSON response from AI service: ' + parseError.message);
          console.warn('Returning empty object to prevent full crash.');
          return {};
        }
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
