import { NextRequest, NextResponse } from 'next/server';
import { groqService } from '@/services/groqApi';

// Mock nutrition database for fallback
const nutritionDatabase = {
  apple: {
    calories: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0.3,
    fiber: 4.4,
    vitamins: { 'C': 8.4, 'A': 0.1 }
  },
  banana: {
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.4,
    fiber: 3.1,
    vitamins: { 'C': 10.3, 'B6': 0.4 }
  },
  orange: {
    calories: 62,
    protein: 1.2,
    carbs: 15.4,
    fat: 0.2,
    fiber: 3.1,
    vitamins: { 'C': 70, 'A': 0.14 }
  },
  broccoli: {
    calories: 55,
    protein: 3.7,
    carbs: 11.2,
    fat: 0.6,
    fiber: 5.1,
    vitamins: { 'C': 135, 'K': 0.15, 'A': 0.77 }
  },
  chicken: {
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    vitamins: { 'B6': 0.6, 'B12': 0.3 }
  }
};

export async function POST(request: NextRequest) {
  try {
    // Process the form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as Blob;
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }
    
    try {
      // Convert image to base64
      const buffer = await imageFile.arrayBuffer();
      const base64Image = Buffer.from(buffer).toString('base64');
      
      // Use Groq service to analyze the image
      const analysisResult = await groqService.analyzeFood(base64Image);
      
      return NextResponse.json(analysisResult);
    } catch (apiError) {
      console.error('Error with Groq API:', apiError);
      
      // Fallback to mock data if Groq API fails
      const foods = Object.keys(nutritionDatabase);
      const randomFood = foods[Math.floor(Math.random() * foods.length)];
      const confidence = 0.75 + Math.random() * 0.2;
      const nutritionInfo = nutritionDatabase[randomFood as keyof typeof nutritionDatabase];
      
      return NextResponse.json({
        foodName: randomFood.charAt(0).toUpperCase() + randomFood.slice(1),
        nutritionInfo,
        confidence,
        note: "Using fallback data as Groq API request failed"
      });
    }
  } catch (error) {
    console.error('Error processing food analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze food image' },
      { status: 500 }
    );
  }
} 