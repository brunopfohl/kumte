import { Request, Response } from 'express';
import { processWithLLM } from '../services/llmService';

interface DocumentRequest {
  documentType: 'pdf' | 'image';
  content: string;
}

interface ChatRequest {
  conversationHistory: Array<{ role: 'user' | 'model'; parts: string }>;
  newMessage: string;
  documentContext: {
    type: 'pdf' | 'image';
    content: string;
  };
}

export const summarizeDocument = async (req: Request, res: Response) => {
  try {
    const { documentType, content } = req.body as DocumentRequest;

    if (!documentType || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = documentType === 'pdf'
      ? `Please provide a comprehensive summary of the following document content:\n${content}`
      : `Please describe the following image in detail:\n${content}`;

    const summary = await processWithLLM(prompt);
    res.json({ summary });
  } catch (error) {
    console.error('Error in summarizeDocument:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
};

export const chatWithDocument = async (req: Request, res: Response) => {
  try {
    const { conversationHistory, newMessage, documentContext } = req.body as ChatRequest;

    if (!conversationHistory || !newMessage || !documentContext) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const contextPrompt = `We are discussing a ${documentContext.type} document with the following content:\n${documentContext.content}\n\nUser's question: ${newMessage}`;
    
    const response = await processWithLLM(contextPrompt, conversationHistory);
    res.json({ response });
  } catch (error) {
    console.error('Error in chatWithDocument:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
}; 