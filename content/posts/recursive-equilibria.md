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

Value iteration therefore converges geometrically. A minimal implementation is:

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
