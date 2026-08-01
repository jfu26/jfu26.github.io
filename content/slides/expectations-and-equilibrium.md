---
title: Expectations and Equilibrium
date: 2026-08-01
summary: A short reveal.js deck illustrating Markdown, mathematics, code, and speaker notes.
---

# Expectations and Equilibrium

### A compact macroeconomic example

$x_t=a+\beta\mathbb E_t[x_{t+1}]$

Note:
The central question is how beliefs about tomorrow enter equilibrium today.

---

## Stationary fixed point

If $x_t=x^*$,

$$
x^*=\frac{a}{1-\beta}.
$$

- Existence is algebraic.
- Stability requires $|\beta|<1$.

---

## Iteration

```python [1|2-3|4]
x = 0.0
for _ in range(20):
    x = a + beta * x
print(x)
```

The error contracts at rate $|\beta|$.

---

## Economic reading

$$
\frac{\partial x^*}{\partial a}=\frac{1}{1-\beta}.
$$

Persistence amplifies the response to fundamentals.

Note:
This multiplier is meaningful only after the primitive disturbance represented by a is identified.
