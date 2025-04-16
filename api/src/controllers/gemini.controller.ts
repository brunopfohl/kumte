import { Request, Response } from 'express';
import { geminiService, GenerationRequest } from '../services/gemini.service';

export class GeminiController {
  /**
   * Serve a simple UI for interacting with Gemini
   * @param req Express request object
   * @param res Express response object
   */
  public serveUI(req: Request, res: Response): void {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gemini Chat</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
          }
          .chat-area {
            flex: 1;
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
            overflow-y: auto;
            background-color: #f9f9f9;
          }
          .message-form {
            display: flex;
            gap: 10px;
          }
          .message-input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
          }
          .send-button {
            padding: 10px 20px;
            background-color: #4285f4;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
          .response {
            margin-top: 15px;
            white-space: pre-wrap;
          }
          .user-message {
            background-color: #e3f2fd;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 10px;
          }
          .ai-message {
            background-color: #ffffff;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 10px;
            border-left: 3px solid #4285f4;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Gemini Chat</h1>
          <div id="chat-area" class="chat-area"></div>
          <form id="message-form" class="message-form">
            <input 
              type="text" 
              id="message-input" 
              class="message-input" 
              placeholder="Type your message here..."
              required
            >
            <button type="submit" class="send-button">Send</button>
          </form>
        </div>
        
        <script>
          document.getElementById('message-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const messageInput = document.getElementById('message-input');
            const chatArea = document.getElementById('chat-area');
            const message = messageInput.value.trim();
            
            if (!message) return;
            
            // Add user message to chat
            const userMessageDiv = document.createElement('div');
            userMessageDiv.className = 'user-message';
            userMessageDiv.textContent = message;
            chatArea.appendChild(userMessageDiv);
            
            // Clear input
            messageInput.value = '';
            
            try {
              // Send message to Gemini API
              const response = await fetch('/api/gemini/generate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: message })
              });
              
              const data = await response.json();
              
              if (data.success) {
                // Add AI response to chat
                const aiMessageDiv = document.createElement('div');
                aiMessageDiv.className = 'ai-message';
                aiMessageDiv.textContent = data.data.generatedText;
                chatArea.appendChild(aiMessageDiv);
              } else {
                throw new Error(data.error || 'Failed to get response');
              }
            } catch (error) {
              console.error('Error:', error);
              
              // Add error message to chat
              const errorDiv = document.createElement('div');
              errorDiv.className = 'ai-message';
              errorDiv.style.borderLeft = '3px solid red';
              errorDiv.textContent = 'Error: ' + (error.message || 'Failed to get response');
              chatArea.appendChild(errorDiv);
            }
            
            // Scroll to bottom
            chatArea.scrollTop = chatArea.scrollHeight;
          });
        </script>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  /**
   * Generate text content using Google Gemini API
   * @param req Express request object
   * @param res Express response object
   */
  public async generateText(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, modelName, fileData } = req.body;
      
      // Validate input
      if (!prompt) {
        res.status(400).json({ success: false, error: 'Prompt is required' });
        return;
      }
      
      // Create request object
      const request: GenerationRequest = {
        prompt,
        modelName,
        fileData
      };
      
      // Generate content
      const generatedText = await geminiService.generateContent(request);
      
      // Send response
      res.status(200).json({
        success: true,
        data: {
          generatedText
        }
      });
    } catch (error) {
      console.error('Error in generateText controller:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message || 'Failed to generate text'
      });
    }
  }

  /**
   * Analyze text content using Google Gemini API
   * @param req Express request object
   * @param res Express response object
   */
  public async analyzeText(req: Request, res: Response): Promise<void> {
    try {
      const { text, instructions } = req.body;
      
      // Validate input
      if (!text) {
        res.status(400).json({ success: false, error: 'Text to analyze is required' });
        return;
      }
      
      // Generate analysis using the new method
      const analysis = await geminiService.analyzeText(text, instructions);
      
      // Send response
      res.status(200).json({
        success: true,
        data: {
          analysis
        }
      });

      console.log('Analysis:', analysis);
    } catch (error) {
      console.error('Error in analyzeText controller:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message || 'Failed to analyze text'
      });
    }
  }

  /**
   * Analyze PDF document using Google Gemini API
   * @param req Express request object
   * @param res Express response object
   */
  public async analyzePDF(req: Request, res: Response): Promise<void> {
    try {
      const { pdfBase64, instructions, language } = req.body;
      
      // Validate input
      if (!pdfBase64) {
        res.status(400).json({ 
          success: false, 
          error: 'PDF content is required as base64 string' 
        });
        return;
      }
      
      if (!instructions) {
        res.status(400).json({ 
          success: false, 
          error: 'Instructions for PDF analysis are required' 
        });
        return;
      }
      
      // Analyze PDF using the service
      const analysis = await geminiService.analyzePDF(
        pdfBase64,
        instructions,
        language
      );

      console.log('Analysis:', analysis);
      
      // Send response
      res.status(200).json({
        success: true,
        data: {
          analysis
        }
      });
    } catch (error) {
      console.error('Error in analyzePDF controller:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message || 'Failed to analyze PDF'
      });
    }
  }
}

// Export a singleton instance of the controller
export const geminiController = new GeminiController(); 