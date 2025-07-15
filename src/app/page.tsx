'use client';

import dynamic from 'next/dynamic';

// Dynamically import the camera component with SSR disabled
// since it uses browser APIs (webcam) that aren't available during server rendering
const CameraWithNoSSR = dynamic(
  () => import('@/components/Camera'),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 w-full shadow-lg">
        <header className="container mx-auto py-3 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Food Analyzer AI</h1>
          </div>
          <p className="text-white text-sm opacity-90 hidden sm:block">Point camera at food for instant nutrition</p>
        </header>
      </div>
      
      <div className="flex-1 w-full h-full relative">
        {/* Camera Component */}
        <div className="absolute inset-0">
          <CameraWithNoSSR />
        </div>
      </div>
      
      <footer className="w-full bg-gradient-to-r from-gray-900 to-black text-white text-center p-3 text-xs font-medium">
        <p>Food Analyzer AI &copy; {new Date().getFullYear()} | Built with Next.js</p>
      </footer>
    </main>
  );
}
