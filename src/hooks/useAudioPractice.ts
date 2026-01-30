"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// TTS Provider types
export type TTSProvider = "elevenlabs" | "openai";

interface UseAudioPracticeOptions {
  onTranscription?: (text: string) => void;
  onError?: (error: string) => void;
  onPlaybackEnd?: () => void; // Called when AI voice finishes playing
  silenceTimeout?: number; // Auto-stop after silence (ms)
  silenceThreshold?: number; // Audio level threshold for silence detection (0-1)
  ttsProvider?: TTSProvider; // Choose TTS provider (default: elevenlabs)
}

interface UseAudioPracticeReturn {
  // Recording state
  isRecording: boolean;
  isTranscribing: boolean;
  recordingTime: number;

  // Playback state
  isPlaying: boolean;
  isSpeaking: boolean;

  // Hands-free mode
  handsFreeMode: boolean;
  setHandsFreeMode: (enabled: boolean) => void;

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  playAudio: (text: string, personaId?: string) => Promise<void>;
  stopAudio: () => void;

  // Audio level for visualizations
  audioLevel: number;

  // Error state
  error: string | null;
  clearError: () => void;

  // Permissions
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useAudioPractice(options: UseAudioPracticeOptions = {}): UseAudioPracticeReturn {
  const {
    onTranscription,
    onError,
    onPlaybackEnd,
    silenceTimeout = 1500, // 1.5 seconds of silence to auto-stop
    silenceThreshold = 0.015, // Audio level below this = silence
    ttsProvider = "openai"
  } = options;

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Hands-free mode
  const [handsFreeMode, setHandsFreeMode] = useState(false);

  // Permission state
  const [hasPermission, setHasPermission] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);
  const handsFreeModeRef = useRef(false);
  const hasSpokenRef = useRef(false); // Track if user has started speaking
  const stopRecordingRef = useRef<(() => Promise<string | null>) | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    handsFreeModeRef.current = handsFreeMode;
  }, [handsFreeMode]);

  // Check for browser support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      if (!supported) {
        setError("Audio recording is not supported in this browser");
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      return true;
    } catch (err) {
      setHasPermission(false);
      const message = err instanceof Error ? err.message : "Failed to get microphone permission";
      setError(message);
      onError?.(message);
      return false;
    }
  }, [onError]);

  // Monitor audio levels with silence detection
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isRecordingRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average level
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const normalizedLevel = average / 255;
    setAudioLevel(normalizedLevel);

    // Track if user has started speaking (level above threshold)
    if (normalizedLevel > silenceThreshold * 2) {
      hasSpokenRef.current = true;
    }

    // Check for silence ONLY if user has spoken and hands-free mode is on
    if (handsFreeModeRef.current && hasSpokenRef.current && normalizedLevel < silenceThreshold) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          // Auto-stop recording after silence
          if (isRecordingRef.current && stopRecordingRef.current) {
            console.log("Auto-stopping due to silence...");
            stopRecordingRef.current();
          }
          silenceTimerRef.current = null;
        }, silenceTimeout);
      }
    } else {
      // User is speaking, clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }

    if (isRecordingRef.current) {
      animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  }, [silenceTimeout, silenceThreshold]);

  // Stop recording and transcribe - defined before startRecording
  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecordingRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        // Stop level monitoring
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        // Clear silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        setIsRecording(false);
        isRecordingRef.current = false;
        setAudioLevel(0);
        hasSpokenRef.current = false;

        // Create blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        // Only transcribe if we have meaningful audio (more than 0.5 second of recording)
        if (audioChunksRef.current.length < 3) {
          resolve(null);
          return;
        }

        // Transcribe
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const response = await fetch("/api/ai/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Transcription failed");
          }

          const data = await response.json();
          const transcription = data.text || "";

          if (transcription.trim()) {
            onTranscription?.(transcription);
          }
          resolve(transcription);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Transcription failed";
          setError(message);
          onError?.(message);
          resolve(null);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current.stop();
    });
  }, [onTranscription, onError]);

  // Store stopRecording in ref so monitorAudioLevel can access it
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  // Start recording
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      hasSpokenRef.current = false;

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;
      setHasPermission(true);

      // Set up audio analysis for level monitoring
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Set up media recorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start(100);
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start level monitoring
      monitorAudioLevel();

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start recording";
      setError(message);
      onError?.(message);
    }
  }, [monitorAudioLevel, onError]);

  // Play TTS audio
  const playAudio = useCallback(async (text: string, personaId?: string): Promise<void> => {
    try {
      setError(null);
      setIsSpeaking(true);

      const response = await fetch("/api/ai/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          personaId,
          provider: ttsProvider,
        }),
      });

      if (!response.ok) {
        throw new Error("Text-to-speech failed");
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(audioUrl);
      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        // Notify that playback ended (for hands-free auto-start)
        onPlaybackEnd?.();
      };
      audioRef.current.onerror = () => {
        setIsPlaying(false);
        setIsSpeaking(false);
        setError("Failed to play audio");
        URL.revokeObjectURL(audioUrl);
      };

      await audioRef.current.play();

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to play audio";
      setError(message);
      setIsSpeaking(false);
      onError?.(message);
    }
  }, [onError, ttsProvider, onPlaybackEnd]);

  // Stop audio playback
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsSpeaking(false);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Recording
    isRecording,
    isTranscribing,
    recordingTime,

    // Playback
    isPlaying,
    isSpeaking,

    // Hands-free mode
    handsFreeMode,
    setHandsFreeMode,

    // Actions
    startRecording,
    stopRecording,
    playAudio,
    stopAudio,

    // Audio level
    audioLevel,

    // Error
    error,
    clearError,

    // Permission
    hasPermission,
    requestPermission,
  };
}
