"use client";

import { useState } from "react";
import { Axes, Handle, Plot, Readout, clamp, curve, fmt, frame } from "./plot";

// Value iteration V_{n+1} = T V_n for the scalar Bellman operator TV = u + βV.
const f = frame([-1, 13], [-1, 13], 560, 440);
const reach = 11.5; // x-position of the slope handle

export default function Cobweb() {
  const [u, setU] = useState(2);
  const [beta, setBeta] = useState(0.8);
  const [v0, setV0] = useState(1);
  const T = (v: number) => u + beta * v;
  const contraction = Math.abs(beta) < 1;
  const vStar = u / (1 - beta);
  let web = `M${f.x(v0)},${f.y(0)}`;
  for (let k = 0, v = v0; k < 40 && Math.abs(v) < 1e3; k += 1) {
    const next = T(v);
    web += `L${f.x(v)},${f.y(next)}L${f.x(next)},${f.y(next)}`;
    v = next;
  }
  const gap = Math.abs(v0 - vStar);
  return (
    <>
      <Plot f={f} id="cobweb" label="Cobweb diagram of value iteration">
        <Axes f={f} xLabel="V" yLabel="TV" xTicks={[0, 2, 4, 6, 8, 10, 12]} yTicks={[0, 2, 4, 6, 8, 10, 12]} />
        <g clipPath="url(#cobweb-clip)">
          <path className="series s1 dashed" d={curve(f, (x) => x, -1, 13, 2)} />
          <path className="series s0" d={curve(f, T, -1, 13, 2)} />
          <path className="web" d={web} />
          {contraction && <circle className="fixed-point" cx={f.x(vStar)} cy={f.y(vStar)} r={5} />}
          {contraction && <text className="note" x={f.x(vStar) + 8} y={f.y(vStar) + 18}>V*</text>}
          <text className="series-label s1" x={f.x(12.6)} y={f.y(12.6) + 16} textAnchor="end">45°</text>
        </g>
        <Handle f={f} x={0} y={u} label="Flow payoff u" tone="ink" step={[0, 0.1]} text="u" textOffset={[10, 4]}
          onMove={(_, y) => setU(clamp(y, 0, 10))} />
        <Handle f={f} x={reach} y={u + beta * reach} label="Discount factor β (slope of T)" shape="square" step={[0, 0.115]} text={`β = ${fmt(beta)}`} textOffset={[-70, -10]}
          onMove={(_, y) => setBeta(clamp((y - u) / reach, -1.5, 1.5))} />
        <Handle f={f} x={v0} y={0} label="Initial guess V₀" tone="negative" step={[0.1, 0]} text="V₀" textOffset={[8, -10]}
          onMove={(x) => setV0(clamp(x, -0.5, 12.5))} />
      </Plot>
      <Readout>
        {contraction ? (
          <>
            <b>β = {fmt(beta)}</b>, V* = u/(1 − β) = {fmt(vStar)}. Error |V<sub>n</sub> − V*| = |β|<sup>n</sup>|V<sub>0</sub> − V*|:{" "}
            {[1, 2, 3, 5, 10].map((k) => `n = ${k}: ${fmt(Math.abs(beta) ** k * gap, 3)}`).join(" · ")}
          </>
        ) : <><b>β = {fmt(beta)}</b>: |β| ≥ 1, so T is not a contraction and the iterates do not converge.</>}
      </Readout>
    </>
  );
}
