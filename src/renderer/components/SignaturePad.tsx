import { useEffect, useRef, useState, type PointerEvent } from "react";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  existingSignature: string | null;
}

/**
 * Minimal mouse/touch signature capture on a plain <canvas>. No drawing
 * library — Starvent is offline-first and this needs nothing more than
 * pointer events, so a dependency would only add build weight for no gain.
 */
export function SignaturePad({ onSave, existingSignature }: SignaturePadProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#f3f1ea";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (existingSignature) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = existingSignature;
    }
  }, [existingSignature]);

  function getPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>): void {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    drawingRef.current = true;
    const { x, y } = getPoint(canvas, event.clientX, event.clientY);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>): void {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { x, y } = getPoint(canvas, event.clientX, event.clientY);
    ctx.strokeStyle = "#1a1305";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  }

  function handlePointerUp(): void {
    drawingRef.current = false;
  }

  function handleClear(): void {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#f3f1ea";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function handleSave(): void {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/png"));
  }

  return (
    <div className="signature-pad">
      <canvas
        ref={canvasRef}
        width={360}
        height={140}
        className="signature-pad__canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      <div className="signature-pad__actions">
        <button type="button" className="btn-secondary" onClick={handleClear}>
          پاک کردن
        </button>
        <button type="button" className="btn-primary" onClick={handleSave} disabled={!hasDrawn && !existingSignature}>
          ثبت امضا
        </button>
      </div>
    </div>
  );
}
