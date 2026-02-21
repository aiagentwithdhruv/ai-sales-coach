"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Upload, Trash2, Pencil, Square, Check } from "lucide-react";
import { capturePageScreenshot, fileToDataUrl } from "@/lib/screenshot";

interface ScreenshotCaptureProps {
  value?: string; // base64 data URL
  onChange: (dataUrl: string | undefined) => void;
  widgetRef?: React.RefObject<HTMLDivElement | null>;
  showBugPrompt?: boolean;
}

type DrawTool = "rectangle" | "freehand";

export function ScreenshotCapture({
  value,
  onChange,
  widgetRef,
  showBugPrompt,
}: ScreenshotCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [drawTool, setDrawTool] = useState<DrawTool>("freehand");
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const annotationsRef = useRef<ImageData | null>(null);

  // Load screenshot into canvas for annotation
  useEffect(() => {
    if (!isAnnotating || !value || !canvasRef.current || !imgRef.current) return;

    const canvas = canvasRef.current;
    const img = imgRef.current;

    img.onload = () => {
      // Scale canvas to fit within the panel (max ~340px wide)
      const maxW = 340;
      const ratio = Math.min(maxW / img.width, 1);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      annotationsRef.current = null;
    };

    if (img.complete && img.naturalWidth > 0) {
      img.onload?.(new Event("load") as any);
    }
  }, [isAnnotating, value]);

  const handleCapture = useCallback(async () => {
    setIsCapturing(true);
    try {
      const dataUrl = await capturePageScreenshot(widgetRef?.current);
      onChange(dataUrl);
      setIsAnnotating(true);
    } catch {
      // Capture failed silently
    } finally {
      setIsCapturing(false);
    }
  }, [onChange, widgetRef]);

  const handleFileDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith("image/")) return;
      const dataUrl = await fileToDataUrl(file);
      onChange(dataUrl);
      setIsAnnotating(true);
    },
    [onChange]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const dataUrl = await fileToDataUrl(file);
      onChange(dataUrl);
      setIsAnnotating(true);
    },
    [onChange]
  );

  // Drawing handlers
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isAnnotating) return;
    e.preventDefault();
    drawingRef.current = true;
    const pos = getPos(e);
    lastPosRef.current = pos;
    startPosRef.current = pos;

    // Save current state for rectangle redraw
    if (drawTool === "rectangle") {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && canvasRef.current) {
        annotationsRef.current = ctx.getImageData(
          0, 0, canvasRef.current.width, canvasRef.current.height
        );
      }
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);

    if (drawTool === "freehand") {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#FF4757";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
      lastPosRef.current = pos;
    } else if (drawTool === "rectangle" && annotationsRef.current) {
      // Restore to pre-draw state and draw new rectangle
      ctx.putImageData(annotationsRef.current, 0, 0);
      const w = pos.x - startPosRef.current.x;
      const h = pos.y - startPosRef.current.y;
      ctx.strokeStyle = "#FF4757";
      ctx.lineWidth = 2;
      ctx.strokeRect(startPosRef.current.x, startPosRef.current.y, w, h);
    }
  };

  const stopDraw = () => {
    drawingRef.current = false;
  };

  const clearAnnotations = () => {
    if (!canvasRef.current || !imgRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(imgRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const finishAnnotation = () => {
    if (!canvasRef.current) return;
    const finalDataUrl = canvasRef.current.toDataURL("image/jpeg", 0.8);
    onChange(finalDataUrl);
    setIsAnnotating(false);
  };

  const removeScreenshot = () => {
    onChange(undefined);
    setIsAnnotating(false);
  };

  // Annotation mode
  if (isAnnotating && value) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDrawTool("freehand")}
              className={`p-1.5 rounded ${drawTool === "freehand" ? "bg-errorred/20 text-errorred" : "text-mist hover:text-silver"}`}
              title="Freehand"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDrawTool("rectangle")}
              className={`p-1.5 rounded ${drawTool === "rectangle" ? "bg-errorred/20 text-errorred" : "text-mist hover:text-silver"}`}
              title="Rectangle"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={clearAnnotations}
              className="p-1.5 rounded text-mist hover:text-silver"
              title="Clear"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={finishAnnotation}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-automationgreen/20 text-automationgreen text-xs font-medium hover:bg-automationgreen/30 transition-colors"
          >
            <Check className="h-3 w-3" />
            Done
          </button>
        </div>
        <div className="relative rounded-lg overflow-hidden border border-gunmetal bg-graphite">
          {/* Hidden image for reference */}
          <img
            ref={imgRef}
            src={value}
            alt="Screenshot"
            className="hidden"
            crossOrigin="anonymous"
          />
          <canvas
            ref={canvasRef}
            className="w-full cursor-crosshair touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>
        <p className="text-[10px] text-mist text-center">
          Draw to highlight the issue area
        </p>
      </div>
    );
  }

  // Preview mode (screenshot taken, not annotating)
  if (value && !isAnnotating) {
    return (
      <div className="space-y-2">
        <div className="relative rounded-lg overflow-hidden border border-gunmetal bg-graphite">
          <img
            src={value}
            alt="Screenshot preview"
            className="w-full"
          />
          <div className="absolute top-1.5 right-1.5 flex gap-1">
            <button
              type="button"
              onClick={() => setIsAnnotating(true)}
              className="p-1.5 rounded-lg bg-graphite/80 text-silver hover:text-platinum backdrop-blur-sm"
              title="Annotate"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={removeScreenshot}
              className="p-1.5 rounded-lg bg-graphite/80 text-silver hover:text-errorred backdrop-blur-sm"
              title="Remove"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Capture/upload mode (no screenshot yet)
  return (
    <div className="space-y-2">
      {showBugPrompt && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neonblue/10 border border-neonblue/20">
          <Camera className="h-4 w-4 text-neonblue flex-shrink-0" />
          <p className="text-xs text-neonblue">
            Take a screenshot — we&apos;ll fix within 30 min
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCapture}
          disabled={isCapturing}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-graphite border border-gunmetal text-xs text-silver hover:text-platinum hover:border-neonblue/30 transition-colors disabled:opacity-50"
        >
          <Camera className={`h-3.5 w-3.5 ${isCapturing ? "animate-pulse" : ""}`} />
          {isCapturing ? "Capturing..." : "Capture Page"}
        </button>

        <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-graphite border border-gunmetal text-xs text-silver hover:text-platinum hover:border-neonblue/30 transition-colors cursor-pointer">
          <Upload className="h-3.5 w-3.5" />
          Upload
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        className={`border border-dashed rounded-lg py-3 text-center text-[10px] transition-colors ${
          isDragging
            ? "border-neonblue/50 bg-neonblue/5 text-neonblue"
            : "border-gunmetal text-mist"
        }`}
      >
        or drag & drop an image here
      </div>
    </div>
  );
}
