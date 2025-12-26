import React, { useRef, useState, useEffect } from 'react';
import { InputMode, ExplanationLevel } from '../types';
import { Camera, Mic, Type, Image as ImageIcon, Square, GraduationCap } from 'lucide-react';

interface InputSectionProps {
  mode: InputMode;
  setMode: (mode: InputMode) => void;
  explanationLevel: ExplanationLevel;
  setExplanationLevel: (level: ExplanationLevel) => void;
  onTextSubmit: (text: string) => void;
  onImageSubmit: (file: File) => void;
  onAudioSubmit: (blob: Blob) => void;
  isProcessing: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({
  mode,
  setMode,
  explanationLevel,
  setExplanationLevel,
  onTextSubmit,
  onImageSubmit,
  onAudioSubmit,
  isProcessing
}) => {
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Audio Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Prefer standard webm
      const options = MediaRecorder.isTypeSupported('audio/webm') 
        ? { mimeType: 'audio/webm' } 
        : undefined;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: mimeType });
        
        // Safety check for empty audio
        if (audioBlob.size < 100) {
          alert("Audio was too short or empty. Please try again.");
          return;
        }
        
        onAudioSubmit(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Mic access denied", err);
      alert("Microphone permission is required to use voice input.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSubmit(e.target.files[0]);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tab Selector */}
      <div className="flex border-b border-slate-100">
        {[
          { id: InputMode.TEXT, icon: Type, label: 'Text' },
          { id: InputMode.IMAGE, icon: ImageIcon, label: 'Image' },
          { id: InputMode.AUDIO, icon: Mic, label: 'Voice' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            disabled={isProcessing || isRecording}
            className={`
              flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors
              ${mode === tab.id 
                ? 'text-brand-600 bg-brand-50 border-b-2 border-brand-600' 
                : 'text-slate-500 hover:bg-slate-50'}
              ${(isProcessing || isRecording) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Explanation Level Toggle */}
        <div className="flex items-center justify-between mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
             <GraduationCap size={18} />
             Explanation Mode
          </div>
          <div className="flex bg-white rounded-md p-1 border border-slate-200 shadow-sm">
            {(['Beginner', 'Advanced'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setExplanationLevel(level)}
                disabled={isProcessing || isRecording}
                className={`
                  px-4 py-1.5 text-xs font-semibold rounded transition-all
                  ${explanationLevel === level 
                    ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200' 
                    : 'text-slate-500 hover:bg-slate-50'}
                `}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {mode === InputMode.TEXT && (
          <div className="flex gap-2">
            <textarea
              className="flex-1 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 min-h-[100px] resize-none"
              placeholder="Type your math problem here (e.g., 'Find the derivative of x^2 log x')..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={isProcessing}
            />
            <button
              onClick={() => onTextSubmit(textInput)}
              disabled={!textInput.trim() || isProcessing}
              className="px-6 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors self-end h-[100px]"
            >
              Solve
            </button>
          </div>
        )}

        {mode === InputMode.IMAGE && (
          <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors relative">
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={isProcessing}
            />
            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <div className="p-4 bg-white rounded-full shadow-sm">
                <Camera className="text-brand-500" size={32} />
              </div>
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-brand-600">Click to upload</span> or drag and drop
              </div>
              <p className="text-xs text-slate-400">JPG, PNG (Max 5MB)</p>
            </div>
          </div>
        )}

        {mode === InputMode.AUDIO && (
          <div className="flex flex-col items-center justify-center py-10 gap-8">
            <div className="relative group">
               {isRecording && (
                 <div className="absolute inset-0 rounded-full animate-ping bg-brand-400 opacity-20"></div>
               )}
               <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`
                  relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300
                  ${isRecording 
                    ? 'bg-red-500 text-white hover:bg-red-600 scale-110' 
                    : 'bg-gradient-to-br from-brand-500 to-brand-700 text-white hover:scale-105 hover:shadow-brand-200'}
                  ${isProcessing ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                `}
              >
                {isRecording ? <Square size={28} fill="currentColor" /> : <Mic size={32} />}
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-2 h-16 w-full">
              {isRecording ? (
                <>
                  <div className="text-3xl font-mono font-bold text-slate-700 tracking-wider">
                    {formatTime(recordingDuration)}
                  </div>
                  {/* Simulated Visualizer */}
                  <div className="flex items-center gap-1.5 h-6">
                     {[...Array(7)].map((_, i) => (
                       <div 
                         key={i} 
                         className="w-1.5 bg-brand-500 rounded-full animate-pulse"
                         style={{ 
                           height: `${30 + (Math.sin(i * 1.5 + Date.now()) * 50 + 50) % 70}%`, // Static random visual for CSS
                           animationDelay: `${i * 0.1}s`,
                           animationDuration: '0.6s'
                         }}
                       />
                     ))}
                  </div>
                  <p className="text-xs text-brand-600 font-medium animate-pulse mt-1">Listening...</p>
                </>
              ) : (
                <>
                  <p className="text-slate-500 font-medium">Tap microphone to state your problem</p>
                  <p className="text-xs text-slate-400">Supported: English, Hindi (Mixed)</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputSection;