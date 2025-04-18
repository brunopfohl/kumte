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

## Docker Deployment

This API can be easily deployed using Docker. Follow these steps to deploy it on your VPS:

### Option 1: Quick Build and Deploy (Windows)

1. Run the deployment script in PowerShell:
   ```powershell
   # Execute the script
   .\deploy.ps1
   ```

2. Transfer the generated `kumte-api-deploy.zip` file to your VPS

3. On your VPS, extract the ZIP file

4. Navigate to the deploy directory:
   ```bash
   cd deploy
   ```

5. Start the Docker container:
   ```bash
   docker compose up -d
   ```

### Option 2: Manual Deployment

1. Build the Docker image locally:
   ```bash
   docker compose build
   ```

2. Create a deployment directory on your VPS with:
   - `Dockerfile`
   - `docker-compose.yml`
   - `.env` file

3. On your VPS, navigate to the deployment directory and run:
   ```bash
   docker compose up -d
   ```

### Environment Variables

Make sure your `.env` file contains the necessary environment variables:

```
PORT=3000
GEMINI_API_KEY=your_api_key
```

### Managing the Deployment

- View logs: `docker compose logs -f`
- Stop the service: `docker compose down`
- Restart the service: `docker compose restart` 