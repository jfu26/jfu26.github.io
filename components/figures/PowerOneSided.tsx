"use client";

import { useState } from "react";
import { Axes, Handle, Plot, Readout, clamp, curve, fmt, frame } from "./plot";
import { Phi, PhiInv } from "./normal";

// One-sided z-test of H0: μ ≤ μ0 with σ = 1: β(μ) = 1 − Φ(z_{1−α} − √n (μ − μ0)).
const f = frame([-0.2, 0.8], [0, 1.03]);
const power = (mu: number, n: number, alpha: number) => 1 - Phi(PhiInv(1 - alpha) - Math.sqrt(n) * mu);

export default function PowerOneSided() {
  const [alpha, setAlpha] = useState(0.05);
  const [ns, setNs] = useState<[number, number]>([25, 100]);
  const [probe, setProbe] = useState(0.3);
  const z = PhiInv(1 - alpha);
  // The half-power point of each curve sits at μ − μ0 = z/√n; dragging it sideways sets n.
  const setN = (index: 0 | 1, x: number) => {
    const n = Math.round(clamp((z / Math.max(x, 1e-3)) ** 2, 2, 2000));
    setNs((current) => (index === 0 ? [n, current[1]] : [current[0], n]));
  };
  return (
    <>
      <Plot f={f} id="power1" label="Power function of the one-sided test for two sample sizes">
        <Axes f={f} xLabel="μ − μ₀" yLabel="β(μ)" xTicks={[-0.2, 0, 0.2, 0.4, 0.6, 0.8]} yTicks={[[alpha, fmt(alpha, 3)], 0.5, 1]} />
        <g clipPath="url(#power1-clip)">
          <line className="guide" x1={f.x(-0.2)} x2={f.x(0.8)} y1={f.y(alpha)} y2={f.y(alpha)} />
          <line className="guide" x1={f.x(probe)} x2={f.x(probe)} y1={f.y(0)} y2={f.y(1.03)} />
          {ns.map((n, i) => <path key={i} className={`series s${i}`} d={curve(f, (mu) => power(mu, n, alpha))} />)}
          <text className="series-label s0" x={f.x(z / Math.sqrt(ns[0])) + 10} y={f.y(0.42)}>n = {ns[0]}</text>
          <text className="series-label s1" x={f.x(z / Math.sqrt(ns[1])) + 10} y={f.y(0.62)}>n = {ns[1]}</text>
        </g>
        <Handle f={f} x={0} y={alpha} label="Size α" tone="ink" step={[0, 0.005]} text="α"
          onMove={(_, y) => setAlpha(clamp(y, 0.005, 0.5))} />
        {ns.map((n, i) => (
          <Handle key={i} f={f} x={z / Math.sqrt(n)} y={0.5} label={`Half-power point, n = ${n}`} shape="square" step={[0.005, 0]}
            tone={i ? "ink" : "accent"} onMove={(x) => setN(i as 0 | 1, x)} />
        ))}
        <Handle f={f} x={probe} y={0} label="Alternative μ − μ₀" tone="negative" step={[0.01, 0]} text="μ"
          onMove={(x) => setProbe(clamp(x, -0.2, 0.8))} />
      </Plot>
      <Readout>
        At μ − μ₀ = {fmt(probe)}: power {fmt(power(probe, ns[0], alpha), 3)} with n = {ns[0]}, {fmt(power(probe, ns[1], alpha), 3)} with n = {ns[1]}.
        {" "}Critical value z<sub>1−α</sub> = {fmt(z)}. Drag α on the vertical axis, a square to change n, or μ along the horizontal axis.
      </Readout>
    </>
  );
}
