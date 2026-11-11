"use client";

import { useState } from "react";
import { Axes, Handle, Plot, Readout, clamp, curve, fmt, frame } from "./plot";

// Steady-state Fisher relation i = r* + π against a Taylor rule with a zero lower bound,
// i = max{0, r* + π* + φ(π − π*)} (Benhabib, Schmitt-Grohé and Uribe, 2001).
const f = frame([-3.5, 8.5], [-1.5, 10]);
const rStar = 1;
const reach = 3; // horizontal distance from π* to the slope handle

export default function TaylorZlb() {
  const [target, setTarget] = useState(2);
  const [phi, setPhi] = useState(1.5);
  const [pi, setPi] = useState(4);
  const rule = (x: number) => Math.max(0, rStar + target + phi * (x - target));
  const trap = rule(-rStar) <= 0;
  const i = rule(pi);
  const pct = (v: number) => `${fmt(v, 1)}%`;
  return (
    <>
      <Plot f={f} id="taylor" label="Taylor rule and Fisher relation">
        <Axes f={f} xLabel="inflation π (%)" yLabel="policy rate i (%)" xTicks={[-2, 0, 2, 4, 6, 8]} yTicks={[0, 2, 4, 6, 8, 10]} />
        <g clipPath="url(#taylor-clip)">
          <line className="guide" x1={f.x(0)} x2={f.x(0)} y1={f.y(-1.5)} y2={f.y(10)} />
          <path className="series s1 dashed" d={curve(f, (x) => rStar + x, -3.5, 8.5, 2)} />
          <path className="series s0" d={curve(f, rule, -3.5, 8.5, 400)} />
          <line className="gap" x1={f.x(pi)} x2={f.x(pi)} y1={f.y(i)} y2={f.y(rStar + pi)} />
          {trap && <circle className="steady-trap" cx={f.x(-rStar)} cy={f.y(0)} r={6} />}
          {trap && <text className="note negative" x={f.x(-rStar) - 8} y={f.y(0) - 12} textAnchor="end">ZLB steady state</text>}
          <text className="series-label s1" x={f.x(6.3)} y={f.y(rStar + 6.3) + 18}>Fisher: i = r* + π</text>
        </g>
        <Handle f={f} x={target} y={rStar + target} label="Inflation target π*, along the Fisher line" tone="ink" step={[0.1, 0]} text="π*" textOffset={[-28, -6]}
          onMove={(x) => setTarget(clamp(x, -0.5, 5.5))} />
        <Handle f={f} x={target + reach} y={rStar + target + phi * reach} label="Rule slope φ" shape="square" step={[0, 0.15]} text={`φ = ${fmt(phi)}`}
          onMove={(_, y) => setPhi(clamp((y - rStar - target) / reach, 0, 2.5))} />
        <Handle f={f} x={pi} y={i} label="Current inflation π_t, along the rule" step={[0.1, 0]} text="πₜ" textOffset={[8, 16]}
          onMove={(x) => setPi(clamp(x, -3, 8))} />
      </Plot>
      <Readout>
        <b>φ = {fmt(phi)}</b>: {phi > 1 ? "the Taylor principle holds; the real rate rises when inflation rises." : "the Taylor principle fails; the real rate falls when inflation rises."}{" "}
        At π<sub>t</sub> = {pct(pi)} the rule sets i = {pct(i)}, a real rate of {pct(i - pi)} (red: the gap to r*).{" "}
        Steady states: π* = {pct(target)}{trap ? `, and a liquidity trap at π = ${pct(-rStar)}, i = 0.` : " only."}
      </Readout>
    </>
  );
}
