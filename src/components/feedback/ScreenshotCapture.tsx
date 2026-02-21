"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Upload,
  Trash2,
  Pencil,
  Square,
  Check,
  X,
  Crosshair,
} from "lucide-react";
import {
  captureViewportCanvas,
  cropFromCanvas,
  fileToDataUrl,
} from "@/lib/screenshot";

interface ScreenshotCaptureProps {
  value?: string; // base64 data URL
  onChange: (dataUrl: string | undefined) => void;
  widgetRef?: React.RefObject<HTMLDivElement | null>;
  showBugPrompt?: boolean;
}

type DrawTool = "rectangle" | "freehand";

const MIN_SELECTION = 20; // minimum 20px region

export function ScreenshotCapture({
  value,
  onChange,
  widgetRef,
  showBugPrompt,
}: ScreenshotCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [drawTool, setDrawTool] = useState<DrawTool>("freehand");
  const [isDragging, setIsDragging] = useState(false);
  const [selectionActive, setSelectionActive] = useState(false);
  const [captureError, setCaptureError] = useState("");

  // Annotation refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const annotationsRef = useRef<ImageData | null>(null);

  // Region selection refs
  const fullCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectorCanvasRef = useRef<HTMLCanvasElement>(null);
  const selectingRef = useRef(false);
  const selStartRef = useRef({ x: 0, y: 0 });
  const selEndRef = useRef({ x: 0, y: 0 });

  // ─── Region Selection ────────────────────────────────────────────

  /** Draw the selector overlay: screenshot + dark tint + clear selection */
  const drawSelectorOverlay = useCallback(() => {
    const sc = selectorCanvasRef.current;
    const fc = fullCanvasRef.current;
    if (!sc || !fc) return;

    const ctx = sc.getContext("2d");
    if (!ctx) return;

    // Draw full screenshot
    ctx.drawImage(fc, 0, 0, sc.width, sc.height);

    // Dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, sc.width, sc.height);

    if (!selectingRef.current) return;

    // Calculate normalized region
    const x = Math.min(selStartRef.current.x, selEndRef.current.x);
    const y = Math.min(selStartRef.current.y, selEndRef.current.y);
    const w = Math.abs(selEndRef.current.x - selStartRef.current.x);
    const h = Math.abs(selEndRef.current.y - selStartRef.current.y);

    if (w < 2 || h < 2) return;

    // Clear selection area → show original screenshot
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(fc, 0, 0, sc.width, sc.height);
    ctx.restore();

    // Selection border (dashed cyan)
    ctx.strokeStyle = "#00c8e8";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    // Corner handles
    const handleSize = 6;
    ctx.fillStyle = "#00c8e8";
    const corners = [
      [x, y],
      [x + w, y],
      [x, y + h],
      [x + w, y + h],
    ];
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
    }

    // Dimensions label
    if (w > 40 && h > 20) {
      const label = `${w} x ${h}`;
      ctx.font = "12px Inter, system-ui, sans-serif";
      const tw = ctx.measureText(label).width;
      const lx = x + w / 2 - tw / 2 - 6;
      const ly = y + h + 6;
      ctx.fillStyle = "rgba(0, 200, 232, 0.9)";
      ctx.beginPath();
      ctx.roundRect(lx, ly, tw + 12, 22, 4);
      ctx.fill();
      ctx.fillStyle = "#0B0F14";
      ctx.fillText(label, lx + 6, ly + 15);
    }
  }, []);

  /** Initialize the selector canvas when entering selection mode */
  useEffect(() => {
    if (!isSelecting || !fullCanvasRef.current) return;

    const sc = selectorCanvasRef.current;
    if (!sc) return;

    sc.width = window.innerWidth;
    sc.height = window.innerHeight;
    drawSelectorOverlay();
  }, [isSelecting, drawSelectorOverlay]);

  /** ESC key to cancel selection */
  useEffect(() => {
    if (!isSelecting) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelSelection();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelecting]);

  const getSelPos = (e: React.MouseEvent | React.TouchEvent) => {
    const sc = selectorCanvasRef.current;
    if (!sc) return { x: 0, y: 0 };
    const rect = sc.getBoundingClientRect();
    const scaleX = sc.width / rect.width;
    const scaleY = sc.height / rect.height;
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  };

  const startSelection = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getSelPos(e);
    selStartRef.current = pos;
    selEndRef.current = pos;
    selectingRef.current = true;
    setSelectionActive(true);
  };

  const moveSelection = (e: React.MouseEvent | React.TouchEvent) => {
    if (!selectingRef.current) return;
    e.preventDefault();
    selEndRef.current = getSelPos(e);
    drawSelectorOverlay();
  };

  const endSelection = () => {
    if (!selectingRef.current) return;
    selectingRef.current = false;

    const w = Math.abs(selEndRef.current.x - selStartRef.current.x);
    const h = Math.abs(selEndRef.current.y - selStartRef.current.y);

    if (w < MIN_SELECTION || h < MIN_SELECTION) {
      // Too small — reset and let user try again
      setSelectionActive(false);
      drawSelectorOverlay();
      return;
    }

    // Crop the selected region
    const fc = fullCanvasRef.current;
    if (!fc) return;

    const region = {
      x: selStartRef.current.x,
      y: selStartRef.current.y,
      w: selEndRef.current.x - selStartRef.current.x,
      h: selEndRef.current.y - selStartRef.current.y,
    };

    const dataUrl = cropFromCanvas(fc, region);

    // Restore widget, close selector, enter annotation
    if (widgetRef?.current) {
      widgetRef.current.style.visibility = "visible";
    }
    setIsSelecting(false);
    setSelectionActive(false);
    onChange(dataUrl);
    setIsAnnotating(true);
  };

  const cancelSelection = () => {
    selectingRef.current = false;
    if (widgetRef?.current) {
      widgetRef.current.style.visibility = "visible";
    }
    setIsSelecting(false);
    setSelectionActive(false);
    setIsCapturing(false);
  };

  // ─── Capture trigger ─────────────────────────────────────────────

  const handleCapture = useCallback(async () => {
    setCaptureError("");
    setIsCapturing(true);

    // Give React a frame to render the "Capturing..." state
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
      const canvas = await captureViewportCanvas(widgetRef?.current);
      fullCanvasRef.current = canvas;
      // Don't restore widget visibility yet — selector overlay takes over
      setIsSelecting(true);
    } catch (err) {
      console.error("[ScreenshotCapture] html2canvas failed:", err);
      if (widgetRef?.current) {
        widgetRef.current.style.visibility = "visible";
      }
      setCaptureError("Screenshot capture failed. Try the Upload button instead.");
    } finally {
      setIsCapturing(false);
    }
  }, [widgetRef]);

  // ─── File upload ──────────────────────────────────────────────────

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

  // ─── Annotation drawing ───────────────────────────────────────────

  useEffect(() => {
    if (!isAnnotating || !value || !canvasRef.current || !imgRef.current) return;

    const canvas = canvasRef.current;
    const img = imgRef.current;

    img.onload = () => {
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

  // ─── Region selection overlay (rendered via portal) ───────────────

  if (isSelecting) {
    return createPortal(
      <div
        className="fixed inset-0"
        style={{ zIndex: 99999, cursor: "crosshair" }}
      >
        <canvas
          ref={selectorCanvasRef}
          className="block touch-none"
          style={{ width: "100vw", height: "100vh" }}
          onMouseDown={startSelection}
          onMouseMove={moveSelection}
          onMouseUp={endSelection}
          onTouchStart={startSelection}
          onTouchMove={moveSelection}
          onTouchEnd={endSelection}
        />

        {/* Instructions */}
        {!selectionActive && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-obsidian/90 border border-neonblue/30 backdrop-blur-sm shadow-lg">
            <Crosshair className="h-4 w-4 text-neonblue" />
            <p className="text-sm text-platinum font-medium">
              Drag to select area
            </p>
            <span className="text-xs text-mist ml-1">ESC to cancel</span>
          </div>
        )}

        {/* Cancel button */}
        <button
          onClick={cancelSelection}
          className="absolute top-4 right-4 p-2.5 rounded-xl bg-obsidian/80 text-silver hover:text-platinum border border-gunmetal/50 backdrop-blur-sm transition-colors"
          title="Cancel (ESC)"
        >
          <X className="h-5 w-5" />
        </button>
      </div>,
      document.body
    );
  }

  // ─── Annotation mode ──────────────────────────────────────────────

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

  // ─── Preview mode ─────────────────────────────────────────────────

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

  // ─── Capture/upload mode (no screenshot yet) ──────────────────────

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
          <Crosshair className={`h-3.5 w-3.5 ${isCapturing ? "animate-pulse" : ""}`} />
          {isCapturing ? "Capturing..." : "Select Area"}
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

      {/* Error message */}
      {captureError && (
        <div className="px-3 py-2 rounded-lg bg-errorred/10 border border-errorred/20 text-[11px] text-errorred">
          {captureError}
        </div>
      )}

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
