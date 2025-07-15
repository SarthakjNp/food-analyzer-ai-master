'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { visionApiService, AnalysisResult } from '@/services/visionApi';
import { getLastRawResponse } from '@/services/groqApi';

export default function Camera() {
  const webcamRef = useRef<Webcam>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [showRawResponse, setShowRawResponse] = useState<boolean>(false);
  const [showDashboard, setShowDashboard] = useState<boolean>(true);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Check camera permission when component mounts
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setPermissionError('Camera API not supported in this browser');
          return;
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            facingMode: 'environment' 
          }
        });
        
        // If we get here, permission was granted
        setPermissionGranted(true);
        
        // Clean up stream tracks
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('Camera permission error:', err);
        setPermissionGranted(false);
        setPermissionError('Camera access denied. Please enable camera permissions in your browser settings.');
      }
    };
    
    checkCameraPermission();
  }, []);

  // Request camera permission explicitly
  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: 'environment'
        }
      });
      setPermissionGranted(true);
      setPermissionError(null);
    } catch (err) {
      console.error('Failed to get permission:', err);
      setPermissionError('Camera access denied. Please enable camera permissions in your browser settings.');
    }
  };

  const captureImage = useCallback(async () => {
    if (!webcamRef.current) return;
    
    setIsAnalyzing(true);
    setError(null);
    setRawResponse('');
    
    try {
      // Capture the current frame from the webcam
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (!imageSrc) {
        setError('Failed to capture image');
        return;
      }
      
      // Convert base64 to blob for API
      const base64Data = imageSrc.split(',')[1];
      const blob = base64ToBlob(base64Data, 'image/jpeg');
      
      // Send to API for analysis using our service
      const result = await visionApiService.analyzeFoodImage(blob);
      setAnalysisResult(result);
      
      // Get raw response for debugging
      setRawResponse(getLastRawResponse());
    } catch (error) {
      console.error('Error analyzing food:', error);
      setError('Failed to analyze food. Please try again.');
      
      // Get raw response even if there was an error
      setRawResponse(getLastRawResponse());
      
      // For demo purposes, we'll set mock data if the API fails
      setAnalysisResult({
        foodName: 'Apple',
        nutritionInfo: {
          calories: 95,
          protein: 0.5,
          carbs: 25,
          fat: 0.3,
          fiber: 4.4,
          vitamins: { 'C': 8.4 }
        },
        confidence: 0.92
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [webcamRef]);
  
  // Helper function to convert base64 to a blob
  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: mimeType });
  };

  // Format vitamin display
  const formatVitamins = (vitamins: Record<string, number>) => {
    return Object.entries(vitamins).map(([key, value]) => (
      <div key={key} className="text-xs">
        Vitamin {key}: {value}mg
      </div>
    ));
  };

  // Toggle raw response display
  const toggleRawResponse = () => {
    setShowRawResponse(prev => !prev);
  };

  // Toggle dashboard visibility
  const toggleDashboard = () => {
    setShowDashboard(prev => !prev);
  };

  return (
    <div className="relative w-full h-full">
      {/* Camera Component */}
      {permissionGranted && (
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: 'environment', // Use the back camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }}
          className="w-full h-full object-cover"
          mirrored={false} // Don't mirror the camera
          forceScreenshotSourceSize // Use high resolution for screenshots
          onUserMediaError={(err) => {
            console.error('Webcam error:', err);
            setPermissionGranted(false);
            setPermissionError('Camera error: ' + (typeof err === 'object' && err !== null && 'message' in err ? err.message : 'Unknown error'));
          }}
        />
      )}
      
      {/* Error Message */}
      {error && (
        <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-red-500 to-red-600 text-white p-2 text-center font-medium shadow-lg">
          {error}
        </div>
      )}
      
      {/* Overlay with Analysis Results */}
      {analysisResult && showDashboard && (
        <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/90 to-black/60 backdrop-blur-sm text-white p-4 rounded-b-xl shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{analysisResult.foodName}</h2>
            <button 
              onClick={toggleDashboard}
              className="text-gray-400 hover:text-white"
              aria-label="Hide dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-3 rounded-xl shadow-lg transform transition-transform hover:scale-105">
              <div className="text-lg font-bold">{analysisResult.nutritionInfo.calories} kcal</div>
              <div className="text-xs font-medium opacity-85">Calories</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-600 to-green-800 p-3 rounded-xl shadow-lg transform transition-transform hover:scale-105">
              <div className="text-lg font-bold">{analysisResult.nutritionInfo.protein}g</div>
              <div className="text-xs font-medium opacity-85">Protein</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 p-3 rounded-xl shadow-lg transform transition-transform hover:scale-105">
              <div className="text-lg font-bold">{analysisResult.nutritionInfo.carbs}g</div>
              <div className="text-xs font-medium opacity-85">Carbs</div>
            </div>
            
            <div className="bg-gradient-to-br from-red-600 to-red-800 p-3 rounded-xl shadow-lg transform transition-transform hover:scale-105">
              <div className="text-lg font-bold">{analysisResult.nutritionInfo.fat}g</div>
              <div className="text-xs font-medium opacity-85">Fat</div>
            </div>
          </div>
          
          <div className="mt-3 bg-gradient-to-br from-purple-600 to-purple-800 p-3 rounded-xl shadow-lg transform transition-transform hover:scale-105">
            <div className="text-lg font-bold">{analysisResult.nutritionInfo.fiber}g</div>
            <div className="text-xs font-medium opacity-85">Fiber</div>
          </div>
          
          {analysisResult.nutritionInfo.vitamins && Object.keys(analysisResult.nutritionInfo.vitamins).length > 0 && (
            <div className="mt-3">
              <h3 className="text-sm font-bold mb-1">Vitamins & Minerals:</h3>
              <div className="grid grid-cols-2 gap-1 bg-gradient-to-br from-gray-800 to-gray-900 p-3 rounded-xl">
                {formatVitamins(analysisResult.nutritionInfo.vitamins)}
              </div>
            </div>
          )}
          
          <div className="text-xs mt-3 text-center opacity-85">
            <span className="inline-block px-2 py-1 bg-blue-900/50 rounded-full text-blue-200 font-medium">
              Confidence: {(analysisResult.confidence * 100).toFixed(0)}%
            </span>
            {analysisResult.note && <span className="block italic mt-1">{analysisResult.note}</span>}
          </div>
        </div>
      )}
      
      {/* Developer Tools Button */}
      {rawResponse && (
        <button 
          onClick={toggleRawResponse}
          className="absolute bottom-24 right-4 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg z-10"
          aria-label={showRawResponse ? "Hide API Response" : "Show API Response"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showRawResponse ? "M13 10V3L4 14h7v7l9-11h-7z" : "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"} />
          </svg>
        </button>
      )}
      
      {/* Raw Response */}
      {rawResponse && showRawResponse && (
        <div className="absolute bottom-20 left-0 w-full bg-gradient-to-t from-gray-900 to-gray-800 text-white p-4 rounded-t-xl shadow-xl max-h-40 overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold">Raw API Response:</h3>
            <button 
              onClick={toggleRawResponse}
              className="text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <pre className="text-xs whitespace-pre-wrap overflow-auto font-mono bg-black/30 p-2 rounded">{rawResponse}</pre>
        </div>
      )}
      
      {/* Analyze Button */}
      <div className="absolute bottom-0 left-0 w-full p-4 flex justify-center">
        <button
          onClick={captureImage}
          disabled={isAnalyzing}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full shadow-xl disabled:opacity-50 flex items-center font-bold text-lg transform transition-transform hover:scale-105"
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Analyze Food
            </>
          )}
        </button>
      </div>
      
      {/* Permission UI elements */}
      {permissionGranted === false && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center text-white p-4 z-20">
          <svg className="w-20 h-20 mb-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <p className="text-center mb-6 text-lg">{permissionError || 'Camera access is required for this app'}</p>
          <button 
            onClick={requestCameraPermission}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full shadow-xl font-bold text-lg transform transition-transform hover:scale-105"
          >
            Grant Camera Permission
          </button>
        </div>
      )}
      
      {/* Loading state when permission is being determined */}
      {permissionGranted === null && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center text-white p-4 z-20">
          <div className="animate-spin w-20 h-20 mb-6 border-4 border-blue-500 border-t-transparent rounded-full shadow-lg"></div>
          <p className="text-center mb-4 text-lg font-medium">Checking camera permissions...</p>
        </div>
      )}

      {/* Show Dashboard Button (when hidden) */}
      {analysisResult && !showDashboard && (
        <button 
          onClick={toggleDashboard}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-full shadow-lg z-10 flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span>Show Results</span>
        </button>
      )}
    </div>
  );
} 