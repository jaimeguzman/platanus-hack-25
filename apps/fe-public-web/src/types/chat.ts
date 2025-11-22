export enum MessageType {
  Text = 'text',
  Audio = 'audio'
}

export enum MessageStatus {
  Sending = 'sending',
  Sent = 'sent',
  Error = 'error'
}

export interface Message {
  id: string;
  type: MessageType;
  text?: string;
  audioData?: Uint8Array;
  audioFileName?: string;
  audioDuration?: number; // in milliseconds
  audioMimeType?: string; // Tipo MIME del audio
  timestamp: Date;
  status: MessageStatus;
  audioBlobUrl?: string; // Para reproducción directa
}

export interface ChatPayload {
  id: string;
  type: string;
  text?: string;
  audioFileName?: string;
  audioDuration?: number;
  audioBase64?: string;
  audioSize?: number;
  timestamp: string;
}
