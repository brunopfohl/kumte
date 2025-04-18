import { Document } from './FileService';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { apiClient } from './apiClient';

// Cache for document URIs to avoid repeated processing
const documentUriCache: Record<string, string> = {};

/**
 * Service to handle document content and AI operations for enhanced learning
 */
export class DocumentService {
  /**
   * Get document content (simulated for now)
   */
  static async getDocumentContent(document: Document): Promise<string> {
    // Simulate getting document content - in a real app this would parse the document
    return new Promise((resolve) => {
      setTimeout(() => {
        if (document.type === 'pdf') {
          resolve(`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. 
          Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.

          Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, 
          euismod non, mi. Proin porttitor, orci nec nonummy molestie.

          Fusce neque. Etiam posuere lacus quis dolor. Praesent lectus.`);
        } else {
          resolve('Image document content (extracted text from OCR would appear here)');
        }
      }, 300);
    });
  }

  /**
   * Process a document URI to ensure it can be viewed
   * For content:// URIs, this will create a data URI
   */
  static async prepareDocumentForViewing(document: Document): Promise<string> {
    try {
      console.log('Preparing document for viewing:', document.uri);
      
      // Check if we have this document in the cache
      const cacheKey = `${document.id}-${document.uri}`;
      if (documentUriCache[cacheKey]) {
        console.log('Using cached URI for document:', document.id);
        return documentUriCache[cacheKey];
      }
      
      // If the document has a data URI already, cache and return it
      if (document.dataUri) {
        documentUriCache[cacheKey] = document.dataUri;
        return document.dataUri;
      }
      
      // Handle content:// URIs by making a copy if needed
      if (document.uri.startsWith('content://')) {
        console.log('Found content:// URI, creating a local copy to avoid permission issues');
        try {
          // Create a local copy to avoid permission issues
          const timestamp = Date.now();
          const extension = document.type === 'pdf' ? 'pdf' : 'jpg';
          const fileName = `temp_${document.id}_${timestamp}.${extension}`;
          const destPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
          
          // Copy the file to cache
          await RNFS.copyFile(document.uri, destPath);
          console.log('Created local copy at:', destPath);
          
          // Use the local file instead
          const localUri = `file://${destPath}`;
          documentUriCache[cacheKey] = localUri;
          return localUri;
        } catch (copyError) {
          console.error('Failed to create local copy from content URI:', copyError);
          // Continue with normal processing, might fail due to permissions
        }
      }
      
      // For file:// URIs
      if (document.uri.startsWith('file://')) {
        console.log('Converting local document to data URI');
        
        // For PDFs, convert to data URI
        if (document.type === 'pdf') {
          try {
            // For file:// URIs on Android, remove the prefix
            const path = document.uri.startsWith('file://') && Platform.OS === 'android' 
              ? document.uri.replace('file://', '') 
              : document.uri;
            
            // Check if path is already a data URI
            if (path.startsWith('data:application/pdf;base64,')) {
              const base64Data = path.split(',')[1];
              console.log('Path is already a data URI, extracted base64 data');
              const dataUri = path; // Path is already a data URI
              // Cache the result
              documentUriCache[cacheKey] = dataUri;
              return dataUri;
            } else {
              // Check file size before reading
              const stats = await RNFS.stat(path);
              if (stats.size > 20 * 1024 * 1024) { // 20MB limit
                console.log('File too large for data URI, using direct file path instead');
                // For very large PDFs, use the file:// URI directly
                documentUriCache[cacheKey] = document.uri;
                return document.uri;
              }
              
              // Read file as base64
              const base64Data = await RNFS.readFile(path, 'base64');
              const dataUri = `data:application/pdf;base64,${base64Data}`;
              
              // Cache the result
              documentUriCache[cacheKey] = dataUri;
              
              return dataUri;
            }
          } catch (error) {
            console.error('Failed to convert document to data URI:', error);
            // Fall back to file URI
            documentUriCache[cacheKey] = document.uri;
            return document.uri;
          }
        }
        
        // For images, convert to data URI if needed
        if (document.type === 'image') {
          try {
            const path = document.uri.startsWith('file://') && Platform.OS === 'android' 
              ? document.uri.replace('file://', '') 
              : document.uri;
            
            // Check file size before reading
            const stats = await RNFS.stat(path);
            if (stats.size > 5 * 1024 * 1024) { // 5MB limit for images
              console.log('Image too large for data URI, using direct file path instead');
              documentUriCache[cacheKey] = document.uri;
              return document.uri;
            }
            
            // Read file as base64
            const base64Data = await RNFS.readFile(path, 'base64');
            const dataUri = `data:image/${document.uri.split('.').pop()};base64,${base64Data}`;
            
            // Cache the result
            documentUriCache[cacheKey] = dataUri;
            
            return dataUri;
          } catch (error) {
            console.error('Failed to convert image to data URI:', error);
            // For images, we can fall back to the original URI
            documentUriCache[cacheKey] = document.uri;
            return document.uri;
          }
        }
      }
      
      // For URLs, return as-is but still cache
      documentUriCache[cacheKey] = document.uri;
      return document.uri;
    } catch (error) {
      console.error('Error preparing document for viewing:', error);
      throw error;
    }
  }

