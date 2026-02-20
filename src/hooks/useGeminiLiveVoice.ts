"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseGeminiLiveVoiceOptions {
  systemPrompt?: string;
  maxDuration?: number; // seconds
  onTranscript?: (text: string) => void;
  onAIResponse?: (text: string) => void;
  onError?: (error: string) => void;
  onSessionEnd?: () => void;
}

type ConnectionState = "idle" | "connecting" | "connected" | "error";

interface UseGeminiLiveVoiceReturn {
  state: ConnectionState;
  isListening: boolean;
  isSpeaking: boolean;
  error: string | null;
  duration: number;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const GEMINI_WS_URL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

export function useGeminiLiveVoice(
  options: UseGeminiLiveVoiceOptions = {}
): UseGeminiLiveVoiceReturn {
  const {
    systemPrompt = "You are a helpful AI assistant.",
    maxDuration = 120,
    onTranscript,
    onAIResponse,
    onError,
    onSessionEnd,
  } = options;

  const [state, setState] = useState<ConnectionState>("idle");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);
  const endCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setupCompleteRef = useRef(false);
  const startMicRef = useRef<() => void>(() => {});

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

  // Convert base64 to Float32Array (for 24kHz playback)
  const base64ToFloat32 = (base64: string): Float32Array => {
    const binary = atob(base64);
    const uint8Array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      uint8Array[i] = binary.charCodeAt(i);
    }
    const int16Array = new Int16Array(uint8Array.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768;
    }
    return float32Array;
  };

  // Initialize playback audio chain: source → compressor → gain → speakers
  const getPlaybackChain = useCallback(() => {
    if (!playbackContextRef.current) {
      playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
    }
    const ctx = playbackContextRef.current;

    // Create compressor (smooths out harsh peaks → removes "pressured" sound)
    if (!compressorRef.current) {
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, ctx.currentTime);
      compressor.knee.setValueAtTime(30, ctx.currentTime);
      compressor.ratio.setValueAtTime(4, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.15, ctx.currentTime);
      compressorRef.current = compressor;
    }

    // Create gain (slightly reduce volume for more headroom)
    if (!gainNodeRef.current) {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.85, ctx.currentTime);
      gainNodeRef.current = gain;
    }

    // Wire chain: compressor → gain → speakers
    compressorRef.current.connect(gainNodeRef.current);
    gainNodeRef.current.connect(ctx.destination);

    return { ctx, outputNode: compressorRef.current };
  }, []);

  // Play audio — schedule chunks at precise timestamps for gapless playback
  const playAudioQueue = useCallback(() => {
    if (playbackQueueRef.current.length === 0) return;

    try {
      const { ctx, outputNode } = getPlaybackChain();

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Schedule all queued chunks back-to-back at exact timestamps
      while (playbackQueueRef.current.length > 0) {
        const audioData = playbackQueueRef.current.shift()!;
        const audioBuffer = ctx.createBuffer(1, audioData.length, 24000);
        audioBuffer.getChannelData(0).set(audioData);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputNode); // Route through compressor → gain → speakers

        // Schedule right after previous chunk ends (no gap)
        const startTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
        source.start(startTime);
        nextPlayTimeRef.current = startTime + audioBuffer.duration;
      }

      // Mark as speaking
      if (!isPlayingRef.current) {
        isPlayingRef.current = true;
        setIsSpeaking(true);
      }

      // Check when all scheduled audio finishes
      if (endCheckTimerRef.current) clearTimeout(endCheckTimerRef.current);
      const remaining = (nextPlayTimeRef.current - ctx.currentTime) * 1000;
      endCheckTimerRef.current = setTimeout(() => {
        if (playbackQueueRef.current.length === 0) {
          isPlayingRef.current = false;
          setIsSpeaking(false);
          nextPlayTimeRef.current = 0;
        }
      }, Math.max(remaining + 100, 100));
    } catch (err) {
      console.error("[Gemini] Audio playback error:", err);
    }
  }, [getPlaybackChain]);

  // Process parsed JSON message from Gemini
  const processMessage = useCallback(
    (data: Record<string, unknown>) => {
      // Setup complete — start mic
      if (data.setupComplete !== undefined) {
        console.log("[Gemini] Setup complete, starting mic");
        setupCompleteRef.current = true;
        startMicRef.current();
        return;
      }

      // Server content (audio/text response)
      if (data.serverContent) {
        const sc = data.serverContent as Record<string, unknown>;

        // Model turn with audio/text parts
        const modelTurn = sc.modelTurn as Record<string, unknown> | undefined;
        if (modelTurn?.parts) {
          const parts = modelTurn.parts as Array<Record<string, unknown>>;
          for (const part of parts) {
            // Audio response
            const inlineData = part.inlineData as Record<string, string> | undefined;
            if (inlineData?.mimeType?.startsWith("audio/")) {
              const audioData = base64ToFloat32(inlineData.data);
              playbackQueueRef.current.push(audioData);
              playAudioQueue();
            }
            // Text response
            if (part.text) {
              onAIResponse?.(part.text as string);
            }
          }
        }

        // Turn complete — reset schedule time for next turn
        if (sc.turnComplete) {
          console.log("[Gemini] Turn complete");
          nextPlayTimeRef.current = 0;
        }
      }

      // Tool call (not used for demo, but handle gracefully)
      if (data.toolCall) {
        console.log("[Gemini] Tool call received (not handled)");
      }
    },
    [onAIResponse, playAudioQueue]
  );

  // Handle incoming WebSocket messages (can be String or Blob)
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        // Gemini sends messages as Blob (binary) — convert to text first
        if (event.data instanceof Blob) {
          event.data.text().then((text) => {
            try {
              const data = JSON.parse(text);
              processMessage(data);
            } catch (err) {
              console.error("[Gemini] Failed to parse blob message:", err);
            }
          });
          return;
        }

        // Text message — parse directly
        const data = JSON.parse(event.data);
        processMessage(data);
      } catch (err) {
        console.error("[Gemini] Failed to parse message:", err);
      }
    },
    [processMessage]
  );

  // Start microphone capture and stream to Gemini
  const startMic = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN && setupCompleteRef.current) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = floatTo16BitPCM(inputData);
          const base64Audio = int16ToBase64(pcm16);

          wsRef.current.send(
            JSON.stringify({
              realtimeInput: {
                mediaChunks: [
                  {
                    mimeType: "audio/pcm;rate=16000",
                    data: base64Audio,
                  },
                ],
              },
            })
          );
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsListening(true);
      console.log("[Gemini] Mic streaming started");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Microphone access denied";
      setError(message);
      onError?.(message);
    }
  }, [onError]);

  // Keep ref in sync so processMessage can call it
  startMicRef.current = startMic;

  // Connect to Gemini Live API
  const connect = useCallback(async () => {
    try {
      setError(null);
      setState("connecting");
      setupCompleteRef.current = false;

      // Get API key from server
      const res = await fetch("/api/ai/gemini-live", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get Gemini session");
      }
      const { apiKey, model } = await res.json();

      // Connect WebSocket
      const wsUrl = `${GEMINI_WS_URL}?key=${apiKey}`;
      console.log("[Gemini] Connecting to Live API...");
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[Gemini] WebSocket connected, sending setup...");

        // Send setup message
        ws.send(
          JSON.stringify({
            setup: {
              model: model || "models/gemini-2.5-flash-native-audio-latest",
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: "Kore",
                    },
                  },
                },
              },
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
            },
          })
        );

        setState("connected");

        // Start duration timer
        setDuration(0);
        durationTimerRef.current = setInterval(() => {
          setDuration((d) => d + 1);
        }, 1000);

        // Max duration auto-disconnect
        maxDurationTimerRef.current = setTimeout(() => {
          console.log("[Gemini] Max duration reached, disconnecting");
          disconnect();
          onSessionEnd?.();
        }, maxDuration * 1000);
      };

      ws.onmessage = handleMessage;

      ws.onerror = () => {
        console.error("[Gemini] WebSocket error");
        setState("error");
        setError("Connection failed. Please try again.");
        onError?.("Connection error");
      };

      ws.onclose = (event) => {
        console.log("[Gemini] Disconnected:", event.code, event.reason);
        cleanup();
        if (state !== "idle") {
          onSessionEnd?.();
        }
      };

      wsRef.current = ws;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect";
      setState("error");
      setError(message);
      onError?.(message);
    }
  }, [systemPrompt, maxDuration, handleMessage, onError, onSessionEnd]);

  // Cleanup all resources
  const cleanup = useCallback(() => {
    // Stop mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    // Kill all scheduled audio immediately by closing the playback context
    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }
    gainNodeRef.current = null;
    compressorRef.current = null;
    // Clear timers
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (endCheckTimerRef.current) {
      clearTimeout(endCheckTimerRef.current);
      endCheckTimerRef.current = null;
    }
    setupCompleteRef.current = false;
    nextPlayTimeRef.current = 0;
    setState("idle");
    setIsListening(false);
    setIsSpeaking(false);
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    cleanup();
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return {
    state,
    isListening,
    isSpeaking,
    error,
    duration,
    connect,
    disconnect,
  };
}
