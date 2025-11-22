'use client';

import { Message, MessageType, MessageStatus, ChatPayload } from '@/types/chat';

class ChatService {
  private static instance: ChatService;
  private messages: Message[] = [];
  private apiBaseUrl: string | null = null;

  private constructor() {}

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  setApiUrl(url: string) {
    this.apiBaseUrl = url;
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
      message.status = MessageStatus.Sent;
    } catch (error) {
      message.status = MessageStatus.Error;
    }

    return message;
  }

  private async sendToApi(message: Message): Promise<void> {
    // Construir el payload
    const payload: ChatPayload = {
      id: message.id,
      type: message.type,
      text: message.text,
      audioFileName: message.audioFileName,
      audioDuration: message.audioDuration,
      audioBase64: message.audioData
        ? this.arrayBufferToBase64(message.audioData)
        : undefined,
      audioSize: message.audioData?.length,
      timestamp: message.timestamp.toISOString(),
    };

    // Imprimir el request en consola
    console.log('═══════════════════════════════════════════');
    console.log('📤 API REQUEST');
    console.log('═══════════════════════════════════════════');
    console.log('URL:', this.apiBaseUrl ?? 'No configurada');
    console.log('Payload:');

    // Imprimir JSON formateado (sin el audio base64 completo para legibilidad)
    const payloadForLog = { ...payload };
    if (payloadForLog.audioBase64) {
      const audioBase64 = payloadForLog.audioBase64;
      payloadForLog.audioBase64 = `${audioBase64.substring(0, 50)}... (${audioBase64.length} chars)`;
    }
    console.log(JSON.stringify(payloadForLog, null, 2));
    console.log('═══════════════════════════════════════════');

    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!this.apiBaseUrl) {
      // API no configurada, solo guardamos en memoria
      return;
    }

    // TODO: Implementar llamada real al API cuando esté disponible
    // const response = await fetch(this.apiBaseUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(payload),
    // });
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
