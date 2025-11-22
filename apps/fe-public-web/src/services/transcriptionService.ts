/**
 * Service for handling audio transcription via Speech-to-Text API
 */

import { env } from '@/config/env';

export interface TranscriptionRequest {
  audio_base64: string;
  filename?: string;
}

export interface TranscriptionResponse {
  transcription: {
    text: string;
    language?: string;
    confidence?: number;
    [key: string]: unknown;
  };
  filename?: string;
}

export interface TranscriptionError {
  error: string;
  detail?: string;
}

class TranscriptionService {
  private static instance: TranscriptionService;
  private apiUrl: string;

  private constructor() {
    this.apiUrl = env.speechToTextApiUrl;
  }

  static getInstance(): TranscriptionService {
    if (!TranscriptionService.instance) {
      TranscriptionService.instance = new TranscriptionService();
    }
    return TranscriptionService.instance;
  }

  /**
   * Transcribe audio from base64 string
   */
  async transcribeAudio(
    audioBase64: string,
    filename?: string
  ): Promise<TranscriptionResponse> {
    const url = `${this.apiUrl}/transcribe`;
    
    const requestBody: TranscriptionRequest = {
      audio_base64: audioBase64,
      filename: filename || 'audio.wav'
    };

    console.log('🎤 Transcribing audio...');
    console.log('API URL:', url);
    console.log('Filename:', filename);
    console.log('Audio size:', audioBase64.length, 'characters');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: TranscriptionError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        console.error('❌ Transcription API error:', errorData);
        throw new Error(errorData.detail || errorData.error || 'Transcription failed');
      }

      const result: TranscriptionResponse = await response.json();
      
      console.log('✅ Transcription successful:');
      console.log('Text:', result.transcription.text);
      console.log('Language:', result.transcription.language);
      console.log('Confidence:', result.transcription.confidence);

      return result;

    } catch (error) {
      console.error('❌ Error calling transcription API:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to transcription service at ${url}. Make sure the API is running.`);
      }
      
      throw error;
    }
  }

  /**
   * Convert Uint8Array to base64 string
   */
  arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  /**
   * Transcribe audio from Uint8Array
   */
  async transcribeFromUint8Array(
    audioData: Uint8Array,
    filename?: string
  ): Promise<TranscriptionResponse> {
    const base64Audio = this.arrayBufferToBase64(audioData);
    return this.transcribeAudio(base64Audio, filename);
  }
}

export default TranscriptionService.getInstance();
