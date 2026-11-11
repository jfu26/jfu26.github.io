---
title: The Taylor Principle and the Zero Lower Bound
date: 2026-11-10
summary: An interactive diagram of a Taylor rule against the Fisher relation, showing the Taylor principle and the second, deflationary steady state created by the zero lower bound.
tags:
  - Monetary policy
  - Interactive
---

In steady state the Fisher relation ties the nominal rate to inflation one for one, $i = r^\ast + \pi$. A Taylor rule with a zero lower bound sets

$$
i = \max\bigl\{0,\; r^\ast + \pi^\ast + \phi\,(\pi - \pi^\ast)\bigr\}.
$$

Steady states are the intersections of the two schedules. The rule crosses the Fisher line at the target $\pi^\ast$ by construction. When $\phi > 1$ (the Taylor principle) the rule is steeper than the Fisher line, and because it cannot fall below zero it must cross the Fisher line a second time at $\pi = -r^\ast$, $i = 0$. This is the point made by Benhabib, Schmitt-Grohé and Uribe (2001): an active rule plus the lower bound implies a second, unintended steady state with deflation.

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsxgraph@1.10.1/distrib/jsxgraph.css">
<figure class="interactive">
  <div id="taylor-board" class="jxgbox" role="img" aria-label="Taylor rule and Fisher relation diagram"></div>
  <div class="readout" id="taylor-readout" aria-live="polite"></div>
  <figcaption>Figure 1. Policy rate against inflation, with $r^\ast = 1\%$. Drag $\pi^\ast$ along the Fisher line (dashed) to move the target, the square handle to change the rule's slope $\phi$, and $\pi_t$ along the rule. The red segment is the real-rate gap $(i - \pi) - r^\ast$.</figcaption>
</figure>
<script src="https://cdn.jsdelivr.net/npm/jsxgraph@1.10.1/distrib/jsxgraphcore.js"></script>
<script>
(() => {
  const css = getComputedStyle(document.body), c = (n) => css.getPropertyValue(n).trim();
  const ink = c("--ink"), muted = c("--muted"), line = c("--line"), accent = c("--accent"), negative = c("--negative");
  JXG.Options.text.strokeColor = ink;
  JXG.Options.label.strokeColor = ink;
  const axis = (name, label) => ({ name, withLabel: true, strokeColor: muted, label: { position: "rt", strokeColor: muted, ...label }, ticks: { strokeColor: line, label: { strokeColor: muted } } });
  const board = JXG.JSXGraph.initBoard("taylor-board", {
    boundingbox: [-3.5, 10, 8.5, -1.5], axis: true, showCopyright: false, showNavigation: false,
    pan: { enabled: false }, zoom: { enabled: false },
    defaultAxes: { x: axis("inflation π (%)", { anchorX: "right", offset: [-4, 14] }), y: axis("policy rate i (%)", { anchorY: "top", offset: [10, -4] }) },
  });
  const rStar = 1;
  const fisher = board.create("functiongraph", [(x) => rStar + x], { strokeColor: muted, strokeWidth: 1.5, dash: 2, highlight: false });
  const target = board.create("glider", [2, 3, fisher], { name: "π*", size: 4, fillColor: ink, strokeColor: ink });
  const slopeLine = board.create("line", [[() => target.X() + 3, 0], [() => target.X() + 3, 1]], { visible: false });
  const handle = board.create("glider", [5, 7.5, slopeLine], { name: "slope φ", face: "[]", size: 5, fillColor: accent, strokeColor: accent });
  const phi = () => (handle.Y() - target.Y()) / (handle.X() - target.X());
  const rule = board.create("functiongraph", [(x) => Math.max(0, target.Y() + phi() * (x - target.X()))], { strokeColor: accent, strokeWidth: 2.5, highlight: false });
  const today = board.create("glider", [4, 6, rule], { name: "π_t", size: 4, fillColor: accent, strokeColor: accent });
  board.create("segment", [today, [() => today.X(), () => rStar + today.X()]], { strokeColor: negative, strokeWidth: 2, dash: 1, fixed: true, highlight: false });
  const trapExists = () => target.Y() + phi() * (-rStar - target.X()) <= 0;
  board.create("point", [-rStar, 0], { name: "ZLB steady state", fixed: true, size: 4, fillColor: negative, strokeColor: negative, visible: trapExists });

  const readout = document.getElementById("taylor-readout");
  const pct = (v) => `${v.toFixed(1)}%`;
  const render = () => {
    const p = phi(), pi = today.X(), i = rule.Y(pi);
    readout.innerHTML = [
      `<b>φ = ${p.toFixed(2)}</b>: ${p > 1 ? "Taylor principle holds; the real rate rises when inflation rises." : "Taylor principle fails; the real rate falls when inflation rises."}`,
      `At π<sub>t</sub> = ${pct(pi)} the rule sets i = ${pct(i)}, a real rate i − π = ${pct(i - pi)}.`,
      `Steady states: π* = ${pct(target.X())}${trapExists() ? `, and a liquidity trap at π = ${pct(-rStar)}, i = 0.` : " only."}`,
    ].join("<br>");
  };
  board.on("update", render);
  render();
})();
</script>

## Reading the diagram

Steepen the rule and the second intersection appears at the lower bound; flatten it below the Fisher line and the deflationary steady state disappears, but so does the Taylor principle. Moving $\pi^\ast$ up shifts the intended steady state along the Fisher line without changing the location of the trap, which is fixed at $\pi = -r^\ast$. The diagram describes steady states only; whether the economy converges to either point depends on the dynamics around them.
