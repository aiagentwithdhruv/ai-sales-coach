"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseRealtimeVoiceOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAIResponse?: (text: string) => void;
  onError?: (error: string) => void;
  systemPrompt?: string;
  voice?: "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse";
  attachments?: {
    type: "pdf" | "image" | "url";
    name: string;
    content?: string;
    url?: string;
  }[];
  trainingFocus?: string;
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
    voice = "alloy",
    attachments = [],
    trainingFocus
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

    console.log("[Realtime] 🔊 Starting audio playback, queue size:", playbackQueueRef.current.length);
    isPlayingRef.current = true;
    setIsSpeaking(true);

    try {
      const audioContext = audioContextRef.current || new AudioContext({ sampleRate: 24000 });
      if (!audioContextRef.current) audioContextRef.current = audioContext;
      
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        console.log("[Realtime] 🔊 Resuming suspended audio context");
        await audioContext.resume();
      }

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
      console.log("[Realtime] 🔊 Audio playback complete");
    } catch (err) {
      console.error("[Realtime] Audio playback error:", err);
    }

    isPlayingRef.current = false;
    setIsSpeaking(false);
  }, []);

  // Handle WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // Log all events for debugging
      if (!data.type?.includes("audio.delta") && !data.type?.includes("output_audio.delta")) {
        console.log("[Realtime] Event:", data.type, data);
      }

      switch (data.type) {
        case "session.created":
          console.log("[Realtime] Session created successfully");
          break;

        case "session.updated":
          console.log("[Realtime] Session configured");
          break;

        case "input_audio_buffer.speech_started":
          console.log("[Realtime] 🎤 User started speaking");
          break;

        case "input_audio_buffer.speech_stopped":
          console.log("[Realtime] 🎤 User stopped speaking");
          break;

        case "input_audio_buffer.committed":
          console.log("[Realtime] Audio buffer committed");
          break;

        case "conversation.item.created":
        case "conversation.item.added":
          console.log("[Realtime] Conversation item added");
          break;

        case "conversation.item.done":
          console.log("[Realtime] Conversation item done");
          break;

        case "conversation.item.input_audio_transcription.completed":
          const userText = data.transcript || "";
          console.log("[Realtime] 📝 User said:", userText);
          setUserTranscript(userText);
          onTranscript?.(userText, true);
          break;

        case "response.created":
          console.log("[Realtime] 🤖 AI response started");
          break;

        case "response.output_item.added":
          console.log("[Realtime] Response output item added");
          break;

        case "response.audio_transcript.delta":
        case "response.output_audio_transcript.delta":
          const aiDelta = data.delta || "";
          setAiTranscript(prev => prev + aiDelta);
          break;

        case "response.audio_transcript.done":
        case "response.output_audio_transcript.done":
          const fullAiText = data.transcript || "";
          console.log("[Realtime] 🤖 AI said:", fullAiText);
          setAiTranscript(fullAiText);
          onAIResponse?.(fullAiText);
          break;

        case "response.audio.delta":
        case "response.output_audio.delta":
          // Queue audio for playback
          if (data.delta) {
            console.log("[Realtime] 🔊 Received audio chunk, length:", data.delta.length);
            try {
              const audioData = base64ToInt16(data.delta);
              console.log("[Realtime] 🔊 Decoded audio samples:", audioData.length);
              playbackQueueRef.current.push(audioData);
              playAudioQueue();
            } catch (err) {
              console.error("[Realtime] Audio decode error:", err);
            }
          }
          break;

        case "response.audio.done":
        case "response.output_audio.done":
          console.log("[Realtime] AI audio complete");
          break;

        case "response.output_text.delta":
          if (data.delta) {
            setAiTranscript(prev => prev + data.delta);
          }
          break;

        case "response.output_text.done":
          if (data.text) {
            setAiTranscript(data.text);
            onAIResponse?.(data.text);
          }
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
          
        default:
          // Log unknown events
          console.log("[Realtime] Unknown event:", data.type);
      }
    } catch (err) {
      console.error("[Realtime] Failed to parse message:", err);
    }
  }, [onTranscript, onAIResponse, onError, playAudioQueue]);

  // Connect to OpenAI Realtime API
  const connect = useCallback(async () => {
    try {
      setError(null);

      // Get ephemeral token from our API with session config
      const tokenResponse = await fetch("/api/ai/realtime-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          voice,
          instructions: systemPrompt,
          trainingFocus,
          attachments: attachments.length > 0 ? attachments : undefined
        }),
      });
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        const errorMsg = errorData.error || errorData.details || "Failed to get realtime token";
        throw new Error(errorMsg);
      }
      const tokenData = await tokenResponse.json();
      const token = tokenData.token;
      const model = tokenData.model || "gpt-4o-realtime-preview-2024-12-17";
      console.log("[Realtime] Token type:", tokenData.type, "Model:", model);

      // Connect to OpenAI Realtime API
      const wsUrl = `wss://api.openai.com/v1/realtime?model=${model}`;
      console.log("[Realtime] Connecting to:", wsUrl);
      
      const ws = new WebSocket(wsUrl, [
        "realtime",
        `openai-insecure-api-key.${token}`
      ]);

      ws.onopen = () => {
        console.log("[Realtime] Connected - session already configured via client secret");
        setIsConnected(true);
        // Session is fully configured when creating the client secret
        // No session.update needed - this avoids potential config conflicts
      };

      ws.onmessage = handleMessage;

      ws.onerror = (err) => {
        console.error("[Realtime] WebSocket error:", err);
        setError("Connection error - check browser console for details");
        onError?.("Connection error");
      };

      ws.onclose = (event) => {
        console.log("[Realtime] Disconnected, code:", event.code, "reason:", event.reason);
        setIsConnected(false);
        setIsListening(false);
        if (event.code !== 1000 && event.code !== 1005) {
          setError(`Connection closed: ${event.reason || 'Unknown reason'}`);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      setError(message);
      onError?.(message);
    }
  }, [systemPrompt, voice, attachments, handleMessage, onError]);

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
