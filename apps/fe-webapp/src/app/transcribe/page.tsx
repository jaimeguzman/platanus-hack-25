'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, CheckCircle, XCircle, Mic, Square } from 'lucide-react';

export default function TranscribePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('es');

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isRecordingSupported, setIsRecordingSupported] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setTranscription('');
    }
  };

  const handleTranscribe = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo de audio');
      return;
    }

    setIsTranscribing(true);
    setError('');
    setTranscription('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/speech-to-text`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error en la transcripción');
      }

      const data = await response.json();
      setTranscription(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      // Check if we're in the browser and mediaDevices is available
      if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('La grabación de audio no está disponible en este navegador.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);

        // Create file from blob
        const audioFile = new File([blob], `recording-${Date.now()}.webm`, {
          type: 'audio/webm'
        });
        setFile(audioFile);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setError('');
      setAudioURL(null);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      setError('No se pudo acceder al micrófono. Verifica los permisos.');
      console.error('Error accessing microphone:', err);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Check if recording is supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      setIsRecordingSupported(supported);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2 flex items-center gap-3">
            <Mic className="w-8 h-8 text-muted-foreground" />
            Speech-to-Text Demo
          </h1>
          <p className="text-muted-foreground font-light">
            Sube un archivo de audio y obtén la transcripción usando OpenAI Whisper
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-card border border-border rounded-xl p-8 mb-6">
          {/* Recording Section */}
          {isRecordingSupported && (
            <div className="mb-6">
              <label className="block text-sm font-light text-muted-foreground mb-3">
                Grabar audio
              </label>

              {!isRecording && !audioURL && (
                <button
                  onClick={startRecording}
                  className="w-full p-6 border-2 border-dashed border-border rounded-lg hover:border-accent transition-all duration-200 flex items-center justify-center gap-3 group"
                >
                  <Mic className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="text-muted-foreground font-light">
                    Presiona para grabar desde tu micrófono
                  </span>
                </button>
              )}

            {isRecording && (
              <div className="p-6 bg-muted rounded-lg border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-foreground font-light">Grabando...</span>
                  </div>
                  <span className="text-2xl font-light text-foreground font-mono">
                    {formatTime(recordingTime)}
                  </span>
                </div>
                <button
                  onClick={stopRecording}
                  className="w-full px-6 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-light rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Square className="w-5 h-5" />
                  Detener grabación
                </button>
              </div>
            )}

            {audioURL && (
              <div className="p-4 bg-card rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-accent-foreground" />
                  <span className="text-foreground font-light">Audio grabado</span>
                </div>
                <audio controls className="w-full mb-3" src={audioURL}>
                  Tu navegador no soporta el elemento de audio.
                </audio>
                <button
                  onClick={() => {
                    setAudioURL(null);
                    setFile(null);
                    setRecordingTime(0);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Grabar de nuevo
                </button>
              </div>
            )}
            </div>
          )}

          {isRecordingSupported && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-card text-muted-foreground">O</span>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-light text-muted-foreground mb-3">
              Seleccionar archivo de audio
            </label>
            <div className="relative">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
                id="audio-upload"
              />
              <label
                htmlFor="audio-upload"
                className="flex items-center justify-center w-full p-8 border-2 border-dashed border-border rounded-lg hover:border-accent transition-all duration-200 cursor-pointer group"
              >
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <p className="text-muted-foreground font-light">
                    Click para seleccionar un archivo
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    MP3, WAV, M4A, FLAC, OGG, WEBM (Máx. 25MB)
                  </p>
                </div>
              </label>
            </div>

            {file && (
              <div className="mt-4 p-4 bg-card rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent-foreground" />
                    <div>
                      <p className="text-foreground font-light">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Language Selection */}
          <div className="mb-6">
            <label className="block text-sm font-light text-muted-foreground mb-3">
              Idioma del audio (opcional)
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground font-light focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
            >
              <option value="">Auto-detectar</option>
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
              <option value="pt">Português</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
            </select>
          </div>

          {/* Transcribe Button */}
          <button
            onClick={handleTranscribe}
            disabled={!file || isTranscribing}
            className="w-full px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-light rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Transcribiendo...
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Transcribir Audio
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/20 border border-destructive rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-destructive font-light">{error}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Asegúrate de que la API esté corriendo en {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transcription Result */}
        {transcription && (
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-accent-foreground" />
              <h2 className="text-xl font-light text-foreground">Transcripción</h2>
            </div>

            <div className="bg-muted border border-border rounded-lg p-6">
              <p className="text-foreground font-light leading-relaxed whitespace-pre-wrap">
                {transcription}
              </p>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(transcription)}
                className="px-4 py-2 bg-card hover:bg-muted border border-border rounded-lg text-sm font-light transition-colors"
              >
                Copiar texto
              </button>
              <button
                onClick={() => {
                  setTranscription('');
                  setFile(null);
                }}
                className="px-4 py-2 bg-card hover:bg-muted border border-border rounded-lg text-sm font-light transition-colors"
              >
                Nueva transcripción
              </button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 p-6 bg-card border border-border rounded-xl">
          <h3 className="text-lg font-light mb-3 text-foreground">Información</h3>
          <ul className="space-y-2 text-sm text-muted-foreground font-light">
            <li>• Formatos soportados: MP3, WAV, M4A, FLAC, OGG, WEBM</li>
            <li>• Tamaño máximo: 25MB</li>
            <li>• Motor: OpenAI Whisper</li>
            <li>• Idiomas soportados: Más de 50 idiomas</li>
            <li>• API Endpoint: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
