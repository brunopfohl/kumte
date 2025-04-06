import express from 'express';
import { geminiController } from '../controllers/gemini.controller';

const router = express.Router();

/**
 * @route GET /api/gemini/ui
 * @desc Serve a simple UI for interacting with Gemini
 * @access Public
 */
router.get('/ui', geminiController.serveUI);

/**
 * @route POST /api/gemini/generate
 * @desc Generate text content using Google Gemini API
 * @access Public
 */
router.post('/generate', geminiController.generateText);

/**
 * @route POST /api/gemini/analyze
 * @desc Analyze text content using Google Gemini API
 * @access Public
 */
router.post('/analyze', geminiController.analyzeText);

export default router; 