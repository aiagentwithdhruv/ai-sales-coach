/**
 * Screenshot capture utilities using html2canvas.
 * Supports region selection (CleanShot-style) capture, compression, and crop.
 */

import html2canvas from "html2canvas-pro";

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 0.7;

/**
 * Capture the visible viewport as a raw Canvas element.
 * Does NOT restore hideElement visibility — caller must handle that.
 */
export async function captureViewportCanvas(
  hideElement?: HTMLElement | null
): Promise<HTMLCanvasElement> {
  if (hideElement) {
    hideElement.style.visibility = "hidden";
  }

  // Wait for 2 animation frames + delay so the visibility change paints
  await new Promise<void>((r) =>
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 80)))
  );

  try {
    const canvas = await html2canvas(document.body, {
      useCORS: true,
      scale: 1,
      logging: false,
      backgroundColor: "#0B0F14",
      x: window.scrollX,
      y: window.scrollY,
      width: window.innerWidth,
      height: window.innerHeight,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      ignoreElements: (el: Element) => {
        // Skip elements html2canvas can't render
        return el.tagName === "IFRAME" || el.tagName === "VIDEO";
      },
    });
    return canvas;
  } catch (err) {
    // Restore visibility before re-throwing
    if (hideElement) {
      hideElement.style.visibility = "visible";
    }
    throw err;
  }
}

/** Crop a rectangular region from a canvas and return compressed JPEG data URL */
export function cropFromCanvas(
  canvas: HTMLCanvasElement,
  region: { x: number; y: number; w: number; h: number }
): string {
  // Normalize negative dimensions (drag right-to-left or bottom-to-top)
  const sx = region.w < 0 ? region.x + region.w : region.x;
  const sy = region.h < 0 ? region.y + region.h : region.y;
  const sw = Math.abs(region.w);
  const sh = Math.abs(region.h);

  if (sw < 2 || sh < 2) return canvas.toDataURL("image/jpeg", JPEG_QUALITY);

  const cropped = document.createElement("canvas");
  cropped.width = sw;
  cropped.height = sh;

  const ctx = cropped.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/jpeg", JPEG_QUALITY);

  ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return compressCanvas(cropped);
}

/** Compress a canvas to JPEG, resizing if wider than MAX_WIDTH */
function compressCanvas(canvas: HTMLCanvasElement): string {
  if (canvas.width <= MAX_WIDTH) {
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  }

  const ratio = MAX_WIDTH / canvas.width;
  const resized = document.createElement("canvas");
  resized.width = MAX_WIDTH;
  resized.height = Math.round(canvas.height * ratio);

  const ctx = resized.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/jpeg", JPEG_QUALITY);

  ctx.drawImage(canvas, 0, 0, resized.width, resized.height);
  return resized.toDataURL("image/jpeg", JPEG_QUALITY);
}

/** Read a File (from drag-drop) as a compressed JPEG data URL */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const width = Math.min(img.width, MAX_WIDTH);
        const ratio = width / img.width;
        canvas.width = width;
        canvas.height = Math.round(img.height * ratio);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
