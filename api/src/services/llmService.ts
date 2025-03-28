import axios from 'axios';

interface ConversationMessage {
  role: 'user' | 'model';
  parts: string;
}

export const processWithLLM = async (
  prompt: string,
  conversationHistory: ConversationMessage[] = []
): Promise<string> => {
  try {
    const apiKey = process.env.LLM_API_KEY;
    const apiEndpoint = process.env.LLM_API_ENDPOINT;

    if (!apiKey || !apiEndpoint) {
      throw new Error('LLM API configuration is missing');
    }

    // Prepare the request payload based on the LLM API requirements
    // This is a placeholder - adjust according to the specific LLM API you're using
    const payload = {
      messages: [
        ...conversationHistory,
        { role: 'user', parts: prompt }
      ],
      // Add other required parameters based on the LLM API
    };

    const response = await axios.post(apiEndpoint, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Extract and return the response based on the LLM API's response format
    // This is a placeholder - adjust according to the specific LLM API you're using
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error in processWithLLM:', error);
    throw new Error('Failed to process request with LLM');
  }
}; 