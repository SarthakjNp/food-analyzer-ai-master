import axios from 'axios';
import { groqService } from './groqApi';

// Types
export interface AnalysisResult {
  foodName: string;
  nutritionInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    vitamins: Record<string, number>;
  };
  confidence: number;
  note?: string;
}

// Mock database for client-side fallback when API is not available
const mockDatabase = {
  apple: {
    foodName: "Apple",
    nutritionInfo: {
      calories: 95,
      protein: 0.5,
      carbs: 25,
      fat: 0.3,
      fiber: 4.4,
      vitamins: { 'C': 8.4 }
    },
    confidence: 0.92
  },
  banana: {
    foodName: "Banana",
    nutritionInfo: {
      calories: 105,
      protein: 1.3,
      carbs: 27,
      fat: 0.4,
      fiber: 3.1,
      vitamins: { 'C': 10.3, 'B6': 0.4 }
    },
    confidence: 0.94
  },
  orange: {
    foodName: "Orange",
    nutritionInfo: {
      calories: 62,
      protein: 1.2,
      carbs: 15.4,
      fat: 0.2,
      fiber: 3.1,
      vitamins: { 'C': 70 }
    },
    confidence: 0.89
  }
};

// Vision API service
export const visionApiService = {
  /**
   * Analyze food image and get nutritional information
   * @param imageData - Image data as Blob or File
   * @returns Promise with analysis result
   */
  analyzeFoodImage: async (imageData: Blob | File): Promise<AnalysisResult> => {
    try {
      // For development or when API is available
      if (process.env.NODE_ENV === 'development' || typeof window === 'undefined') {
        const formData = new FormData();
        formData.append('image', imageData);
        
        // Call our Next.js API route which will use Groq
        const response = await axios.post('/api/analyze-food', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        return response.data;
      } else {
        // For static exports - direct client-side analysis
        return await visionApiService.analyzeWithGroqDirect(imageData);
      }
    } catch (error) {
      console.error('Error analyzing food image:', error);
      
      // Use mock data as fallback
      const mockKeys = Object.keys(mockDatabase);
      const randomKey = mockKeys[Math.floor(Math.random() * mockKeys.length)];
      return {
        ...mockDatabase[randomKey as keyof typeof mockDatabase],
        note: "Using mock data (API unavailable)"
      };
    }
  },
  
  /**
   * Use Groq Vision API directly from client side (not recommended for production)
   * In production, always make API calls through your backend to protect your API keys
   */
  analyzeWithGroqDirect: async (imageData: Blob | File): Promise<AnalysisResult> => {
    try {
      // Check if API key is available before even attempting conversion
      if (!process.env.NEXT_PUBLIC_DEMO_GROQ_API_KEY) {
        console.warn('No Groq API key available - using mock data');
        // Immediately use mock data without attempting API call
        const mockKeys = Object.keys(mockDatabase);
        const randomKey = mockKeys[Math.floor(Math.random() * mockKeys.length)];
        return {
          ...mockDatabase[randomKey as keyof typeof mockDatabase],
          note: "Using mock data (No API key provided). To use Groq API, set NEXT_PUBLIC_DEMO_GROQ_API_KEY in .env.local"
        };
      }
      
      // If API key is available, proceed with API call
      // Convert to base64
      const base64Image = await blobToBase64(imageData);
      const base64Data = base64Image.split(',')[1];
      
      // Use Groq service
      return await groqService.analyzeFood(base64Data);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error analyzing with Groq Vision:', err);
      
      // Use mock data as fallback with specific error message
      const mockKeys = Object.keys(mockDatabase);
      const randomKey = mockKeys[Math.floor(Math.random() * mockKeys.length)];
      return {
        ...mockDatabase[randomKey as keyof typeof mockDatabase],
        note: `Using mock data (API error: ${err.message})`
      };
    }
  }
};

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}; 