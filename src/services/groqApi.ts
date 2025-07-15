import axios from 'axios';
import { AnalysisResult } from './visionApi';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: string;
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

interface GroqChatCompletionRequest {
  model: string;
  messages: GroqMessage[];
  max_tokens?: number;
  temperature?: number;
}

interface GroqChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    logprobs: null;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// IMPORTANT NOTE: This approach exposes the API key in client-side code
// This is ONLY for demonstration purposes
// In a production environment, ALWAYS use a backend service to handle API calls
const DEMO_GROQ_API_KEY = process.env.NEXT_PUBLIC_DEMO_GROQ_API_KEY || '';

// Log the API key status on load (redacted for security)
if (typeof window !== 'undefined') {
  console.log('API Key Status:', DEMO_GROQ_API_KEY ? 'Available' : 'Missing');
}

// Define error types
interface ApiError extends Error {
  response?: {
    data?: {
      error?: {
        message?: string;
      };
    };
  };
}

// Add a global variable to store the raw response for debugging
let lastRawResponse = '';

export const getLastRawResponse = () => lastRawResponse;

export const groqService = {
  /**
   * Analyze food image using Groq's vision model
   * @param imageBase64 - Base64-encoded image data
   * @returns Promise with analysis result
   */
  analyzeFood: async (imageBase64: string): Promise<AnalysisResult> => {
    try {
      // Check if we're in a browser environment and if the API key is available
      const isClient = typeof window !== 'undefined';
      const apiKey = isClient ? DEMO_GROQ_API_KEY : process.env.GROQ_API_KEY;
      
      if (!apiKey) {
        console.error('Missing Groq API key. For static builds, you must set NEXT_PUBLIC_DEMO_GROQ_API_KEY in .env.local');
        throw new Error('API key not available');
      }
      
      // Prepare the API request with image data
      const requestData: GroqChatCompletionRequest = {
        model: process.env.GROQ_MODEL || 'llama-3.2-90b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'You are a food analysis expert. Analyze this food image and identify what it is. Provide detailed nutritional information including calories, protein, carbs, fat, fiber content, and vitamins/minerals. RESPOND ONLY WITH VALID JSON in this exact format, with no other text or explanation: {"foodName": "Name of Food", "nutritionInfo": {"calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "vitamins": {"A": number, "C": number}}, "confidence": 0.9} where confidence is a number between 0 and 1.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      };

      // Make API call to Groq
      try {
        const response = await axios.post<GroqChatCompletionResponse>(
          process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions',
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            }
          }
        );

        // Extract the JSON from the response
        const content = response.data.choices[0].message.content;
        lastRawResponse = content; // Store for debugging
        console.log('Groq response:', content); // Log full response for debugging

        // Improved JSON extraction with better pattern matching
        let parsedData;
        try {
          // First attempt: Try to parse the entire response as JSON
          try {
            parsedData = JSON.parse(content);
            console.log('Parsed entire response as JSON');
          } catch {
            // Second attempt: Look for JSON objects with our expected structure
            const jsonMatch = content.match(/\{(?:\s*"foodName"|"nutritionInfo"|"confidence")[\s\S]*\}/);
            if (jsonMatch) {
              parsedData = JSON.parse(jsonMatch[0]);
              console.log('Extracted JSON using pattern matching');
            } else {
              // Third attempt: Create JSON from any food-related data we can find
              const foodNameMatch = content.match(/["']?foodName["']?\s*:\s*["']([^"']+)["']/i);
              const caloriesMatch = content.match(/["']?calories["']?\s*:\s*(\d+)/i);
              const proteinMatch = content.match(/["']?protein["']?\s*:\s*(\d+(?:\.\d+)?)/i);
              const carbsMatch = content.match(/["']?carbs["']?\s*:\s*(\d+(?:\.\d+)?)/i);
              const fatMatch = content.match(/["']?fat["']?\s*:\s*(\d+(?:\.\d+)?)/i);
              const fiberMatch = content.match(/["']?fiber["']?\s*:\s*(\d+(?:\.\d+)?)/i);
              
              if (foodNameMatch) {
                // Construct a valid JSON object from extracted values
                parsedData = {
                  foodName: foodNameMatch[1],
                  nutritionInfo: {
                    calories: caloriesMatch ? parseFloat(caloriesMatch[1]) : 0,
                    protein: proteinMatch ? parseFloat(proteinMatch[1]) : 0,
                    carbs: carbsMatch ? parseFloat(carbsMatch[1]) : 0,
                    fat: fatMatch ? parseFloat(fatMatch[1]) : 0,
                    fiber: fiberMatch ? parseFloat(fiberMatch[1]) : 0,
                    vitamins: {}
                  },
                  confidence: 0.7 // Default confidence
                };
                console.log('Constructed JSON from text extraction');
              } else {
                throw new Error('Could not find food information in response');
              }
            }
          }
          
          // Validate the parsed data has our required structure
          if (!parsedData.foodName || !parsedData.nutritionInfo) {
            throw new Error('Response missing required fields');
          }
          
          return parsedData as AnalysisResult;
        } catch (parseError: unknown) {
          const err = parseError as Error;
          console.error('Error parsing JSON from Groq response:', err);
          console.error('Original content:', content);
          throw new Error(`Invalid JSON format in response: ${err.message}`);
        }
      } catch (apiError: unknown) {
        const err = apiError as ApiError;
        console.error('Groq API error:', err.response?.data || err.message);
        throw new Error(`Groq API error: ${err.response?.data?.error?.message || err.message}`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error analyzing food with Groq:', err);
      throw new Error(`Failed to analyze food with Groq Vision API: ${err.message}`);
    }
  }
}; 