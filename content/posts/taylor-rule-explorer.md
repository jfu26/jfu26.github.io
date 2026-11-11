---
title: A Taylor Rule Explorer
date: 2026-11-10
summary: An interactive note on how the inflation and output-gap coefficients of a simple policy rule move the prescribed policy rate.
tags:
  - Monetary policy
  - Interactive
---

A simple Taylor (1993) rule prescribes the nominal policy rate as

$$
i_t = r^\ast + \pi_t + \phi_\pi\,(\pi_t-\pi^\ast) + \phi_x\, x_t ,
$$

where $r^\ast$ is the neutral real rate, $\pi^\ast$ the inflation target, and $x_t$ the output gap. The Taylor principle requires the total response of $i_t$ to inflation, $1+\phi_\pi$, to exceed one, so that real rates rise when inflation rises.

<div class="widget" id="taylor">
  <label><span>Inflation $\pi_t$ (%)</span><input type="range" name="pi" min="-2" max="10" step="0.1" value="3"><output></output></label>
  <label><span>Output gap $x_t$ (%)</span><input type="range" name="x" min="-6" max="6" step="0.1" value="0"><output></output></label>
  <label><span>$\phi_\pi$</span><input type="range" name="phiPi" min="0" max="2" step="0.05" value="0.5"><output></output></label>
  <label><span>$\phi_x$</span><input type="range" name="phiX" min="0" max="1.5" step="0.05" value="0.5"><output></output></label>
  <p>Prescribed policy rate, with $r^\ast = 0.5\%$ and $\pi^\ast = 2\%$: <strong data-rate></strong></p>
</div>

<script>
(() => {
  const root = document.getElementById("taylor");
  const value = (name) => Number(root.querySelector(`[name=${name}]`).value);
  const update = () => {
    for (const input of root.querySelectorAll("input")) input.nextElementSibling.textContent = Number(input.value).toFixed(2);
    const rate = 0.5 + value("pi") + value("phiPi") * (value("pi") - 2) + value("phiX") * value("x");
    root.querySelector("[data-rate]").textContent = `${rate.toFixed(2)}%`;
  };
  root.addEventListener("input", update);
  update();
})();
</script>

## Reading the rule

With $\phi_\pi = 0.5$ and $\phi_x = 0.5$, a one-point rise in inflation raises the policy rate by $1.5$ points. Setting $\phi_\pi$ to zero leaves the real rate unchanged when inflation moves, which is the boundary of the Taylor principle in this simple form.
