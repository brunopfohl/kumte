import express from 'express';
import { summarizeDocument, chatWithDocument } from '../controllers/llmController';

const router = express.Router();

// Route for document summarization
router.post('/summarize', summarizeDocument);

// Route for chat functionality
router.post('/chat', chatWithDocument);

export default router; 