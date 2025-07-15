# Food Analyzer AI - Architecture Document

## System Architecture Overview

```
┌─────────────────────────────┐
│       Mobile Device         │
│  ┌─────────────────────┐    │
│  │    Next.js App      │    │
│  │  ┌─────────────┐    │    │
│  │  │   Camera    │    │    │
│  │  │  Component  │    │    │
│  │  └──────┬──────┘    │    │
│  │         │           │    │
│  │  ┌──────▼──────┐    │    │
│  │  │ Image       │    │    │
│  │  │ Processing  │────┼────┼───┐
│  │  └─────────────┘    │    │   │
│  │                     │    │   │
│  │  ┌─────────────┐    │    │   │
│  │  │ Results     │    │    │   │
│  │  │ Display     │◄───┼────┼───┘
│  │  └─────────────┘    │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│      Backend Services       │
│                             │
│  ┌─────────────────────┐    │
│  │   API Routes        │    │
│  │                     │    │
│  │  /api/analyze-food  │    │
│  └──────────┬──────────┘    │
│             │               │
│  ┌──────────▼──────────┐    │
│  │  Groq Vision API    │    │
│  │  Service            │    │
│  └──────────┬──────────┘    │
│             │               │
│  ┌──────────▼──────────┐    │
│  │  Nutrition Analysis │    │
│  │  Processing         │    │
│  └─────────────────────┘    │
│                             │
└─────────────────────────────┘
```

## Component Breakdown

### 1. Frontend Components

#### Camera Component (`/src/components/Camera.tsx`)
- Real-time camera preview using React Webcam
- Capture frame on user request
- Convert image to proper format
- Display analysis results overlay
- Responsive UI with Tailwind CSS

#### Vision API Service (`/src/services/visionApi.ts`)
- Interface for communicating with backend API
- Image processing and formatting
- API response handling
- Error handling and fallback mechanisms

### 2. Backend Services

#### API Routes (`/src/app/api/analyze-food/route.ts`)
- Handle incoming image data
- Communicate with Groq Vision API
- Process and return structured food data

#### Groq Service (`/src/services/groqApi.ts`)
- Format requests for Groq's Vision API
- Process image data for Groq compatibility
- Extract and format nutritional information from Groq's response
- Error handling and response validation

## Groq API Integration

### Overview

The application uses Groq's Vision model (Llama 3.2 90B Vision) for identifying food items and analyzing their nutritional content. The integration works as follows:

1. **Image Capture**: The Camera component captures an image using react-webcam
2. **Image Conversion**: The image is converted from base64 to a blob format
3. **API Request**: The image is sent to our backend API route
4. **Backend Processing**: 
   - The API route receives the image and converts it to base64
   - A request is formed with proper formatting for Groq's Vision API
   - The system prompt instructs the model to identify food and provide nutritional data
5. **Groq Vision Analysis**:
   - The model identifies the food item in the image
   - It generates nutritional information
   - It returns a structured JSON response
6. **Response Processing**:
   - The response is parsed and validated
   - The nutritional data is extracted and formatted
7. **UI Display**: The processed data is displayed on the screen overlay

### Request Format

The request to Groq uses the following format:

```json
{
  "model": "llama-3.2-90b-vision-preview",
  "messages": [
    {
      "role": "system",
      "content": "You are a food analysis expert. Analyze the provided image and identify the food item..."
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "What food is this? Provide nutritional analysis..."
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,..."
          }
        }
      ]
    }
  ],
  "temperature": 0.2
}
```

### Response Format

The Groq API returns a response that is parsed to extract the nutritional information in this format:

```json
{
  "foodName": "Apple",
  "nutritionInfo": {
    "calories": 95,
    "protein": 0.5,
    "carbs": 25,
    "fat": 0.3,
    "fiber": 4.4,
    "vitamins": {
      "C": 8.4,
      "A": 0.1
    }
  },
  "confidence": 0.92
}
```

### Fallback Mechanism

In case the Groq API is unavailable or returns an error, the system has a fallback mechanism using a local database of common food items. This ensures the app remains functional even when there are API issues.

## Data Flow

1. **Image Capture**:
   - User points camera at food item
   - User presses "Analyze" button
   - React Webcam captures current frame

2. **Image Processing**:
   - Convert to appropriate format (JPEG/base64)
   - Prepare for API transmission

3. **API Request**:
   - Send image data to backend API
   - Backend forwards to Groq Vision API

4. **AI Analysis**:
   - Groq Vision identifies food item
   - Determines food type and nutritional content

5. **Results Display**:
   - Return structured data to frontend
   - Render nutritional information overlay
   - Display confidence score

## Technology Stack

- **Frontend**: Next.js, React, TailwindCSS, TypeScript
- **Mobile**: Capacitor (for native Android compilation)
- **APIs**: Custom Next.js API routes
- **AI Services**: Groq Vision API (Llama 3.2 90B Vision model)
- **Development**: npm, git

## Development Workflow

1. Local development with Next.js
2. API testing with mock data
3. Build Next.js app with static export
4. Sync with Capacitor
5. Build Android APK

## Security Considerations

- API keys stored securely as environment variables
- Image data handled securely and not stored persistently
- User privacy maintained (no persistent image storage)
- All API communication occurs server-side to protect API keys

## Future Enhancements

1. **Offline Mode**:
   - Integrate TensorFlow.js for on-device inference
   - Cache nutritional database for offline use

2. **Custom Training**:
   - Allow users to train recognition for custom foods
   - Improve accuracy with user feedback

3. **Social Features**:
   - Food journaling capability
   - Sharing nutritional information

4. **Advanced Analysis**:
   - Recipe suggestions based on identified ingredients
   - Allergen alerts
   - Dietary restrictions flagging 