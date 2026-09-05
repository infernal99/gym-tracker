"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, RotateCcw, Check } from "lucide-react";
import type { PhotoAngle } from "@/lib/photo-angles";
import { PHOTO_ANGLES, PHOTO_ANGLE_LABELS } from "@/lib/photo-angles";
import { SilhouetteOverlay, SILHOUETTE_TARGET_BOX } from "./silhouette-overlay";
import { Button } from "@/components/ui/button";

type Phase = "loading" | "live" | "unavailable" | "review";

const ALIGN_HOLD_MS = 1100;
// How far off-target counts as "close enough" — normalized image units.
const CENTER_TOLERANCE = 0.07;
const SIZE_TOLERANCE = 0.14;

// BlazePose landmark indices this needs — the rest of the 33 aren't used.
const NOSE = 0;
const SHOULDERS = [11, 12];
const HIPS = [23, 24];
const ANKLES = [27, 28];
const KEY_POINTS = [NOSE, ...SHOULDERS, ...HIPS, ...ANKLES];

interface Landmark {
  x: number;
  y: number;
  visibility?: number;
}

function computeFeedback(landmarks: Landmark[] | undefined) {
  if (!landmarks) return { message: "Colócate frente a la cámara, de cuerpo entero.", aligned: false };

  const visible = KEY_POINTS.map((i) => landmarks[i]).filter(
    (p): p is Landmark => !!p && (p.visibility ?? 1) > 0.5,
  );
  if (visible.length < 4) {
    return { message: "No te vemos bien, apártate un poco de la luz o el fondo.", aligned: false };
  }

  // The preview is mirrored (CSS scaleX(-1), a normal "selfie" feel), so
  // feedback has to reason in that same mirrored space — otherwise "muévete
  // a la izquierda" would tell someone to move the wrong way.
  const xs = visible.map((p) => 1 - p.x);
  const ys = visible.map((p) => p.y);
  const box = { xMin: Math.min(...xs), xMax: Math.max(...xs), yMin: Math.min(...ys), yMax: Math.max(...ys) };

  const anklesVisible = ANKLES.every((i) => (landmarks[i]?.visibility ?? 0) > 0.5);
  const centerX = (box.xMin + box.xMax) / 2;
  const targetCenterX = (SILHOUETTE_TARGET_BOX.xMin + SILHOUETTE_TARGET_BOX.xMax) / 2;
  const dx = centerX - targetCenterX;

  const height = box.yMax - box.yMin;
  const targetHeight = SILHOUETTE_TARGET_BOX.yMax - SILHOUETTE_TARGET_BOX.yMin;
  const sizeRatio = height / targetHeight;

  if (!anklesVisible || sizeRatio > 1 + SIZE_TOLERANCE) {
    return { message: "Aléjate un poco para que se vea todo tu cuerpo.", aligned: false };
  }
  if (sizeRatio < 1 - SIZE_TOLERANCE) {
    return { message: "Acércate un poco más a la cámara.", aligned: false };
  }
  if (Math.abs(dx) > CENTER_TOLERANCE) {
    return { message: dx > 0 ? "Muévete a la izquierda." : "Muévete a la derecha.", aligned: false };
  }
  if (box.yMin > SILHOUETTE_TARGET_BOX.yMin + CENTER_TOLERANCE) {
    return { message: "Baja un poco la cámara o da un paso atrás.", aligned: false };
  }

  return { message: "¡Perfecto, no te muevas!", aligned: true };
}

