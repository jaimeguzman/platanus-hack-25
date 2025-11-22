'use client';

import { Message, MessageType, MessageStatus, ChatPayload } from '@/types/chat';
import { env } from '@/config/env';

class ChatService {
  private static instance: ChatService;
  private messages: Message[] = [];
  private apiBaseUrl: string | null = null;
  private onMessagesChange?: () => void;

  private constructor() {
    // Initialize with speech-to-text API URL
    this.apiBaseUrl = env.speechToTextApiUrl;
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  setApiUrl(url: string) {
    this.apiBaseUrl = url;
  }

  setOnMessagesChange(callback: () => void) {
    this.onMessagesChange = callback;
  }

  private notifyChange() {
    if (this.onMessagesChange) {
      this.onMessagesChange();
    }
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  async sendTextMessage(text: string): Promise<Message> {
    const message: Message = {
      id: crypto.randomUUID(),
      type: MessageType.Text,
      text,
      timestamp: new Date(),
      status: MessageStatus.Sending,
    };

    this.messages.push(message);

    try {
      await this.sendToApi(message);
      message.status = MessageStatus.Sent;
    } catch (error) {
      message.status = MessageStatus.Error;
    }

    return message;
  }

  async sendAudioMessage(
    audioData: Uint8Array,
    fileName: string,
    duration: number,
    blobUrl?: string,
    mimeType?: string
  ): Promise<Message> {
    const message: Message = {
      id: crypto.randomUUID(),
      type: MessageType.Audio,
      audioData,
      audioFileName: fileName,
      audioDuration: duration,
      audioMimeType: mimeType,
      audioBlobUrl: blobUrl,
      timestamp: new Date(),
      status: MessageStatus.Sending,
    };

    this.messages.push(message);

    try {
      await this.sendToApi(message);
      // Status is updated inside sendAudioToTranscriptionApi
    } catch (error) {
      message.status = MessageStatus.Error;
      if (error instanceof Error) {
        message.errorMessage = error.message;
      }
    }

    return message;
  }

  private async sendToApi(message: Message): Promise<void> {
    // For audio messages, send to transcription API
    if (message.type === MessageType.Audio && message.audioData) {
      await this.sendAudioToTranscriptionApi(message);
      return;
    }

    // For text messages, just log for now
    if (message.type === MessageType.Text) {
      console.log('📝 Text message:', message.text);
      message.status = MessageStatus.Sent;
      return;
    }
  }

  private async sendAudioToTranscriptionApi(message: Message): Promise<void> {
    if (!message.audioData) {
      throw new Error('No audio data available');
    }

    // Update status to transcribing at the start
    message.status = MessageStatus.Transcribing;
    this.notifyChange();

    const audioBase64 = this.arrayBufferToBase64(message.audioData);
    
    // Prepare transcription request payload
    const transcriptionPayload = {
      audio_base64: audioBase64,
      filename: message.audioFileName || 'audio.webm',
      category: 'chat_audio',
      source: 'web_chat'
    };

    // Log the request for debugging
    console.log('═══════════════════════════════════════════');
    console.log('🎤 TRANSCRIPTION API REQUEST');
    console.log('═══════════════════════════════════════════');
    console.log('URL:', `${this.apiBaseUrl}/transcribe`);
    console.log('Payload:', {
      ...transcriptionPayload,
      audio_base64: `${audioBase64.substring(0, 50)}... (${audioBase64.length} chars)`
    });
    console.log('═══════════════════════════════════════════');

    if (!this.apiBaseUrl) {
      message.status = MessageStatus.Error;
      message.errorMessage = 'Speech-to-text API URL not configured';
      this.notifyChange();
      throw new Error('Speech-to-text API URL not configured');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transcriptionPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        message.status = MessageStatus.Error;
        message.errorMessage = `API Error: ${response.status} - ${errorText}`;
        this.notifyChange();
        throw new Error(`Transcription API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Log the successful response
      console.log('✅ TRANSCRIPTION SUCCESS');
      console.log('Transcription result:', result.transcription);
      console.log('Memory stored:', result.memory);
      
      // Update message with transcription result and mark as sent
      if (result.transcription?.text) {
        message.transcriptionText = result.transcription.text;
      }
      
      // Mark as successfully sent only after getting the transcription
      message.status = MessageStatus.Sent;
      this.notifyChange();
      
    } catch (error) {
      console.error('❌ TRANSCRIPTION ERROR:', error);
      message.status = MessageStatus.Error;
      if (error instanceof Error) {
        message.errorMessage = error.message;
      } else {
        message.errorMessage = 'Unknown transcription error';
      }
      this.notifyChange();
      throw error;
    }
  }

  async retryMessage(messageId: string): Promise<void> {
    const message = this.messages.find(m => m.id === messageId);
    if (!message) return;

    message.status = MessageStatus.Sending;

    try {
      await this.sendToApi(message);
      message.status = MessageStatus.Sent;
    } catch (error) {
      message.status = MessageStatus.Error;
    }
  }

  clearMessages() {
    this.messages = [];
  }

  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }
}

export default ChatService.getInstance();
