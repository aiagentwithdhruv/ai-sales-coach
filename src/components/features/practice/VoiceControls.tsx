"use client";

import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
  Loader2,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceControlsProps {
  isRecording: boolean;
  isTranscribing: boolean;
  isPlaying: boolean;
  isSpeaking: boolean;
  recordingTime: number;
  audioLevel: number;
  speakerEnabled: boolean;
  handsFreeMode: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onToggleSpeaker: () => void;
  onToggleHandsFree: () => void;
  onStopAudio: () => void;
  disabled?: boolean;
}

export function VoiceControls({
  isRecording,
  isTranscribing,
  isPlaying,
  isSpeaking,
  recordingTime,
  audioLevel,
  speakerEnabled,
  handsFreeMode,
  onStartRecording,
  onStopRecording,
  onToggleSpeaker,
  onToggleHandsFree,
  onStopAudio,
  disabled = false,
}: VoiceControlsProps) {
  // Format recording time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3">
      {/* Recording Button */}
      {isRecording ? (
        <Button
          type="button"
          onClick={onStopRecording}
          className="bg-errorred hover:bg-errorred/80 text-white gap-2 min-w-[120px]"
          disabled={disabled || isTranscribing}
        >
          <Square className="h-4 w-4 fill-current" />
          Stop
        </Button>
      ) : isTranscribing ? (
        <Button
          type="button"
          disabled
          className="bg-graphite text-silver gap-2 min-w-[120px]"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Transcribing...
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onStartRecording}
          className="bg-neonblue hover:bg-electricblue text-white gap-2 min-w-[120px]"
          disabled={disabled || isSpeaking}
        >
          <Mic className="h-4 w-4" />
          Record
        </Button>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center gap-2">
          {/* Pulsing Red Dot */}
          <div className="relative">
            <div className="h-3 w-3 rounded-full bg-errorred" />
            <div className="absolute inset-0 h-3 w-3 rounded-full bg-errorred animate-ping" />
          </div>

          {/* Recording Time */}
          <span className="text-sm font-mono text-errorred">
            {formatTime(recordingTime)}
          </span>

          {/* Audio Level Bar */}
          <div className="w-16 h-2 bg-gunmetal rounded-full overflow-hidden">
            <div
              className="h-full bg-neonblue transition-all duration-75"
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Hands-Free Toggle */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggleHandsFree}
          className={cn(
            "gap-1.5 h-8 px-2",
            handsFreeMode
              ? "bg-automationgreen/20 text-automationgreen hover:bg-automationgreen/30"
              : "text-silver hover:text-platinum"
          )}
          title={handsFreeMode ? "Disable hands-free mode" : "Enable hands-free mode"}
        >
          <Radio className={cn("h-4 w-4", handsFreeMode && "animate-pulse")} />
          <span className="text-xs font-medium">
            {handsFreeMode ? "Live" : "Manual"}
          </span>
        </Button>

        {/* Speaker Toggle */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleSpeaker}
          className={cn(
            "text-silver hover:text-platinum",
            speakerEnabled && "text-neonblue hover:text-neonblue"
          )}
          title={speakerEnabled ? "Mute AI voice" : "Enable AI voice"}
        >
          {speakerEnabled ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </Button>

        {/* Playing Indicator */}
        {(isPlaying || isSpeaking) && (
          <div className="flex items-center gap-2">
            {/* Sound Waves Animation */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-neonblue rounded-full animate-pulse"
                  style={{
                    height: `${8 + Math.random() * 8}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>

            {/* Stop Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onStopAudio}
              className="text-errorred hover:text-errorred/80 h-7 px-2"
            >
              <Square className="h-3 w-3 mr-1" />
              Stop
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Voice Mode Toggle Component
 */
interface VoiceModeToggleProps {
  voiceMode: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export function VoiceModeToggle({
  voiceMode,
  onToggle,
  disabled = false,
}: VoiceModeToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-onyx rounded-lg">
      <button
        type="button"
        onClick={() => onToggle(false)}
        disabled={disabled}
        className={cn(
          "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
          !voiceMode
            ? "bg-graphite text-platinum"
            : "text-mist hover:text-silver"
        )}
      >
        Text
      </button>
      <button
        type="button"
        onClick={() => onToggle(true)}
        disabled={disabled}
        className={cn(
          "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
          voiceMode
            ? "bg-neonblue text-white"
            : "text-mist hover:text-silver"
        )}
      >
        <Mic className="h-3.5 w-3.5" />
        Voice
      </button>
    </div>
  );
}

/**
 * Permission Request Component
 */
interface PermissionRequestProps {
  onRequestPermission: () => void;
  error?: string | null;
}

export function PermissionRequest({
  onRequestPermission,
  error,
}: PermissionRequestProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-onyx rounded-lg border border-gunmetal">
      <MicOff className="h-12 w-12 text-mist mb-4" />
      <h3 className="text-lg font-medium text-platinum mb-2">
        Microphone Access Required
      </h3>
      <p className="text-sm text-silver text-center mb-4 max-w-sm">
        To use voice practice, we need access to your microphone. Click below to
        grant permission.
      </p>
      {error && (
        <p className="text-sm text-errorred mb-4">{error}</p>
      )}
      <Button
        onClick={onRequestPermission}
        className="bg-neonblue hover:bg-electricblue text-white gap-2"
      >
        <Mic className="h-4 w-4" />
        Enable Microphone
      </Button>
    </div>
  );
}
