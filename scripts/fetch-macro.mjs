import { mkdir, writeFile } from "node:fs/promises";
import { whereAlpha3 } from "iso-3166-1";

const YEAR_MIN = 1990;
const YEAR_MAX = 2030;
const WEO = { growth: "NGDP_RPCH", inflation: "PCPIPCH", debt: "GGXWDG_NGDP" };
const WDI = {
  growth: "NY.GDP.MKTP.KD.ZG",
  inflation: "FP.CPI.TOTL.ZG",
  debt: "GC.DOD.TOTL.GD.ZS",
};

const validYear = (year) => year >= YEAR_MIN && year <= YEAR_MAX;
const country = (iso3) => typeof iso3 === "string" && iso3
  ? whereAlpha3(iso3)
  : undefined;

function makeSeries(iso3, values, name = "") {
  const iso = country(iso3);
  const clean = values
    .map(([year, value]) => [Number(year), Number(value)])
    .filter(([year, value]) => validYear(year) && Number.isFinite(value))
    .sort((a, b) => a[0] - b[0]);
  return iso && clean.length
    ? { iso3, mapId: iso.numeric, country: name || iso.country, values: clean }
    : null;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  return response.json();
}

async function fetchWeo() {
  try {
    const entries = await Promise.all(Object.entries(WEO).map(async ([metric, indicator]) => {
      const body = await fetchJson(`https://www.imf.org/external/datamapper/api/v2/${indicator}`);
      const series = Object.entries(body.values?.[indicator] || {})
        .map(([iso3, values]) => makeSeries(iso3, Object.entries(values)))
        .filter(Boolean);
      return [metric, series];
    }));
    return {
      label: "IMF World Economic Outlook",
      url: "https://data.imf.org/Datasets/WEO",
      note: "Current IMF DataMapper values, including staff projections for forecast years.",
      metrics: Object.fromEntries(entries),
    };
  } catch (error) {
    console.warn(`Official WEO API unavailable; using DBnomics mirror: ${error.message}`);
    const entries = await Promise.all(Object.entries(WEO).map(async ([metric, indicator]) => {
      const body = await fetchJson(`https://api.db.nomics.world/v22/series/IMF/WEO:2025-04/.${indicator}?observations=1&limit=1000`);
      const series = (body.series?.docs || []).map((item) =>
        makeSeries(
          item.dimensions["weo-country"],
          item.period.map((year, index) => [year, item.value[index]]),
          item.series_name.split(" – ")[0],
        ),
      ).filter(Boolean);
      return [metric, series];
    }));
    return {
      label: "IMF WEO · Apr 2025",
      url: "https://data.imf.org/Datasets/WEO",
      note: "April 2025 WEO vintage served through DBnomics; forecast values are IMF staff projections.",
      metrics: Object.fromEntries(entries),
    };
  }
}

async function fetchDbnomics() {
  const entries = await Promise.all(Object.entries(WDI).map(async ([metric, indicator]) => {
    const body = await fetchJson(`https://api.db.nomics.world/v22/series/WB/WDI?q=${encodeURIComponent(indicator)}&observations=1&limit=1000`);
    const series = (body.series?.docs || [])
      .filter((item) => item.dimensions.indicator === indicator)
      .map((item) =>
        makeSeries(
          item.dimensions.country,
          item.period.map((year, index) => [year, item.value[index]]),
          item.series_name.split(" – ").at(-1),
        ),
      )
      .filter(Boolean);
    return [metric, series];
  }));
  return {
    label: "DBnomics · World Development Indicators",
    url: "https://db.nomics.world/WB/WDI",
    note: "DBnomics preserves provider values and missing observations without interpolation.",
    metrics: Object.fromEntries(entries),
  };
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells;
}

async function fetchGmd() {
  const response = await fetch("https://www.globalmacrodata.com/GMD.csv");
  if (!response.ok) throw new Error(`${response.status} from Global Macro Database`);
  const lines = (await response.text()).split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  const at = (name) => headers.indexOf(name);
  const index = {
    iso3: at("ISO3"),
    year: at("year"),
    growth: at("rGDP"),
    inflation: at("infl"),
    debt: at("gen_govdebt_GDP"),
  };
  const raw = {
    growth: new Map(),
    inflation: new Map(),
    debt: new Map(),
  };
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const iso3 = cells[index.iso3];
    const year = Number(cells[index.year]);
    if (!country(iso3) || !validYear(year)) continue;
    for (const metric of Object.keys(raw)) {
      const source = cells[index[metric]];
      const value = Number(source);
      if (source === "" || !Number.isFinite(value)) continue;
      const values = raw[metric].get(iso3) || [];
      values.push([year, value]);
      raw[metric].set(iso3, values);
    }
  }
  const metrics = {};
  for (const metric of Object.keys(raw)) {
    metrics[metric] = [...raw[metric]].map(([iso3, values]) => {
      values.sort((a, b) => a[0] - b[0]);
      const transformed = metric === "growth"
        ? values.slice(1).flatMap(([year, value], position) =>
            values[position][1] ? [[year, ((value / values[position][1]) - 1) * 100]] : [])
        : values;
      return makeSeries(iso3, transformed);
    }).filter(Boolean);
  }
  return {
    label: "Global Macro Database",
    url: "https://www.globalmacrodata.com/",
    note: "Müller, Xu, Lehbib & Chen (2025), CC BY-NC-SA 4.0. Growth is calculated from consecutive published real GDP levels.",
    metrics,
  };
}

await mkdir("public/data", { recursive: true });
const [weo, gmd, dbnomics, world] = await Promise.all([
  fetchWeo(),
  fetchGmd(),
  fetchDbnomics(),
  fetchJson("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
]);
await Promise.all([
  writeFile("public/data/macro.json", JSON.stringify({
    generatedAt: new Date().toISOString(),
    sources: { weo, gmd, dbnomics },
  })),
  writeFile("public/data/world.json", JSON.stringify(world)),
]);
console.log("Daily macro archive generated.");
