/**
 * Screenshot capture utilities using html2canvas.
 * Handles page capture, compression, and resize.
 */

import html2canvas from "html2canvas";

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 0.7;

/** Capture the current page as a JPEG data URL */
export async function capturePageScreenshot(
  hideElement?: HTMLElement | null
): Promise<string> {
  // Temporarily hide the feedback widget during capture
  if (hideElement) {
    hideElement.style.visibility = "hidden";
  }

  // Wait one frame for the UI to update
  await new Promise((r) => requestAnimationFrame(r));

  const canvas = await html2canvas(document.documentElement, {
    useCORS: true,
    scale: 1,
    logging: false,
    backgroundColor: "#0B0F14", // obsidian
    windowWidth: document.documentElement.scrollWidth,
    windowHeight: document.documentElement.scrollHeight,
  });

  // Restore visibility
  if (hideElement) {
    hideElement.style.visibility = "visible";
  }

  return compressCanvas(canvas);
}

/** Compress a canvas to JPEG, resizing if wider than MAX_WIDTH */
function compressCanvas(canvas: HTMLCanvasElement): string {
  if (canvas.width <= MAX_WIDTH) {
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  }

  // Resize
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
