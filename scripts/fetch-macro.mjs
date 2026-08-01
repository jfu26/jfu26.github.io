import { mkdir, writeFile } from "node:fs/promises";
import { whereAlpha3 } from "iso-3166-1";

const WEO = {
  NGDP_RPCH: ["Real GDP growth", "Annual percent change", "Gross Domestic Product"],
  NGDPD: ["GDP, current prices", "Billions of U.S. dollars", "Gross Domestic Product"],
  NGDPDPC: ["GDP per capita, current prices", "U.S. dollars per capita", "Gross Domestic Product"],
  PPPGDP: ["GDP, purchasing power parity", "Billions of international dollars", "Gross Domestic Product"],
  PPPPC: ["GDP per capita, purchasing power parity", "International dollars per capita", "Gross Domestic Product"],
  PPPSH: ["Share of world GDP, purchasing power parity", "Percent of world", "Gross Domestic Product"],
  PPPEX: ["Implied purchasing power parity conversion rate", "National currency per international dollar", "Gross Domestic Product"],
  PCPIPCH: ["Inflation, average consumer prices", "Annual percent change", "Inflation"],
  PCPIEPCH: ["Inflation, end of period consumer prices", "Annual percent change", "Inflation"],
  LP: ["Population", "Millions of people", "People"],
  LUR: ["Unemployment rate", "Percent", "People"],
  BCA: ["Current account balance", "Billions of U.S. dollars", "Current Account"],
  BCA_NGDPD: ["Current account balance", "Percent of GDP", "Current Account"],
  GGXONLB_NGDP: ["General government net lending / borrowing", "Percent of GDP", "Government Finance"],
  GGXWDG_NGDP: ["General government gross debt", "Percent of GDP", "Government Finance"],
};

const GMD_LABELS = {
  nGDP: "Nominal GDP", rGDP: "Real GDP", rGDP_pc: "Real GDP per capita", deflator: "GDP deflator",
  cons: "Total consumption", hcons: "Household consumption", gcons: "Government consumption",
  inv: "Gross capital formation", finv: "Gross fixed capital formation", exports: "Exports", imports: "Imports",
  CA: "Current account", USDfx: "U.S. dollar exchange rate", REER: "Real effective exchange rate",
  govexp: "Government expenditure", govrev: "Government revenue", govtax: "Government tax revenue",
  govdef: "Government deficit", govdebt: "Government debt", HPI: "House price index", rHPI: "Real house price index",
  CPI: "Consumer price index", infl: "Inflation", pop: "Population", unemp: "Unemployment rate",
  strate: "Short-term interest rate", ltrate: "Long-term interest rate", cbrate: "Central bank policy rate",
  SovDebtCrisis: "Sovereign debt crisis", CurrencyCrisis: "Currency crisis", BankingCrisis: "Banking crisis",
};

const countryIndex = {};

function rememberCountry(iso3, name = "") {
  const match = typeof iso3 === "string" ? whereAlpha3(iso3) : undefined;
  if (!match) return null;
  const entry = { mapId: match.numeric, country: name || match.country };
  countryIndex[iso3] = entry;
  return entry;
}

function makeSeries(iso3, values, name = "") {
  const country = rememberCountry(iso3, name);
  const clean = values
    .map(([year, value]) => [Number(year), Number(value)])
    .filter(([year, value]) => year >= 1000 && year <= 2100 && Number.isFinite(value))
    .sort((a, b) => a[0] - b[0]);
  return country && clean.length ? { iso3, ...country, values: clean } : null;
}

async function fetchJson(url, timeout = 45_000) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeout),
  });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  return response.json();
}

