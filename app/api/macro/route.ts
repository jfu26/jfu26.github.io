import { whereAlpha3 } from "iso-3166-1";

export const runtime = "edge";

type Metric = "growth" | "inflation" | "debt";
type Source = "weo" | "gmd" | "dbnomics";
type Datum = {
  iso3: string;
  mapId: string;
  country: string;
  year: number;
  value: number;
};

const METRICS = {
  weo: {
    growth: "NGDP_RPCH",
    inflation: "PCPIPCH",
    debt: "GGXWDG_NGDP",
  },
  dbnomics: {
    growth: "NY.GDP.MKTP.KD.ZG",
    inflation: "FP.CPI.TOTL.ZG",
    debt: "GC.DOD.TOTL.GD.ZS",
  },
} as const;

function asDatum(iso3: string, country: string, year: number, value: unknown): Datum | null {
  const numeric = Number(value);
  const iso = whereAlpha3(iso3);
  if (!iso || !Number.isFinite(numeric)) return null;
  return { iso3, mapId: iso.numeric, country: country || iso.country, year, value: numeric };
}

function observation(
  periods: string[],
  values: unknown[],
  requestedYear: number,
) {
  const exact = periods.indexOf(String(requestedYear));
  if (exact >= 0 && Number.isFinite(Number(values[exact]))) {
    return { year: requestedYear, value: values[exact] };
  }
  for (let index = periods.length - 1; index >= 0; index -= 1) {
    if (Number(periods[index]) <= requestedYear && Number.isFinite(Number(values[index]))) {
      return { year: Number(periods[index]), value: values[index] };
    }
  }
  return null;
}

async function fromWeo(metric: Metric, year: number) {
  const subject = METRICS.weo[metric];
  const url = `https://api.db.nomics.world/v22/series/IMF/WEO:2025-04/.${subject}?observations=1&limit=1000`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("The IMF WEO feed is temporarily unavailable.");
  const json = await response.json() as {
    series?: { docs?: Array<{
      dimensions: { "weo-country": string };
      period: string[];
      value: unknown[];
      series_name: string;
    }> };
  };
  const data = (json.series?.docs || []).flatMap((series) => {
    const hit = observation(series.period, series.value, year);
    const country = series.series_name.split(" – ")[0];
    const datum = hit && asDatum(series.dimensions["weo-country"], country, hit.year, hit.value);
    return datum ? [datum] : [];
  });
  return {
    data,
    sourceLabel: "IMF WEO · Apr 2025",
    sourceUrl: "https://data.imf.org/Datasets/WEO",
    note: "April 2025 WEO values are served through DBnomics and include IMF staff projections. The new IMF portal currently blocks edge requests, so the vintage is shown explicitly.",
  };
}

async function fromDbnomics(metric: Metric, year: number) {
  const indicator = METRICS.dbnomics[metric];
  const url = `https://api.db.nomics.world/v22/series/WB/WDI?q=${encodeURIComponent(indicator)}&observations=1&limit=1000`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("The DBnomics feed is temporarily unavailable.");
  const json = await response.json() as {
    series?: { docs?: Array<{
      dimensions: { country: string; indicator: string };
      period: string[];
      value: unknown[];
      series_name: string;
    }> };
  };
  const data = (json.series?.docs || []).flatMap((series) => {
    if (series.dimensions.indicator !== indicator) return [];
    const hit = observation(series.period, series.value, year);
    const country = series.series_name.split(" – ").at(-1) || series.dimensions.country;
    const datum = hit && asDatum(series.dimensions.country, country, hit.year, hit.value);
    return datum ? [datum] : [];
  });
  return {
    data,
    sourceLabel: "DBnomics · WDI",
    sourceUrl: "https://db.nomics.world/WB/WDI",
    note: "DBnomics preserves provider values and missing observations without interpolation. This view uses its World Development Indicators feed.",
  };
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
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

async function fromGmd(metric: Metric, requestedYear: number) {
  const response = await fetch("https://www.globalmacrodata.com/GMD.csv");
  if (!response.ok) throw new Error("The Global Macro Database feed is temporarily unavailable.");
  const text = await response.text();
  const lines = text.split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  const at = (name: string) => headers.indexOf(name);
  const indexes = {
    country: at("countryname"),
    iso3: at("ISO3"),
    year: at("year"),
    growth: at("rGDP"),
    inflation: at("infl"),
    debt: at("gen_govdebt_GDP"),
  };
  const rows = new Map<string, { country: string; iso3: string; year: number; value: number }[]>();
  for (let index = 1; index < lines.length; index += 1) {
    const cells = parseCsvLine(lines[index]);
    const iso3 = cells[indexes.iso3];
    const year = Number(cells[indexes.year]);
    const raw = cells[indexes[metric]];
    if (!iso3 || year > requestedYear || raw === "" || !Number.isFinite(Number(raw))) continue;
    const list = rows.get(iso3) || [];
    list.push({ country: cells[indexes.country], iso3, year, value: Number(raw) });
    rows.set(iso3, list);
  }
  const data = [...rows.values()].flatMap((series) => {
    series.sort((a, b) => a.year - b.year);
    const latest = series.at(-1);
    if (!latest) return [];
    let value = latest.value;
    if (metric === "growth") {
      const previous = series.at(-2);
      if (!previous || previous.value === 0) return [];
      value = ((latest.value / previous.value) - 1) * 100;
    }
    const datum = asDatum(latest.iso3, latest.country, latest.year, value);
    return datum ? [datum] : [];
  });
  return {
    data,
    sourceLabel: "Global Macro Database",
    sourceUrl: "https://www.globalmacrodata.com/",
    note: "Global Macro Database by Müller, Xu, Lehbib & Chen (2025), CC BY-NC-SA 4.0. Real GDP growth is calculated from consecutive published levels; other indicators are shown directly.",
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const metric = (params.get("metric") || "growth") as Metric;
  const source = (params.get("source") || "weo") as Source;
  const year = Math.max(1900, Math.min(2030, Number(params.get("year")) || 2026));
  if (!["growth", "inflation", "debt"].includes(metric) || !["weo", "gmd", "dbnomics"].includes(source)) {
    return Response.json({ error: "Unsupported source or metric." }, { status: 400 });
  }
  try {
    const result = source === "weo"
      ? await fromWeo(metric, year)
      : source === "gmd"
        ? await fromGmd(metric, year)
        : await fromDbnomics(metric, year);
    return Response.json(
      { ...result, metric, source, requestedYear: year, fetchedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected data error." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
