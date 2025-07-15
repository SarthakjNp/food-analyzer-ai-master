const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Environment variables
  env: {
    GROQ_API_URL: process.env.GROQ_API_URL,
    GROQ_MODEL: process.env.GROQ_MODEL,
    // Public API key (will be visible in browser)
    NEXT_PUBLIC_DEMO_GROQ_API_KEY: process.env.NEXT_PUBLIC_DEMO_GROQ_API_KEY,
  },
};

module.exports = withPWA(nextConfig);
