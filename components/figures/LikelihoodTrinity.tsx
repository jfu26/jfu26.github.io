"use client";

import { useState } from "react";
import { Axes, Handle, Plot, Readout, clamp, curve, fmt, frame } from "./plot";
import { chi2pValue } from "./normal";

// Poisson log-likelihood per observation, normalised at the MLE θ̂ = x̄:
// r(θ) = x̄ log(θ/x̄) − (θ − x̄) ≤ 0, with information I(θ) = 1/θ.
const f = frame([1, 12], [-2, 0.2]);
const n = 10;

export default function LikelihoodTrinity() {
  const [xbar, setXbar] = useState(5);
  const [theta0, setTheta0] = useState(8);
  const r = (theta: number) => xbar * Math.log(theta / xbar) - (theta - xbar);
  const r0 = r(theta0), slope = xbar / theta0 - 1;
  const gap = (theta0 - xbar) ** 2;
  const stats = [
    ["Wald", (n * gap) / xbar, "(θ̂ − θ₀)² weighted by the curvature at θ̂"],
    ["LR", -2 * n * r0, "twice the drop in the log-likelihood"],
    ["LM", (n * gap) / theta0, "squared score at θ₀ weighted by the curvature at θ₀"],
  ] as const;
  const yWald = -1.82;
  return (
    <>
      <Plot f={f} id="trinity" label="Wald, likelihood-ratio and score tests on a Poisson log-likelihood">
        <Axes f={f} xLabel="θ" yLabel="ℓ(θ)/n − ℓ(θ̂)/n" xTicks={[2, 4, 6, 8, 10, 12]} yTicks={[-2, -1.5, -1, -0.5, 0]} />
        <defs>
          <marker id="trinity-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0L10,5L0,10z" className="arrowhead" />
          </marker>
        </defs>
        <g clipPath="url(#trinity-clip)">
          <path className="series s1 dashed" d={curve(f, (t) => -((t - xbar) ** 2) / (2 * xbar))} />
          <path className="series s0" d={curve(f, r, 1.01)} />
          <line className="guide" x1={f.x(xbar)} x2={f.x(12)} y1={f.y(0)} y2={f.y(0)} />
          <line className="guide" x1={f.x(theta0)} x2={f.x(12)} y1={f.y(r0)} y2={f.y(r0)} />
          <line className="guide" x1={f.x(xbar)} x2={f.x(xbar)} y1={f.y(0)} y2={f.y(yWald)} />
          <line className="guide" x1={f.x(theta0)} x2={f.x(theta0)} y1={f.y(r0)} y2={f.y(yWald)} />
          <line className="tangent" x1={f.x(theta0 - 1.4)} x2={f.x(theta0 + 1.4)} y1={f.y(r0 - 1.4 * slope)} y2={f.y(r0 + 1.4 * slope)} />
        </g>
        {/* Arrows shorter than their heads are dropped rather than drawn inside out. */}
        {-r0 > 0.08 && <>
          <line className="measure" markerStart="url(#trinity-arrow)" markerEnd="url(#trinity-arrow)"
            x1={f.x(11.4)} x2={f.x(11.4)} y1={f.y(0)} y2={f.y(r0)} />
          <text className="note" x={f.x(11.3)} y={f.y(r0 / 2)} textAnchor="end" dy="0.32em">LR/2n</text>
        </>}
        {Math.abs(theta0 - xbar) > 0.35 && <>
          <line className="measure" markerStart="url(#trinity-arrow)" markerEnd="url(#trinity-arrow)"
            x1={f.x(xbar)} x2={f.x(theta0)} y1={f.y(yWald)} y2={f.y(yWald)} />
          <text className="note" x={f.x((xbar + theta0) / 2)} y={f.y(yWald) - 6} textAnchor="middle">Wald: θ̂ − θ₀</text>
        </>}
        <text className="note" x={f.x(theta0 + 1.45)} y={f.y(r0 + 1.45 * slope)} dy="0.32em">LM: slope {fmt(slope)}</text>
        <Handle f={f} x={xbar} y={0} label="Maximum likelihood estimate θ̂ = x̄" step={[0.1, 0]} text="θ̂" textOffset={[-6, -12]}
          onMove={(x) => setXbar(clamp(x, 1.5, 11))} />
        <Handle f={f} x={theta0} y={r0} label="Null value θ₀" tone="negative" step={[0.1, 0]} text="θ₀" textOffset={[-26, 4]}
          onMove={(x) => setTheta0(clamp(x, 1.5, 11.5))} />
      </Plot>
      <Readout>
        With n = {n}, x̄ = {fmt(xbar)}, θ₀ = {fmt(theta0)}:{" "}
        {stats.map(([name, value, gloss], i) => (
          <span key={name} title={gloss}>{i ? "; " : ""}<b>{name}</b> = {fmt(value)} (p = {fmt(chi2pValue(value), 3)})</span>
        ))}. The dashed parabola is the quadratic approximation at θ̂; where the log-likelihood is close to it the three statistics agree.
      </Readout>
    </>
  );
}
