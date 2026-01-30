"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseRealtimeVoiceOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAIResponse?: (text: string) => void;
  onError?: (error: string) => void;
  systemPrompt?: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
}

interface UseRealtimeVoiceReturn {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  userTranscript: string;
  aiTranscript: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
}

export function useRealtimeVoice(options: UseRealtimeVoiceOptions = {}): UseRealtimeVoiceReturn {
  const {
    onTranscript,
    onAIResponse,
    onError,
    systemPrompt = "You are a helpful sales prospect for practice. Respond naturally and conversationally.",
    voice = "nova"
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  // Convert Float32Array to Int16Array (PCM16)
  const floatTo16BitPCM = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  };

  // Convert Int16Array to base64
  const int16ToBase64 = (int16Array: Int16Array): string => {
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  };

  // Convert base64 to Int16Array
  const base64ToInt16 = (base64: string): Int16Array => {
    const binary = atob(base64);
    const uint8Array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      uint8Array[i] = binary.charCodeAt(i);
    }
    return new Int16Array(uint8Array.buffer);
  };

  // Play audio from queue
  const playAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || playbackQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    setIsSpeaking(true);

    const audioContext = audioContextRef.current || new AudioContext({ sampleRate: 24000 });
    if (!audioContextRef.current) audioContextRef.current = audioContext;

    while (playbackQueueRef.current.length > 0) {
      const audioData = playbackQueueRef.current.shift()!;

      // Convert Int16 to Float32
      const float32Array = new Float32Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        float32Array[i] = audioData[i] / 32768;
      }

      const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      await new Promise<void>((resolve) => {
        source.onended = () => resolve();
        source.start();
      });
    }

    isPlayingRef.current = false;
    setIsSpeaking(false);
  }, []);

  // Handle WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "session.created":
          console.log("[Realtime] Session created");
          break;

        case "session.updated":
          console.log("[Realtime] Session updated");
          break;

        case "input_audio_buffer.speech_started":
          console.log("[Realtime] User started speaking");
          break;

        case "input_audio_buffer.speech_stopped":
          console.log("[Realtime] User stopped speaking");
          break;

        case "conversation.item.input_audio_transcription.completed":
          const userText = data.transcript || "";
          setUserTranscript(userText);
          onTranscript?.(userText, true);
          break;

        case "response.audio_transcript.delta":
          const aiDelta = data.delta || "";
          setAiTranscript(prev => prev + aiDelta);
          break;

        case "response.audio_transcript.done":
          const fullAiText = data.transcript || "";
          setAiTranscript(fullAiText);
          onAIResponse?.(fullAiText);
          break;

        case "response.audio.delta":
          // Queue audio for playback
          if (data.delta) {
            const audioData = base64ToInt16(data.delta);
            playbackQueueRef.current.push(audioData);
            playAudioQueue();
          }
          break;

        case "response.audio.done":
          console.log("[Realtime] AI audio complete");
          break;

        case "response.done":
          console.log("[Realtime] Response complete");
          setAiTranscript("");
          break;

        case "error":
          console.error("[Realtime] Error:", JSON.stringify(data, null, 2));
          const errorMsg = data.error?.message || data.message || "Unknown error";
          const errorCode = data.error?.code || data.code || "";
          const fullError = errorCode ? `${errorCode}: ${errorMsg}` : errorMsg;
          setError(fullError);
          onError?.(fullError);
          break;
      }
    } catch (err) {
      console.error("[Realtime] Failed to parse message:", err);
    }
  }, [onTranscript, onAIResponse, onError, playAudioQueue]);

  // Connect to OpenAI Realtime API
  const connect = useCallback(async () => {
    try {
      setError(null);

      // Get ephemeral token from our API
      const tokenResponse = await fetch("/api/ai/realtime-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice, model: "gpt-4o-realtime-preview-2024-12-17" }),
      });
      if (!tokenResponse.ok) {
        throw new Error("Failed to get realtime token");
      }
      const tokenData = await tokenResponse.json();
      const token = tokenData.token;
      console.log("[Realtime] Token type:", tokenData.type);

      // Connect to OpenAI Realtime API (using latest model)
      const ws = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
        ["realtime", `openai-insecure-api-key.${token}`]
      );

      ws.onopen = () => {
        console.log("[Realtime] Connected");
        setIsConnected(true);

        // Configure session with latest API format
        const sessionConfig = {
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            instructions: systemPrompt,
            voice: voice,
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            }
          }
        };
        console.log("[Realtime] Sending session config:", JSON.stringify(sessionConfig));
        ws.send(JSON.stringify(sessionConfig));
      };

      ws.onmessage = handleMessage;

      ws.onerror = (err) => {
        console.error("[Realtime] WebSocket error:", err);
        setError("Connection error");
        onError?.("Connection error");
      };

      ws.onclose = () => {
        console.log("[Realtime] Disconnected");
        setIsConnected(false);
        setIsListening(false);
      };

      wsRef.current = ws;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      setError(message);
      onError?.(message);
    }
  }, [systemPrompt, voice, handleMessage, onError]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    setIsConnected(false);
    setIsListening(false);
  }, []);

  // Start listening (send audio to API)
  const startListening = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("Not connected");
      return;
    }

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      streamRef.current = stream;

      // Create audio context and processor
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = floatTo16BitPCM(inputData);
          const base64Audio = int16ToBase64(pcm16);

          wsRef.current.send(JSON.stringify({
            type: "input_audio_buffer.append",
            audio: base64Audio
          }));
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsListening(true);
      setUserTranscript("");

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start listening";
      setError(message);
      onError?.(message);
    }
  }, [onError]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [disconnect]);

  return {
    isConnected,
    isListening,
    isSpeaking,
    userTranscript,
    aiTranscript,
    connect,
    disconnect,
    startListening,
    stopListening,
    error
  };
}