export function GuidedCameraCapture({
  initialAngle,
  onCapture,
  onCancel,
}: {
  initialAngle: PhotoAngle;
  onCapture: (blob: Blob, angle: PhotoAngle) => void;
  onCancel: () => void;
}) {
  const [angle, setAngle] = useState<PhotoAngle>(initialAngle);
  const [phase, setPhase] = useState<Phase>("loading");
  const [feedback, setFeedback] = useState("Preparando la cámara...");
  const [aligned, setAligned] = useState(false);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  // Guards the portal target: this component only ever mounts client-side
  // (behind a button click, never during SSR), so document.body is normally
  // available immediately — but gating the very first portal render behind
  // an effect is the standard, cheap way to rule out any hydration-timing
  // edge case entirely rather than assume it can't happen.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<import("@mediapipe/tasks-vision").PoseLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const alignedSinceRef = useRef<number | null>(null);
  const capturedRef = useRef(false);
  const reviewBlobRef = useRef<Blob | null>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Flip horizontally on capture too, so the saved photo matches the
    // mirrored preview the person just aligned themselves against.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        capturedRef.current = true;
        stopCamera();
        reviewBlobRef.current = blob;
        setReviewUrl(URL.createObjectURL(blob));
        setPhase("review");
      },
      "image/jpeg",
      0.9,
    );
  }, [stopCamera]);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || capturedRef.current) return;

    if (video.readyState >= 2) {
      const result = landmarker.detectForVideo(video, performance.now());
      const fb = computeFeedback(result.landmarks?.[0]);
      setFeedback(fb.message);
      setAligned(fb.aligned);

      if (fb.aligned) {
        if (alignedSinceRef.current === null) alignedSinceRef.current = performance.now();
        else if (performance.now() - alignedSinceRef.current > ALIGN_HOLD_MS) {
          captureFrame();
          return;
        }
      } else {
        alignedSinceRef.current = null;
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [captureFrame]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm",
        );
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        if (cancelled) return;
        landmarkerRef.current = landmarker;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setPhase("live");
        setFeedback("Colócate dentro de la silueta.");
        rafRef.current = requestAnimationFrame(loop);
      } catch {
        if (!cancelled) setPhase("unavailable");
      }
    }

    start();
    return () => {
      cancelled = true;
      stopCamera();
      landmarkerRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retake() {
    if (reviewUrl) URL.revokeObjectURL(reviewUrl);
    setReviewUrl(null);
    reviewBlobRef.current = null;
    capturedRef.current = false;
    alignedSinceRef.current = null;
    setPhase("live");
    rafRef.current = requestAnimationFrame(loop);
  }

  function confirm() {
    if (reviewBlobRef.current) onCapture(reviewBlobRef.current, angle);
  }

  if (!mounted) return null;

  // Portaled straight to <body>: a `fixed` element is only ever fixed
  // relative to the *viewport* when every ancestor is free of transform/
  // filter/contain — one of this app's `fade-up` entrance-animation
  // wrappers leaves a residual `transform: matrix(1,0,0,1,0,0)` behind via
  // `animation-fill-mode: both` even at rest, which silently turns it into
  // the containing block instead, shrinking this overlay down to that
  // ancestor's own size. Escaping to the body sidesteps the problem
  // entirely rather than hunting down every ancestor that might do this.
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <Button type="button" variant="ghost" size="icon-sm" className="text-white hover:bg-white/10 hover:text-white" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
        {phase === "live" && (
          <div className="flex gap-1.5">
            {PHOTO_ANGLES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAngle(a)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  angle === a ? "bg-white text-black" : "bg-white/15 text-white"
                }`}
              >
                {PHOTO_ANGLE_LABELS[a]}
              </button>
            ))}
          </div>
        )}
        <div className="w-9" />
      </div>

      <div className="relative flex-1 overflow-hidden">
        {phase === "unavailable" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center text-white">
            <p className="font-medium">No se pudo acceder a la cámara.</p>
            <p className="text-sm text-white/60">
              Puede que hayas denegado el permiso, o que este dispositivo no tenga cámara disponible.
            </p>
            <Button type="button" variant="outline" onClick={onCancel} className="mt-2">
              Volver
            </Button>
          </div>
        ) : phase === "review" && reviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={reviewUrl} alt="Foto capturada" className="h-full w-full object-contain" />
        ) : (
          <>
            <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
            <SilhouetteOverlay angle={angle} />
            {phase === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                Cargando cámara...
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-3 px-4 pb-6 pt-3">
        {phase === "live" && (
          <p
            className={`text-center text-sm font-medium ${aligned ? "text-success" : "text-white"}`}
          >
            {feedback}
          </p>
        )}
        {phase === "live" ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={captureFrame}
              className={`flex h-16 w-16 items-center justify-center rounded-full border-4 transition-colors ${
                aligned ? "border-success bg-success/30" : "border-white/70 bg-white/10"
              }`}
              aria-label="Capturar foto"
            >
              <span className={`h-12 w-12 rounded-full ${aligned ? "bg-success" : "bg-white"}`} />
            </button>
          </div>
        ) : phase === "review" ? (
          <div className="flex justify-center gap-3">
            <Button type="button" variant="outline" onClick={retake} className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <RotateCcw className="h-4 w-4" />
              Repetir
            </Button>
            <Button type="button" onClick={confirm}>
              <Check className="h-4 w-4" />
              Usar esta foto
            </Button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
