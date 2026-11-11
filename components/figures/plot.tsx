"use client";

import { useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

// Minimal SVG plotting kit: linear scales, axes, sampled paths and draggable handles.
// Every figure is plain SVG, so it is crisp at any zoom, themed by CSS variables and
// rendered on the server; only the drag logic runs on the client.

export type Frame = {
  width: number; height: number;
  left: number; right: number; top: number; bottom: number;
  x: (v: number) => number; y: (v: number) => number;
  ix: (px: number) => number; iy: (py: number) => number;
  domain: { x: [number, number]; y: [number, number] };
};

export function frame(x: [number, number], y: [number, number], width = 640, height = 360): Frame {
  const left = 52, right = width - 18, top = 14, bottom = height - 40;
  return {
    width, height, left, right, top, bottom, domain: { x, y },
    x: (v) => left + ((v - x[0]) / (x[1] - x[0])) * (right - left),
    y: (v) => bottom - ((v - y[0]) / (y[1] - y[0])) * (bottom - top),
    ix: (px) => x[0] + ((px - left) / (right - left)) * (x[1] - x[0]),
    iy: (py) => y[0] + ((bottom - py) / (bottom - top)) * (y[1] - y[0]),
  };
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const fmt = (v: number, digits = 2) => (Object.is(Math.round(v * 10 ** digits), -0) ? 0 : v).toFixed(digits);

/** Polyline of f over the x-domain; points outside the y-domain are clipped by the SVG clip path. */
export function curve(f: Frame, fn: (x: number) => number, from = f.domain.x[0], to = f.domain.x[1], samples = 160) {
  const span = f.domain.y[1] - f.domain.y[0];
  let d = "";
  for (let i = 0; i <= samples; i += 1) {
    const xv = from + ((to - from) * i) / samples;
    const yv = fn(xv);
    if (!Number.isFinite(yv)) continue;
    d += `${d ? "L" : "M"}${f.x(xv).toFixed(1)},${f.y(clamp(yv, f.domain.y[0] - span, f.domain.y[1] + span)).toFixed(1)}`;
  }
  return d;
}

type Tick = number | [number, string];

export function Axes({ f, xTicks, yTicks, xLabel, yLabel }: { f: Frame; xTicks: Tick[]; yTicks: Tick[]; xLabel: ReactNode; yLabel: ReactNode }) {
  const norm = (t: Tick) => (Array.isArray(t) ? t : [t, String(t)] as [number, string]);
  return (
    <g className="axes">
      <line x1={f.left} x2={f.right} y1={f.bottom} y2={f.bottom} />
      <line x1={f.left} x2={f.left} y1={f.top} y2={f.bottom} />
      {xTicks.map(norm).map(([v, label]) => (
        <g key={`x${v}`} transform={`translate(${f.x(v)},${f.bottom})`}><line y2={5} /><text y={18} textAnchor="middle">{label}</text></g>
      ))}
      {yTicks.map(norm).map(([v, label]) => (
        <g key={`y${v}`} transform={`translate(${f.left},${f.y(v)})`}><line x2={-5} /><text x={-8} dy="0.32em" textAnchor="end">{label}</text></g>
      ))}
      <text className="axis-label" x={f.right} y={f.height - 6} textAnchor="end">{xLabel}</text>
      <text className="axis-label" x={f.left + 6} y={f.top + 4} dy="0.7em">{yLabel}</text>
    </g>
  );
}

/** Clips data marks to the plotting area. */
export function Plot({ f, id, label, children }: { f: Frame; id: string; label: string; children: ReactNode }) {
  return (
    <svg className="plot" viewBox={`0 0 ${f.width} ${f.height}`} role="group" aria-label={label}>
      <defs><clipPath id={`${id}-clip`}><rect x={f.left} y={f.top - 2} width={f.right - f.left} height={f.bottom - f.top + 2} /></clipPath></defs>
      {children}
    </svg>
  );
}

/**
 * A draggable point. Pointer drags report data coordinates; arrow keys move it by `step`
 * (Shift for ten steps), so every figure is fully operable from the keyboard.
 */
export function Handle({ f, x, y, label, onMove, step = [0.1, 0.1], shape = "circle", tone = "accent", text, textOffset = [8, -8] }: {
  f: Frame; x: number; y: number; label: string;
  onMove: (x: number, y: number) => void;
  step?: [number, number]; shape?: "circle" | "square"; tone?: "accent" | "ink" | "negative";
  text?: ReactNode; textOffset?: [number, number];
}) {
  const dragging = useRef(false);
  const toData = (event: PointerEvent<SVGGElement>) => {
    const svg = event.currentTarget.ownerSVGElement!;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
    return [f.ix(point.x), f.iy(point.y)] as const;
  };
  const keys: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
  const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    const move = keys[event.key];
    if (!move) return;
    event.preventDefault();
    const k = event.shiftKey ? 10 : 1;
    onMove(x + move[0] * step[0] * k, y + move[1] * step[1] * k);
  };
  const px = f.x(x), py = f.y(y);
  return (
    <g
      className={`handle tone-${tone}`}
      tabIndex={0}
      role="slider"
      aria-label={label}
      aria-valuetext={`${label}: ${fmt(x)}, ${fmt(y)}`}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={(event) => { if (dragging.current) onMove(...toData(event)); }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerCancel={() => { dragging.current = false; }}
    >
      <circle className="hit" cx={px} cy={py} r={18} />
      {shape === "square" ? <rect x={px - 6} y={py - 6} width={12} height={12} /> : <circle cx={px} cy={py} r={6.5} />}
      {text && <text x={px + textOffset[0]} y={py + textOffset[1]}>{text}</text>}
    </g>
  );
}

export function Readout({ children }: { children: ReactNode }) {
  return <div className="readout" aria-live="polite">{children}</div>;
}
