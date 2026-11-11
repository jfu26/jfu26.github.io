---
title: Recursive Equilibria as Fixed Points
date: 2026-08-01
summary: A short note on Bellman operators, contraction, and the economic content of recursive equilibrium.
section: others
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

<figure data-figure="cobweb"><span class="float-label">Figure 1.</span> Successive approximation $V_{n+1} = TV_n$. Drag $V_0$ along the horizontal axis, $u$ along the vertical axis, and the square handle to change the slope $\beta$ of $T$. With $|\beta| < 1$ the iterates converge to $V^\ast = u/(1-\beta)$; with $\beta < 0$ they oscillate around it.</figure>

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
