# React Native to Google Gemini API Express Server

This Express.js server provides an intermediary API between a React Native application and the Google Gemini API. It handles the secure storage of API keys and provides a simplified interface for interacting with Google's AI models.

## Setup Instructions

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables:
   - Create a `.env` file in the root directory
   - Add your Google Gemini API key:
     ```
     PORT=3000
     GEMINI_API_KEY=your_gemini_api_key_here
     ```
4. Start the development server:
   ```
   npm run dev
   ```
   
## Available Endpoints

### `GET /`
- A simple health check endpoint that returns a JSON object with a message indicating that the API is running.

### `POST /api/gemini/generate`
- Generates text content using the Google Gemini API.
- Request body:
  ```json
  {
    "prompt": "Your prompt text here",
    "modelName": "gemini-2.0-flash" // Optional, defaults to gemini-pro
  }
  ```
- Response:
  ```json
  {
    "success": true,
    "data": {
      "generatedText": "Response from Google Gemini API"
    }
  }
  ```

### `POST /api/gemini/analyze`
- Analyzes text content using the Google Gemini API.
- Request body:
  ```json
  {
    "text": "Text to analyze",
    "instructions": "Optional instructions for analysis"
  }
  ```
- Response:
  ```json
  {
    "success": true,
    "data": {
      "analysis": "Analysis from Google Gemini API"
    }
  }
  ```

## Using with React Native

From your React Native application, you can make HTTP requests to these endpoints. Example using the Fetch API:

```javascript
fetch('http://your-server-address:3000/api/gemini/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ 
    prompt: 'Tell me about React Native and Gemini AI integration'
  }),
})
.then(response => response.json())
.then(data => {
  console.log(data.data.generatedText);
})
.catch(error => {
  console.error('Error:', error);
});
``` 