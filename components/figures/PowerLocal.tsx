"use client";

import { useState } from "react";
import { Axes, Handle, Plot, Readout, clamp, curve, fmt, frame } from "./plot";
import { Phi, PhiInv } from "./normal";

// Local asymptotic power of the two-sided t-test, eq. (power): Φ(−t + μ) + Φ(−t − μ), with
// μ = γ/√Avar for drift γ. Larger Avar flattens the curve: the efficiency comparison.
const f = frame([-6, 6], [0, 1.02]);
const power = (gamma: number, avar: number, alpha: number) => {
  const t = PhiInv(1 - alpha / 2), mu = gamma / Math.sqrt(avar);
  return Phi(-t + mu) + Phi(-t - mu);
};

export default function PowerLocal() {
  const [alpha, setAlpha] = useState(0.05);
  const [avars, setAvars] = useState<[number, number]>([1, 1.25]);
  const [probe, setProbe] = useState(2.5);
  const t = PhiInv(1 - alpha / 2);
  // A handle sits where γ = t·√Avar (power ≈ ½); dragging it sideways sets Avar.
  const setAvar = (index: 0 | 1, x: number) => {
    const avar = clamp((Math.abs(x) / t) ** 2, 0.2, 6);
    setAvars((current) => (index === 0 ? [avar, current[1]] : [current[0], avar]));
  };
  return (
    <>
      <Plot f={f} id="powerlocal" label="Local asymptotic power for two asymptotic variances">
        <Axes f={f} xLabel="γ" yLabel="asymptotic power" xTicks={[-6, -4, -2, 0, 2, 4, 6]} yTicks={[[alpha, fmt(alpha, 3)], 0.2, 0.4, 0.6, 0.8, 1]} />
        <g clipPath="url(#powerlocal-clip)">
          <line className="guide" x1={f.x(probe)} x2={f.x(probe)} y1={f.y(0)} y2={f.y(1.02)} />
          {avars.map((v, i) => <path key={i} className={`series s${i}`} d={curve(f, (g) => power(g, v, alpha))} />)}
          <text className="series-label s0" x={f.x(-1.5)} y={f.y(0.95)}>Avar = {fmt(avars[0])}</text>
          <text className="series-label s1" x={f.x(-1.5)} y={f.y(0.87)}>Avar = {fmt(avars[1])}</text>
        </g>
        <Handle f={f} x={0} y={alpha} label="Size α" tone="ink" step={[0, 0.005]} text="α"
          onMove={(_, y) => setAlpha(clamp(y, 0.005, 0.5))} />
        {avars.map((v, i) => (
          <Handle key={i} f={f} x={t * Math.sqrt(v)} y={power(t * Math.sqrt(v), v, alpha)} label={`Asymptotic variance ${i + 1}`}
            shape="square" step={[0.05, 0]} tone={i ? "ink" : "accent"} onMove={(x) => setAvar(i as 0 | 1, x)} />
        ))}
        <Handle f={f} x={probe} y={0} label="Drift γ" tone="negative" step={[0.1, 0]} text="γ"
          onMove={(x) => setProbe(clamp(x, -6, 6))} />
      </Plot>
      <Readout>
        At γ = {fmt(probe, 1)}: power {fmt(power(probe, avars[0], alpha), 3)} (Avar {fmt(avars[0])}) against {fmt(power(probe, avars[1], alpha), 3)} (Avar {fmt(avars[1])}).
        {" "}Relative efficiency {fmt(avars[1] / avars[0])}: the less efficient estimator needs that many times the sample for the same local power.
      </Readout>
    </>
  );
}
