/**
 * Environment configuration for the application
 */

export const env = {

  speechToTextApiUrl: process.env.NEXT_PUBLIC_SPEECH_TO_TEXT_API_URL || 'http://localhost:8001',
  
} as const;

export type Env = typeof env;
