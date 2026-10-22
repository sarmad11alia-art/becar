import { useEffect, useRef, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  /** auto=true: periodic auto-scan frame; auto=false: manual capture */
  onCapture: (blob: Blob, auto: boolean) => void;
  busy: boolean;
  /** set true by parent when the card number was read successfully — stops auto-scan */
  done: boolean;
  detected?: { number: string; name: string; expiry: string };
}

export function CardCameraScan({ open, onClose, onCapture, busy, done, detected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const doneRef = useRef(false);
  busyRef.current = busy;
  doneRef.current = done;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCamError(null);
    navigator.mediaDevices
      ?.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => setCamError("تعذّر فتح الكاميرا، تأكد من منح الإذن"));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open]);

  // Live continuous scan: grab the card-frame region every 1.2s until done.
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      if (busyRef.current || doneRef.current) return;
      grabFrame(true);
    }, 1500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function grabFrame(auto: boolean) {
    const video = videoRef.current;
    const box = boxRef.current;
    const frame = frameRef.current;
    if (!video || !video.videoWidth || !box || !frame) return;

    // Crop to the card frame area so OCR focuses on the card only.
    const boxRect = box.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const scaleX = video.videoWidth / boxRect.width;
    const scaleY = video.videoHeight / boxRect.height;
    // object-cover: video may be cropped; compute the visible region offset
    const videoAspect = video.videoWidth / video.videoHeight;
    const boxAspect = boxRect.width / boxRect.height;
    let sx = 0, sy = 0, sWidth = video.videoWidth, sHeight = video.videoHeight;
    if (videoAspect > boxAspect) {
      sWidth = video.videoHeight * boxAspect;
      sx = (video.videoWidth - sWidth) / 2;
    } else {
      sHeight = video.videoWidth / boxAspect;
      sy = (video.videoHeight - sHeight) / 2;
    }
    const relX = (frameRect.left - boxRect.left) / boxRect.width;
    const relY = (frameRect.top - boxRect.top) / boxRect.height;
    const relW = frameRect.width / boxRect.width;
    const relH = frameRect.height / boxRect.height;

    const cropX = sx + relX * sWidth;
    const cropY = sy + relY * sHeight;
    const cropW = relW * sWidth;
    const cropH = relH * sHeight;

    void scaleX; void scaleY;
    const canvas = document.createElement("canvas");
    const k = Math.min(1, 1100 / cropW);
    canvas.width = Math.max(1, Math.round(cropW * k));
    canvas.height = Math.max(1, Math.round(cropH * k));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob, auto);
      },
      "image/jpeg",
      0.85
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">مسح البطاقة المباشر</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <div ref={boxRef} className="relative overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "4/3" }}>
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          {/* Card frame overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              ref={frameRef}
              className="relative overflow-hidden rounded-xl border-2 border-dashed border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
              style={{ width: "86%", aspectRatio: "85.6/53.98" }}
            >
              {/* Animated scan line */}
              {detected && (detected.number || detected.name || detected.expiry) && (
                <div dir="ltr" className="absolute inset-0 flex flex-col justify-end gap-1 p-3 font-mono text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {detected.number && (
                    <span className="bcare-fade-up rounded bg-black/45 px-2 py-0.5 text-base font-bold tracking-widest">
                      {detected.number.replace(/(.{4})/g, "$1 ").trim()}
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    {detected.name ? <span className="bcare-fade-up truncate rounded bg-black/45 px-2 py-0.5">{detected.name}</span> : <span />}
                    {detected.expiry && <span className="bcare-fade-up rounded bg-black/45 px-2 py-0.5">{detected.expiry}</span>}
                  </div>
                </div>
              )}
              <span className="bcare-scanline absolute inset-x-0 top-0 h-0.5 bg-bcare-orange/90 shadow-[0_0_12px_2px_rgba(249,115,22,0.8)]" />
              <span className="absolute -right-1 -top-1 h-5 w-5 rounded-tr-xl border-r-4 border-t-4 border-bcare-orange" />
              <span className="absolute -left-1 -top-1 h-5 w-5 rounded-tl-xl border-l-4 border-t-4 border-bcare-orange" />
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-br-xl border-b-4 border-r-4 border-bcare-orange" />
              <span className="absolute -bottom-1 -left-1 h-5 w-5 rounded-bl-xl border-b-4 border-l-4 border-bcare-orange" />
            </div>
          </div>
          {camError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center text-sm text-white">
              {camError}
            </div>
          )}
          {/* Live scanning indicator */}
          {!camError && (
            <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
              <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white">
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 1 0 10 10" />
                </svg>
                {done ? "✓ تمت قراءة البطاقة" : "مسح مباشر... وجّه الكاميرا نحو البطاقة"}
              </span>
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-xs text-slate-500">
          ضع البطاقة داخل الإطار بإضاءة جيدة — تُقرأ البيانات تلقائيًا فور ظهورها
        </p>

        <style>{`
          @keyframes bcare-scan {
            0% { top: 0; }
            50% { top: calc(100% - 2px); }
            100% { top: 0; }
          }
          .bcare-scanline { animation: bcare-scan 2.4s ease-in-out infinite; }
        `}</style>
      </div>
    </div>
  );
}
