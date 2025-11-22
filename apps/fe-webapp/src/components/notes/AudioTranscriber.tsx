'use client';

import React, { useState, useRef } from 'react';
import { usePKMStore } from '@/stores/pkmStore';
import { Mic, Square, Upload, FileAudio, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AudioTranscriber: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { addNote } = usePKMStore();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioBlob(file);
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;
    
    setIsTranscribing(true);
    
    // Simulate transcription (in a real app, you'd call an AI API)
    setTimeout(() => {
      const mockTranscription = `This is a simulated transcription of your audio recording. 

In a real implementation, this would use AI services like:
- OpenAI Whisper API
- Google Cloud Speech-to-Text
- Azure Speech Services
- Web Speech API (browser native)

The transcription would capture your thoughts, ideas, and notes that you can then organize and connect with other notes in your knowledge base.`;
      
      setTranscription(mockTranscription);
      setIsTranscribing(false);
    }, 3000);
  };

  const saveAsNote = () => {
    if (transcription.trim()) {
      addNote({
        title: `Audio Note - ${new Date().toLocaleString()}`,
        content: transcription,
        tags: ['audio', 'transcription'],
        projectId: undefined
      });
      
      // Reset form
      setAudioBlob(null);
      setTranscription('');
      
      alert('Note created successfully!');
    }
  };

  return (
    <div className="bg-[#1A1A1A] rounded-lg p-8 max-w-2xl mx-auto border border-[#2A2A2A]">
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-2 flex items-center text-[#EEEEEE] tracking-tight">
          <FileAudio className="w-6 h-6 mr-3 text-[#EEEEEE]" />
          Audio Transcription
        </h3>
        <p className="text-sm text-[#999999] ml-9">Record or upload audio to transcribe into notes</p>
      </div>
      
      {/* Recording Controls */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="flex items-center gap-2 px-6 py-3 h-auto bg-[#2A2A2A] hover:bg-[#3A3A3A] text-[#EEEEEE] font-medium transition-colors"
            >
              <Mic className="w-5 h-5" />
              <span>Start Recording</span>
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              className="flex items-center gap-2 px-6 py-3 h-auto bg-[#FF6B35] hover:bg-[#FF7B45] text-white font-medium transition-colors animate-pulse"
            >
              <Square className="w-5 h-5" />
              <span>Stop Recording</span>
            </Button>
          )}
          
          <label className="flex items-center gap-2 px-6 py-3 h-auto bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg text-[#EEEEEE] cursor-pointer transition-colors font-medium">
            <Upload className="w-5 h-5" />
            <span>Upload Audio</span>
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              className="hidden"
            />
          </label>
        </div>
        
        {audioBlob && (
          <div className="bg-[#111111] p-6 rounded-lg border border-[#2A2A2A] space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#EEEEEE]">Audio file ready</p>
              <p className="text-xs text-[#999999]">{Math.round(audioBlob.size / 1024)}KB</p>
            </div>
            <audio controls className="w-full">
              <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
            </audio>
            <Button
              onClick={transcribeAudio}
              disabled={isTranscribing}
              className="w-full px-6 py-3 h-auto bg-[#2A2A2A] hover:bg-[#3A3A3A] disabled:bg-[#1A1A1A] disabled:opacity-50 text-[#EEEEEE] font-medium transition-colors"
            >
              {isTranscribing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Transcribing...
                </span>
              ) : (
                'Transcribe Audio'
              )}
            </Button>
          </div>
        )}
      </div>
      
      {/* Transcription Result */}
      {transcription && (
        <div className="mb-8 space-y-4">
          <div>
            <h4 className="text-base font-semibold mb-3 text-[#EEEEEE]">Transcription</h4>
            <textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              className="w-full min-h-[200px] p-4 bg-[#111111] border border-[#2A2A2A] rounded-lg text-[#EEEEEE] text-sm leading-relaxed resize-none focus:outline-none focus:border-[#4A5560] focus:ring-2 focus:ring-[#4A5560]/20 placeholder:text-[#666666] transition-all"
              placeholder="Transcription will appear here..."
            />
          </div>
          <Button
            onClick={saveAsNote}
            className="w-full px-6 py-3 h-auto bg-[#2A2A2A] hover:bg-[#3A3A3A] text-[#EEEEEE] font-medium transition-colors"
          >
            Save as Note
          </Button>
        </div>
      )}
      
      {/* Instructions */}
      <div className="pt-6 border-t border-[#2A2A2A]">
        <p className="text-sm text-[#999999] leading-relaxed">
          <span className="font-medium text-[#EEEEEE]">Tip:</span> Click "Start Recording" to record your voice, or upload an existing audio file. Edit the transcription and save as a note to add it to your knowledge base.
        </p>
      </div>
    </div>
  );
};

export default AudioTranscriber;