  /**
   * Analyze document using Gemini API
   * @param document Document to analyze
   * @param instructions Instructions for analysis
   * @param language Optional language code for response
   */
  static async analyzeDocumentWithGemini(
    document: Document,
    instructions: string = "Analyze this document and identify key learning points",
    language?: string
  ): Promise<string> {
    try {
      console.log('Analyzing document with Gemini:', document.id);
      
      // Ensure we have a valid document
      if (!document || !document.uri) {
        throw new Error("Invalid document");
      }
      
      // First, prepare the document for viewing - this will create local copies
      // of content URIs and handle permissions properly
      const preparedUri = await DocumentService.prepareDocumentForViewing(document);
      
      // For PDF documents
      if (document.type === 'pdf') {
        // Get document data as base64
        let base64Data: string;
        
        // If we already have a data URI
        if (preparedUri.startsWith('data:application/pdf;base64,')) {
          base64Data = preparedUri.split(',')[1];
          console.log('Using existing data URI for Gemini analysis');
        } else {
          // Otherwise read the file
          console.log('Reading document for Gemini analysis:', preparedUri);
          const path = preparedUri.startsWith('file://') && Platform.OS === 'android' 
            ? preparedUri.replace('file://', '') 
            : preparedUri;
          
          // Read the file as base64
          base64Data = await RNFS.readFile(path, 'base64');
          console.log('Document read successfully, length:', base64Data.length);
        }
        
        // Call the API with the PDF data
        return await apiClient.analyzeText(instructions, undefined, base64Data, language);
      } 
      
      // For non-PDF documents
      console.log('Non-PDF document, using text analysis instead');
      const content = await DocumentService.getDocumentContent(document);
      return await apiClient.analyzeText(content, instructions);
    } catch (error) {
      console.error('Error analyzing document with Gemini:', error);
      throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate adaptive quiz questions based on document content with difficulty levels
   * @param document Document to analyze
   * @param textToAnalyze Text to generate questions from
   * @param numberOfQuestions Number of questions to generate
   * @param difficultyLevel Optional difficulty level (beginner, intermediate, advanced)
   * @param language Optional language code for response
   */
  static async generateQuizQuestions(
    document: Document,
    textToAnalyze: string,
    numberOfQuestions: number,
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    language?: string
  ): Promise<string> {
    const difficultyInstructions = {
      beginner: 'Focus on basic recall and understanding of fundamental concepts.',
      intermediate: 'Include questions that test application and analysis of concepts.',
      advanced: 'Create challenging questions that require synthesis, evaluation, and deep understanding.'
    };

    const instruction = `
      You are an expert educational content creator specialized in creating engaging, pedagogically sound assessments.
      
      Generate ${numberOfQuestions} high-quality single choice questions based on the provided learning material.
      ${difficultyInstructions[difficultyLevel]}
      
      Follow these educational best practices:
      1. Align questions with Bloom's taxonomy appropriate for the ${difficultyLevel} level
      2. Ensure questions assess genuine understanding rather than trivial recall
      3. Make distractors (wrong answers) plausible and educational
      4. Craft clear, unambiguous question stems
      5. Include questions that promote critical thinking
      6. For each question, provide a thorough explanation that reinforces learning
      
      Return the questions in the following JSON format:
      [
        {
          "question": "Question text",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": 0,
          "explanation": "Detailed explanation of why this answer is correct and others are not, reinforcing the key learning point",
          "difficultyLevel": "${difficultyLevel}",
          "learningObjective": "The specific learning objective this question addresses"
        }
      ]
      
      Only return the JSON array, no other text.
      Escape all special characters properly to ensure valid JSON.
      
      ${textToAnalyze}
    `;

    return await DocumentService.analyzeDocumentWithGemini(document, instruction, language);
  }

  /**
   * Analyze text with language support and enhanced learning focus
   * @param document Document to analyze
   * @param text Text to analyze
   * @param instruction Analysis instruction
   * @param language Optional language code for response
   */
  static async analyzeText(
    document: Document,
    text: string,
    instruction: string = "Explain this text in an educational manner",
    language?: string
  ): Promise<string> {
    const languageInstruction = language && language !== 'en' 
      ? `Please provide your answer in ${language}, using appropriate academic terminology for that language.` 
      : '';
    
    const fullInstruction = `
      As an expert educator, ${instruction}
      
      Focus on clarity, accuracy, and educational value in your response.
      Identify key concepts, make connections to foundational knowledge, and highlight practical applications.
      Use examples and analogies when appropriate to enhance understanding.
      
      ${languageInstruction}
      
      Here is the text to analyze: "${text}"
    `;
    
    return await DocumentService.analyzeDocumentWithGemini(document, fullInstruction, language);
  }

  /**
   * Extract keywords and concepts from text with enhanced educational focus
   * @param document Document to analyze
   * @param text Text to extract keywords from
   * @param language Optional language code for response
   */
  static async extractKeywords(
    document: Document,
    text: string,
    language?: string
  ): Promise<string> {
    const languageInstruction = language && language !== 'en' 
      ? `Please provide your answer in ${language}, using domain-appropriate terminology.` 
      : '';
    
    const instruction = `
      As an educational content expert, extract the 7-10 most important concepts from the following text.
      Prioritize concepts that represent foundational knowledge or key learning outcomes.
      
      For each concept:
      1. Identify the precise terminology
      2. Provide a clear, educational definition
      3. Explain its significance to the broader subject
      4. Rate its importance for learner comprehension (0.0-1.0)
      5. Suggest a related concept that builds upon this knowledge
      
      Return the results in the following JSON format:
      [
        {
          "concept": "primary concept term",
          "definition": "clear, educational definition",
          "significance": "explanation of why this concept matters",
          "importanceScore": 0.9,
          "relatedConcepts": ["related concept 1", "related concept 2"]
        }
      ]
      
      ${languageInstruction}
      
      Format the output as valid JSON that can be parsed. Only return the JSON array, no other text.
      
      Here is the text to analyze: "${text}"
    `;
    
    return await DocumentService.analyzeDocumentWithGemini(document, instruction, language);
  }

  /**
   * Generate flashcards from document content for spaced repetition learning
   * @param document Document to analyze
   * @param text Text to generate flashcards from
   * @param numberOfFlashcards Number of flashcards to generate
   * @param language Optional language code for response
   */
  static async generateFlashcards(
    document: Document,
    text: string,
    numberOfFlashcards: number = 10,
    language?: string
  ): Promise<string> {
    const languageInstruction = language && language !== 'en'
      ? `Please provide your answer in ${language}.`
      : '';
    
    const instruction = `
      As an expert in educational content creation and cognitive science, create ${numberOfFlashcards} high-quality flashcards 
      based on the provided text that follow evidence-based learning principles.
      
      For each flashcard:
      1. Focus on a single, clear concept (atomic learning principle)
      2. Frame questions to promote active recall rather than recognition
      3. Include cloze deletions for key terms where appropriate
      4. For concept-based cards, ensure the front contains a precise question and the back a concise answer
      5. For definition cards, place the term on front and definition on back
      6. Rate the difficulty level (1-3) to enable spaced repetition scheduling
      
      Return the flashcards in the following JSON format:
      [
        {
          "front": "Clear, concise question or prompt",
          "back": "Precise, educational answer",
          "difficultyLevel": 2,
          "tags": ["topic1", "topic2"],
          "conceptCategory": "category of the concept (e.g., 'definition', 'process', 'comparison')"
        }
      ]
      
      ${languageInstruction}
      
      Format the output as valid JSON that can be parsed. Only return the JSON array, no other text.
      
      Here is the text to create flashcards from: "${text}"
    `;
    
    return await DocumentService.analyzeDocumentWithGemini(document, instruction, language);
  }

  /**
   * Generate a concept map to visualize relationships between ideas
   * @param document Document to analyze
   * @param text Text to generate concept map from
   * @param centralConcept Optional central concept to focus on
   * @param language Optional language code for response
   */
  static async generateConceptMap(
    document: Document,
    text: string,
    centralConcept?: string,
    language?: string
  ): Promise<string> {
    const languageInstruction = language && language !== 'en'
      ? `Please provide your answer in ${language}.`
      : '';
    
    const centralConceptInstruction = centralConcept
      ? `Use "${centralConcept}" as the central node of the concept map.`
      : 'Identify the most important concept as the central node.';
    
    const instruction = `
      As an expert in knowledge visualization and learning science, create a comprehensive concept map 
      based on the provided text. ${centralConceptInstruction}
      
      Follow these principles for an effective concept map:
      1. Identify 8-15 key concepts from the text
      2. Create a hierarchical structure with the most general concepts at the top
      3. Label all relationships between concepts with precise, descriptive linking phrases
      4. Ensure the map shows meaningful connections rather than just associations
      5. Include cross-links between different branches where appropriate
      
      Return the concept map in the following JSON format suitable for visualization:
      {
        "centralConcept": "main concept",
        "nodes": [
          {"id": "1", "label": "Concept 1", "level": 1},
          {"id": "2", "label": "Concept 2", "level": 2}
        ],
        "links": [
          {"source": "1", "target": "2", "label": "relates to", "type": "hierarchical"},
          {"source": "2", "target": "3", "label": "influences", "type": "cross-link"}
        ],
        "summary": "Brief explanation of the overall concept structure and key relationships"
      }
      
      ${languageInstruction}
      
      Format the output as valid JSON that can be parsed. Only return the JSON object, no other text.
      
      Here is the text to create the concept map from: "${text}"
    `;
    
    return await DocumentService.analyzeDocumentWithGemini(document, instruction, language);
  }

  /**
   * Generate a personalized learning path based on document content
   * @param document Document to analyze
   * @param text Text to generate learning path from
   * @param learnerLevel Current knowledge level (beginner, intermediate, advanced)
   * @param learningGoal Optional specific learning goal
   * @param language Optional language code for response
   */
  static async generateLearningPath(
    document: Document,
    text: string,
    learnerLevel: 'beginner' | 'intermediate' | 'advanced',
    learningGoal?: string,
    language?: string
  ): Promise<string> {
    const languageInstruction = language && language !== 'en'
      ? `Please provide your answer in ${language}.`
      : '';
    
    const goalInstruction = learningGoal
      ? `Focus the learning path toward this specific goal: "${learningGoal}"`
      : 'Create a comprehensive learning path covering the key concepts in the material.';
    
    const instruction = `
      As an expert instructional designer and educational coach, create a personalized, scaffolded learning path 
      based on the provided material for a ${learnerLevel} level learner. ${goalInstruction}
      
      Follow these evidence-based instructional design principles:
      1. Begin with prerequisite knowledge assessment and bridging activities
      2. Sequence topics in a pedagogically sound order (simple to complex, concrete to abstract)
      3. Include varied learning activities (reading, practice, reflection, application)
      4. Incorporate formative assessments at key points for knowledge verification
      5. Provide extension resources for deeper understanding
      6. Include specific milestones and success criteria for each learning stage
      7. Suggest appropriate time commitments for each learning component
      
      Return the learning path in the following JSON format:
      {
        "title": "Descriptive title for the learning path",
        "targetAudience": "${learnerLevel} learners",
        "estimatedCompletionTime": "X hours/days",
        "prerequisiteKnowledge": ["concept 1", "concept 2"],
        "learningOutcomes": ["outcome 1", "outcome 2"],
        "modules": [
          {
            "title": "Module title",
            "description": "Module description",
            "learningActivities": [
              {
                "type": "reading/exercise/practice/assessment",
                "title": "Activity title",
                "description": "Activity description",
                "estimatedTime": "X minutes",
                "resources": ["resource 1", "resource 2"],
                "successCriteria": "How to know when this activity is completed successfully"
              }
            ],
            "assessmentStrategy": "Description of how learning will be verified"
          }
        ],
        "advancementPaths": ["Suggested next topics or advanced materials after completion"]
      }
      
      ${languageInstruction}
      
      Format the output as valid JSON that can be parsed. Only return the JSON object, no other text.
      
      Here is the text to create the learning path from: "${text}"
    `;
    
    return await DocumentService.analyzeDocumentWithGemini(document, instruction, language);
  }

  /**
   * Generate a guided study session with questions and prompts
   * @param document Document to analyze
   * @param text Text to generate study session from
   * @param sessionDuration Desired session duration in minutes
   * @param focusArea Optional specific area to focus on
   * @param language Optional language code for response
   */
  static async generateGuidedStudySession(
    document: Document,
    text: string,
    sessionDuration: number = 30,
    focusArea?: string,
    language?: string
  ): Promise<string> {
    const languageInstruction = language && language !== 'en'
      ? `Please provide your answer in ${language}.`
      : '';
    
    const focusInstruction = focusArea
      ? `Focus the study session specifically on: "${focusArea}"`
      : 'Create a balanced study session covering the most important concepts.';
    
    const instruction = `
      As an expert educational coach and study strategist, design a structured, guided study session 
      that will take approximately ${sessionDuration} minutes to complete. ${focusInstruction}
      
      The study session should:
      1. Begin with a brief pre-assessment to activate prior knowledge
      2. Include varied study techniques (active recall, elaboration, self-explanation)
      3. Incorporate strategic breaks using evidence-based timing (e.g., Pomodoro technique)
      4. Feature metacognitive prompts that encourage reflection on understanding
      5. End with a brief self-assessment to verify learning
      6. Balance content review with application and practice
      7. Use research-backed methods to enhance retention and understanding
      
      Return the guided study session in the following JSON format:
      {
        "title": "Engaging title for the study session",
        "focusArea": "${focusArea || 'Comprehensive review'}",
        "duration": "${sessionDuration} minutes",
        "learningObjectives": ["objective 1", "objective 2"],
        "preAssessment": {
          "questions": ["question 1", "question 2"],
          "purpose": "Explanation of how this activates relevant knowledge"
        },
        "studyActivities": [
          {
            "type": "review/practice/reflection/application",
            "duration": "X minutes",
            "title": "Activity title",
            "instructions": "Clear instructions for the activity",
            "materials": ["Any specific sections or resources needed"],
            "prompts": ["Specific questions or prompts to guide thinking"],
            "expectedOutcome": "What the learner should produce or understand"
          }
        ],
        "breaks": [
          {
            "timing": "After X minutes",
            "duration": "Y minutes",
            "activity": "Suggested break activity for cognitive refresh"
          }
        ],
        "postAssessment": {
          "questions": ["question 1", "question 2"],
          "reflectionPrompts": ["metacognitive prompt 1", "metacognitive prompt 2"]
        },
        "followUpSuggestions": ["suggestion for further study 1", "suggestion 2"]
      }
      
      ${languageInstruction}
      
      Format the output as valid JSON that can be parsed. Only return the JSON object, no other text.
      
      Here is the text to create the guided study session from: "${text}"
    `;
    
    return await DocumentService.analyzeDocumentWithGemini(document, instruction, language);
  }

  /**
   * Generate a simplified explanation of a complex concept for better understanding
   * @param document Document to analyze
   * @param text Text containing the complex concept
   * @param targetConcept The specific concept to explain
   * @param targetLevel The desired simplification level (child, teenager, non-expert adult)
   * @param language Optional language code for response
   */
  static async explainSimply(
    document: Document,
    text: string,
    targetConcept: string,
    targetLevel: 'child' | 'teenager' | 'non-expert' = 'non-expert',
    language?: string
  ): Promise<string> {
    const languageInstruction = language && language !== 'en'
      ? `Please provide your answer in ${language}.`
      : '';
    
    const levelGuidelines = {
      'child': 'Use simple vocabulary, concrete examples, and relatable analogies. Avoid abstract concepts. Target age 7-10.',
      'teenager': 'Use clear language with some technical terms explained. Include relevant examples and connections to everyday life. Target age 13-17.',
      'non-expert': 'Use precise but accessible language. Minimize jargon, explain necessary technical terms, and provide practical context.'
    };
    
    const instruction = `
      As an expert educator specialized in making complex concepts accessible, create a clear, engaging explanation 
      of "${targetConcept}" for a ${targetLevel} audience.
      
      ${levelGuidelines[targetLevel]}
      
      Your explanation should:
      1. Begin with a hook or relatable context to engage interest
      2. Break down the concept into manageable components
      3. Use appropriate analogies and mental models
      4. Include visual descriptions that aid understanding
      5. Connect to existing knowledge the audience likely has
      6. Avoid unnecessary complexity while maintaining accuracy
      7. End with a simple summary that reinforces key points
      
      Return the explanation in the following JSON format:
      {
        "concept": "${targetConcept}",
        "targetAudience": "${targetLevel}",
        "hook": "Engaging opening to capture interest",
        "coreExplanation": "Main explanation broken into simple parts",
        "analogies": ["analogy 1", "analogy 2"],
        "visualDescriptions": ["description 1", "description 2"],
        "commonMisconceptions": ["misconception 1", "misconception 2"],
        "summary": "Brief, reinforcing summary of the key points",
        "furtherExplorationPrompts": ["question 1", "question 2"]
      }
      
      ${languageInstruction}
      
      Format the output as valid JSON that can be parsed. Only return the JSON object, no other text.
      
      Here is the text containing information about ${targetConcept}: "${text}"
    `;
    
    return await DocumentService.analyzeDocumentWithGemini(document, instruction, language);
  }
} 