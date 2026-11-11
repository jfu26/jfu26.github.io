---
title: Recursive Equilibria as Fixed Points
date: 2026-08-01
summary: A short note on Bellman operators, contraction, and the economic content of recursive equilibrium.
tags:
  - Macroeconomics
  - Dynamic programming
  - Theory
---

An infinite-horizon economic problem becomes manageable when tomorrow's problem has the same structure as today's. Let the state be $s\in\mathcal S$, the feasible action set be $A(s)$, and the transition kernel be $Q(s'\mid s,a)$. The Bellman operator is

$$
(TV)(s)=\max_{a\in A(s)}\left\{u(s,a)+\beta\int V(s')Q(ds'\mid s,a)\right\}.
$$

## Why the fixed point matters

If $T$ is a contraction under the sup norm, Banach's fixed-point theorem gives a unique value function $V^*$ satisfying

$$
V^*=TV^*.
$$

The mathematical statement contains an economic restriction: discounting must dominate the propagation of continuation values. Under the standard bounded-return assumptions,

$$
\lVert TV-TW\rVert_\infty\leq \beta\lVert V-W\rVert_\infty,
\qquad 0<\beta<1.
$$

Value iteration therefore converges geometrically: $\lVert V_n - V^\ast\rVert \le \beta^n \lVert V_0 - V^\ast\rVert$. The scalar case $TV = u + \beta V$, the value of receiving $u$ forever, already shows the whole argument. Each step of the cobweb below applies $T$ once and reflects off the $45^\circ$ line.

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsxgraph@1.10.1/distrib/jsxgraph.css">
<figure class="interactive">
  <div id="cobweb-board" class="jxgbox" role="img" aria-label="Cobweb diagram of value iteration"></div>
  <div class="readout" id="cobweb-readout" aria-live="polite"></div>
  <figcaption>Figure 1. Successive approximation $V_{n+1} = TV_n$. Drag $V_0$ along the horizontal axis, $u$ along the vertical axis, and the square handle to change the slope $\beta$ of $T$. With $|\beta| < 1$ the iterates converge to $V^\ast = u/(1-\beta)$; with $\beta < 0$ they oscillate around it.</figcaption>
</figure>
<script src="https://cdn.jsdelivr.net/npm/jsxgraph@1.10.1/distrib/jsxgraphcore.js"></script>
<script>
(() => {
  const css = getComputedStyle(document.body), c = (n) => css.getPropertyValue(n).trim();
  const ink = c("--ink"), muted = c("--muted"), line = c("--line"), accent = c("--accent"), negative = c("--negative");
  JXG.Options.text.strokeColor = ink;
  JXG.Options.label.strokeColor = ink;
  const axis = (name, label) => ({ name, withLabel: true, strokeColor: muted, label: { position: "rt", strokeColor: muted, ...label }, ticks: { strokeColor: line, label: { strokeColor: muted } } });
  const board = JXG.JSXGraph.initBoard("cobweb-board", {
    boundingbox: [-1, 13, 13, -1], axis: true, showCopyright: false, showNavigation: false,
    pan: { enabled: false }, zoom: { enabled: false },
    defaultAxes: { x: axis("V", { anchorX: "right", offset: [-4, 14] }), y: axis("TV", { anchorY: "top", offset: [10, -4] }) },
  });
  board.create("functiongraph", [(x) => x], { strokeColor: muted, strokeWidth: 1.5, dash: 2, highlight: false });
  const u = board.create("glider", [0, 2, board.defaultAxes.y], { name: "u", size: 4, fillColor: ink, strokeColor: ink });
  const slopeLine = board.create("line", [[11.5, 0], [11.5, 1]], { visible: false });
  const handle = board.create("glider", [11.5, 11.2, slopeLine], { name: "slope β", face: "[]", size: 5, fillColor: accent, strokeColor: accent });
  const beta = () => (handle.Y() - u.Y()) / 11.5;
  const T = (v) => u.Y() + beta() * v;
  board.create("functiongraph", [T], { strokeColor: accent, strokeWidth: 2.5, highlight: false });
  const v0 = board.create("glider", [1, 0, board.defaultAxes.x], { name: "V₀", size: 4, fillColor: negative, strokeColor: negative });
  const web = board.create("curve", [[0], [0]], { strokeColor: negative, strokeWidth: 1.5, highlight: false });
  web.updateDataArray = function () {
    let v = v0.X();
    this.dataX = [v];
    this.dataY = [0];
    for (let n = 0; n < 40 && Math.abs(v) < 1e3; n += 1) {
      const next = T(v);
      this.dataX.push(v, next);
      this.dataY.push(next, next);
      v = next;
    }
  };
  const contraction = () => Math.abs(beta()) < 1;
  const vStar = () => u.Y() / (1 - beta());
  board.create("point", [vStar, vStar], { name: "V*", fixed: true, size: 4, fillColor: ink, strokeColor: ink, visible: contraction });

  const readout = document.getElementById("cobweb-readout");
  const render = () => {
    const b = beta();
    if (!contraction()) {
      readout.innerHTML = `<b>β = ${b.toFixed(2)}</b>: |β| ≥ 1, so T is not a contraction and the iterates do not converge.`;
      return;
    }
    const gap = Math.abs(v0.X() - vStar());
    const errors = [1, 2, 3, 5, 10].map((n) => `n = ${n}: ${(Math.abs(b) ** n * gap).toFixed(3)}`).join(" · ");
    readout.innerHTML = `<b>β = ${b.toFixed(2)}</b>, V* = u/(1 − β) = ${vStar().toFixed(2)}.<br>Error |V<sub>n</sub> − V*| = |β|<sup>n</sup>|V<sub>0</sub> − V*|: ${errors}`;
  };
  board.on("update", render);
  render();
})();
</script>

A minimal implementation of the general operator is:

```python
def bellman_step(value, utility, transition, beta):
    continuation = transition @ value
    return (utility + beta * continuation).max(axis=1)
```

## Interpretation before computation

The fixed-point representation is not merely a numerical device. It separates three objects:

1. current incentives, encoded by $u$;
2. beliefs about motion across states, encoded by $Q$;
3. intertemporal discipline, encoded by $\beta$.

Comparative statics should identify which of these objects moves. Without that distinction, a numerical change in $V^*$ has no clean economic interpretation.

> **Research note.** In models with ambiguity, occasionally binding constraints, or strategic complementarities, the relevant operator may fail to be a global contraction. Existence, uniqueness, and computation then become separate questions.
