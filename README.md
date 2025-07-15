# Food Analyzer AI

A Next.js application that uses your device's camera to analyze food in real-time and provide nutritional information. Built with Capacitor to compile into a native Android app.

## Features

- Real-time camera access on mobile devices
- Food recognition using Groq's Vision API (Llama 3.2 Vision Model)
- Detailed nutritional information display
- Works as a PWA or native Android app

## Tech Stack

- Next.js for frontend
- TypeScript for type safety
- Tailwind CSS for styling
- Capacitor for native mobile compilation
- React Webcam for camera access
- Groq API for image recognition and analysis

## Prerequisites

Before building the app, ensure you have the following installed:
- Node.js (v18 or newer)
- npm or yarn
- Android Studio (for Android builds)
- Java Development Kit (JDK)
- Groq API key (for food recognition)

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/food-analyzer-ai.git
cd food-analyzer-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
- Create a `.env.local` file in the root directory
- Add your Groq API key:
```
GROQ_API_KEY=your_groq_api_key_here
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_MODEL=llama-3.2-90b-vision-preview
```

4. Development:
```bash
npm run dev
```

5. Build for web:
```bash
npm run build
```

6. Sync with Capacitor:
```bash
npx cap sync
```

7. Open in Android Studio:
```bash
npx cap open android
```

## Building the APK

1. After opening in Android Studio, select **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
2. The APK will be generated in the `android/app/build/outputs/apk/debug/` directory

## Integration with Groq Vision API

This application uses Groq's Llama 3.2 Vision model for food recognition. The API flow works as follows:

1. The camera captures a photo when the user presses the "Analyze Food" button
2. The image is converted to base64 format
3. The base64 image is sent to our backend API
4. The backend API forwards the request to Groq's Vision API
5. Groq's Vision model analyzes the food and returns nutritional information
6. The results are displayed on the screen as an overlay

For more information about Groq's Vision API, visit [Groq API Documentation](https://console.groq.com/docs).

## License

MIT
