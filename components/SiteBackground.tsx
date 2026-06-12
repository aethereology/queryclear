"use client";

import React, { useCallback, useEffect, useRef } from "react";

type PixelCanvasProps = React.HTMLAttributes<HTMLDivElement> & {
  gap?: number;
  speed?: number;
  colors?: string[];
  noFocus?: boolean;
  variant?: "default" | "trail" | "glow";
  alpha?: number;
  baseIntensity?: number;
};

type Pixel = {
  x: number;
  y: number;
  size: number;
  intensity: number;
  targetIntensity: number;
  colorPhase: number;
  seed: number;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : null;
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  if (!c1 || !c2) return color1;

  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

function PixelCanvas({
  className = "",
  gap = 12,
  speed = 0.018,
  colors = ["#12352a", "#8fcf1f", "#b6f03c", "#efeae0"],
  noFocus = false,
  variant = "trail",
  alpha = 0.22,
  baseIntensity = 0.018,
  ...props
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<Pixel[][]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const getColorFromIntensity = useCallback(
    (intensity: number, phase: number) => {
      if (colors.length === 0) return "#12352a";
      if (colors.length === 1) return colors[0]!;

      const t = (phase + intensity * 0.55) % 1;
      const index = Math.floor(t * (colors.length - 1));
      const nextIndex = Math.min(index + 1, colors.length - 1);
      const localT = (t * (colors.length - 1)) % 1;
      const color1 = colors[index];
      const color2 = colors[nextIndex];

      if (!color1) return "#12352a";
      if (!color2) return color1;

      return lerpColor(color1, color2, localT);
    },
    [colors],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cols = 0;
    let rows = 0;
    const pixelSize = Math.max(gap, 6);

    const initPixels = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(rect.width / pixelSize);
      rows = Math.ceil(rect.height / pixelSize);

      const newPixels: Pixel[][] = [];
      for (let i = 0; i < cols; i += 1) {
        const row: Pixel[] = [];
        for (let j = 0; j < rows; j += 1) {
          const existing = pixelsRef.current[i]?.[j];
          const seed = existing?.seed ?? Math.random();
          row.push({
            x: i * pixelSize,
            y: j * pixelSize,
            size: pixelSize - 1,
            intensity: existing?.intensity ?? baseIntensity * seed,
            targetIntensity: baseIntensity * seed,
            colorPhase: existing?.colorPhase ?? seed,
            seed,
          });
        }
        newPixels.push(row);
      }
      pixelsRef.current = newPixels;
    };

    const draw = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const rect = container.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const { x: mouseX, y: mouseY } = mouseRef.current;
      const radius = variant === "glow" ? 132 : 96;
      const glowPasses = variant === "glow" ? 2 : 1;
      const pixels = pixelsRef.current;

      for (let i = 0; i < cols; i += 1) {
        const col = pixels[i];
        if (!col) continue;

        for (let j = 0; j < rows; j += 1) {
          const pixel = col[j];
          if (!pixel) continue;

          const centerX = pixel.x + pixel.size / 2;
          const centerY = pixel.y + pixel.size / 2;
          const dx = mouseX - centerX;
          const dy = mouseY - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const idleIntensity = baseIntensity * pixel.seed;

          if (!noFocus && distance < radius) {
            const falloff = 1 - distance / radius;
            pixel.targetIntensity = Math.max(idleIntensity, Math.pow(falloff, 1.7));
          } else {
            pixel.targetIntensity = idleIntensity;
          }

          const lerpSpeed = pixel.targetIntensity > pixel.intensity ? 0.24 : speed;
          pixel.intensity += (pixel.targetIntensity - pixel.intensity) * lerpSpeed;

          if (!reducedMotion) {
            pixel.colorPhase = (pixel.colorPhase + 0.00055 * (deltaTime / 16)) % 1;
          }

          if (pixel.intensity > 0.004) {
            const color = getColorFromIntensity(pixel.intensity, pixel.colorPhase);

            if (variant === "glow" && pixel.intensity > 0.18) {
              for (let g = glowPasses; g > 0; g -= 1) {
                const glowSize = pixel.size + g * 5;
                const glowOffset = (glowSize - pixel.size) / 2;
                ctx.globalAlpha = pixel.intensity * alpha * 0.22 / g;
                ctx.fillStyle = color;
                ctx.fillRect(pixel.x - glowOffset, pixel.y - glowOffset, glowSize, glowSize);
              }
            }

            ctx.globalAlpha = Math.min(1, pixel.intensity * alpha);
            ctx.fillStyle = color;

            if (variant === "trail") {
              const cornerRadius = pixel.size * 0.24;
              ctx.beginPath();
              ctx.roundRect(pixel.x, pixel.y, pixel.size, pixel.size, cornerRadius);
              ctx.fill();
            } else {
              ctx.fillRect(pixel.x, pixel.y, pixel.size, pixel.size);
            }
          }
        }
      }

      ctx.globalAlpha = 1;
      if (!reducedMotion) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    const updateMouse = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const onMouseMove = (event: MouseEvent) => {
      updateMouse(event.clientX, event.clientY);
    };

    const onMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) updateMouse(touch.clientX, touch.clientY);
    };

    initPixels();
    lastTimeRef.current = performance.now();
    draw(lastTimeRef.current);

    window.addEventListener("resize", initPixels);
    if (!noFocus && !reducedMotion) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseleave", onMouseLeave);
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onMouseLeave);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", initPixels);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseLeave);
    };
  }, [alpha, baseIntensity, gap, getColorFromIntensity, noFocus, speed, variant]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${className}`}
      {...props}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

export function SiteBackground() {
  return (
    <div aria-hidden="true" className="site-background">
      <PixelCanvas className="site-background__canvas" />
    </div>
  );
}