async function fetchWeo() {
  try {
    const entries = await Promise.all(Object.entries(WEO).map(async ([id, [label, unit, category]]) => {
      const body = await fetchJson(`https://www.imf.org/external/datamapper/api/v2/${id}`);
      const series = Object.entries(body.values?.[id] || {})
        .map(([iso3, values]) => makeSeries(iso3, Object.entries(values)))
        .filter(Boolean);
      return [id, { label, unit, category, series }];
    }));
    return {
      label: "IMF World Economic Outlook",
      url: "https://www.imf.org/external/datamapper/datasets/WEO",
      note: "All indicators published in the current IMF WEO DataMapper dataset, including staff projections.",
      metrics: Object.fromEntries(entries),
    };
  } catch (error) {
    console.warn(`Official WEO API unavailable; using the DBnomics WEO mirror: ${error.message}`);
    const entries = await Promise.all(Object.entries(WEO).map(async ([id, [label, unit, category]]) => {
      const body = await fetchJson(`https://api.db.nomics.world/v22/series/IMF/WEO:2025-04/.${id}?observations=1&limit=1000`);
      const series = (body.series?.docs || []).map((item) => makeSeries(
        item.dimensions["weo-country"],
        item.period.map((year, index) => [year, item.value[index]]),
        item.series_name.split(" – ")[0],
      )).filter(Boolean);
      return [id, { label, unit, category, series }];
    }));
    return {
      label: "IMF World Economic Outlook · April 2025 mirror",
      url: "https://db.nomics.world/IMF/WEO:2025-04",
      note: "Complete April 2025 WEO indicator set served through DBnomics because the current IMF endpoint was unavailable during refresh.",
      metrics: Object.fromEntries(entries),
    };
  }
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

function gmdCategory(id) {
  if (/GDP|deflator|cons|inv/.test(id)) return "National accounts";
  if (/exports|imports|^CA|fx|REER/.test(id)) return "External sector";
  if (/gov/.test(id)) return "Government finance";
  if (/^M[0-4]$|rate/.test(id)) return "Money and interest rates";
  if (/Crisis/.test(id)) return "Financial crises";
  return "Prices, labour, and population";
}

function gmdLabel(id) {
  const suffix = id.endsWith("_GDP") ? " · % of GDP" : id.endsWith("_USD") ? " · USD" : "";
  const base = id.replace(/_GDP$|_USD$/, "");
  const government = base.startsWith("gen_") ? `General ${GMD_LABELS[base.slice(4)]?.toLowerCase() || base.slice(4).replaceAll("_", " ")}`
    : base.startsWith("cgov") ? `Central government ${base.slice(4).replaceAll("_", " ")}`
      : GMD_LABELS[base] || base.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
  return `${government}${suffix}`;
}

function gmdUnit(id) {
  if (id.endsWith("_GDP")) return "Percent of GDP";
  if (id.endsWith("_USD")) return id.includes("_pc") ? "U.S. dollars per capita" : "Millions of U.S. dollars";
  if (["infl", "unemp", "strate", "ltrate", "cbrate"].includes(id)) return "Percent";
  if (id.includes("Crisis")) return "Indicator (0/1)";
  if (["CPI", "HPI", "rHPI", "REER", "deflator"].includes(id)) return "Index, 2015 = 100";
  if (id === "pop") return "Millions of people";
  if (id === "USDfx") return "National currency per U.S. dollar";
  if (id === "rGDP_pc") return "Local currency per capita";
  return "Millions of local currency units";
}

async function fetchGmd() {
  const response = await fetch("https://www.globalmacrodata.com/GMD.csv", { signal: AbortSignal.timeout(90_000) });
  if (!response.ok) throw new Error(`${response.status} from Global Macro Database`);
  const lines = (await response.text()).split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  const indexOf = (name) => headers.indexOf(name);
  const excluded = new Set(["countryname", "ISO3", "id", "year", "income_group"]);
  const variables = headers.filter((name) => !excluded.has(name) && !name.startsWith("forecast_"));
  const columns = Object.fromEntries(variables.map((name) => [name, indexOf(name)]));
  const raw = Object.fromEntries(variables.map((name) => [name, new Map()]));

  for (const line of lines.slice(1)) {
    if (!line) continue;
    const cells = parseCsvLine(line);
    const iso3 = cells[indexOf("ISO3")];
    const year = Number(cells[indexOf("year")]);
    const knownCountry = rememberCountry(iso3, cells[indexOf("countryname")]);
    if (!knownCountry || !Number.isFinite(year)) continue;
    for (const variable of variables) {
      const source = cells[columns[variable]];
      const value = Number(source);
      if (source === "" || !Number.isFinite(value)) continue;
      const values = raw[variable].get(iso3) || [];
      values.push([year, value]);
      raw[variable].set(iso3, values);
    }
  }

  const metrics = Object.fromEntries(variables.map((id) => [id, {
    label: gmdLabel(id),
    unit: gmdUnit(id),
    category: gmdCategory(id),
    series: [...raw[id]].map(([iso3, values]) => makeSeries(iso3, values)).filter(Boolean),
  }]));
  return {
    label: "Global Macro Database",
    url: "https://www.globalmacrodata.com/",
    note: `All ${variables.length} harmonized numeric series in the current GMD release. Müller, Xu, Lehbib & Chen (2025), CC BY-NC-SA 4.0.`,
    metrics,
  };
}

function unitFromLabel(label) {
  const match = label.match(/\(([^()]*)\)\s*$/);
  return match?.[1] || "Source units";
}

function wdiCategory(code, label) {
  const text = `${code} ${label}`.toLowerCase();
  if (/gdp|national accounts|value added|consumption|capital formation/.test(text)) return "National accounts";
  if (/trade|export|import|current account|exchange rate|balance of payments/.test(text)) return "Trade and external sector";
  if (/debt|revenue|tax|government|fiscal/.test(text)) return "Public finance";
  if (/inflation|price|interest|money|credit|bank|financial/.test(text)) return "Prices and finance";
  if (/employment|unemployment|labor|labour|population/.test(text)) return "Labour and population";
  return "Development indicators";
}

async function fetchWdiCatalog() {
  const body = await fetchJson("https://api.db.nomics.world/v22/series/WB/WDI?q=NY.GDP.MKTP.KD.ZG&observations=0&limit=1");
  const labels = body.dataset?.dimensions_values_labels?.indicator || {};
  const countryLabels = body.dataset?.dimensions_values_labels?.country || {};
  for (const [iso3, name] of Object.entries(countryLabels)) rememberCountry(iso3, name);
  const metrics = Object.fromEntries(Object.entries(labels).map(([id, label]) => [id, {
    label,
    unit: unitFromLabel(label),
    category: wdiCategory(id, label),
    series: [],
  }]));
  return {
    label: "DBnomics · World Development Indicators",
    url: "https://db.nomics.world/WB/WDI",
    note: `Complete ${Object.keys(metrics).length.toLocaleString("en")} indicator catalog. Country series load directly from the DBnomics API when selected.`,
    live: true,
    metrics,
  };
}

await mkdir("public/data", { recursive: true });
await mkdir("public/data/series/weo", { recursive: true });
await mkdir("public/data/series/gmd", { recursive: true });
const [weo, gmd, dbnomics, world] = await Promise.all([
  fetchWeo(),
  fetchGmd(),
  fetchWdiCatalog(),
  fetchJson("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
]);

const catalogSource = (source) => ({
  ...source,
  metrics: Object.fromEntries(Object.entries(source.metrics).map(([id, value]) => [id, {
    label: value.label,
    unit: value.unit,
    category: value.category,
  }])),
});
const seriesFiles = [weo, gmd].flatMap((source, sourceIndex) => {
  const id = sourceIndex === 0 ? "weo" : "gmd";
  return Object.entries(source.metrics).map(([metric, value]) =>
    writeFile(`public/data/series/${id}/${metric}.json`, JSON.stringify(value.series)),
  );
});

await Promise.all([
  ...seriesFiles,
  writeFile("public/data/catalog.json", JSON.stringify({
    generatedAt: new Date().toISOString(),
    countries: countryIndex,
    sources: {
      weo: catalogSource(weo),
      gmd: catalogSource(gmd),
      dbnomics: catalogSource(dbnomics),
    },
  })),
  writeFile("public/data/world.json", JSON.stringify(world)),
]);

console.log(`Macro archive generated: ${Object.keys(weo.metrics).length} WEO, ${Object.keys(gmd.metrics).length} GMD, ${Object.keys(dbnomics.metrics).length} DBnomics indicators.`);
