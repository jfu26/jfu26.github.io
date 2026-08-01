"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";

type Source = "weo" | "gmd" | "dbnomics";
type Series = {
  iso3: string;
  mapId: string;
  country: string;
  values: [year: number, value: number][];
};
type Indicator = {
  label: string;
  unit: string;
  category: string;
};
type SourceBlock = {
  label: string;
  url: string;
  note: string;
  live?: boolean;
  metrics: Record<string, Indicator>;
};
type Archive = {
  generatedAt: string;
  countries: Record<string, { mapId: string; country: string }>;
  sources: Record<Source, SourceBlock>;
};
type Datum = {
  iso3: string;
  mapId: string;
  country: string;
  year: number;
  value: number;
};
type MapFeature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string }> & { id?: string | number };

const SOURCES: { id: Source; label: string }[] = [
  { id: "weo", label: "IMF WEO" },
  { id: "gmd", label: "Global Macro Database" },
  { id: "dbnomics", label: "DBnomics · WDI" },
];

const DEFAULTS: Record<Source, string> = {
  weo: "NGDP_RPCH",
  gmd: "infl",
  dbnomics: "NY.GDP.MKTP.KD.ZG",
};

function observationAt(series: Series, requestedYear: number): Datum | null {
  const exact = series.values.find(([year]) => year === requestedYear);
  const nearest = exact || [...series.values].reverse().find(([year]) => year <= requestedYear);
  return nearest
    ? { iso3: series.iso3, mapId: series.mapId, country: series.country, year: nearest[0], value: nearest[1] }
    : null;
}

function formatValue(value: number) {
  const absolute = Math.abs(value);
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: absolute >= 1000 ? 0 : absolute >= 100 ? 1 : 2,
    notation: absolute >= 1_000_000 ? "compact" : "standard",
  }).format(value);
}

function mapColor(value: number | undefined, extent: number) {
  if (value === undefined) return "#e8e7e2";
  const intensity = Math.min(1, Math.abs(value) / Math.max(extent, 1));
  const target = value < 0 ? "#9a5b4c" : "#255f68";
  return `color-mix(in srgb, #e5e3dc ${(1 - intensity) * 100}%, ${target})`;
}

async function fetchDbnomicsSeries(indicator: string, countries: Archive["countries"], signal: AbortSignal) {
  const url = `https://api.db.nomics.world/v22/series/WB/WDI?q=${encodeURIComponent(indicator)}&observations=1&limit=1000`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("DBnomics is temporarily unavailable.");
  const body = await response.json();
  return (body.series?.docs || [])
    .filter((item: { dimensions?: { indicator?: string; country?: string } }) => item.dimensions?.indicator === indicator)
    .flatMap((item: { dimensions: { country: string }; period: string[]; value: (number | null)[] }) => {
      const iso3 = item.dimensions.country;
      const country = countries[iso3];
      if (!country) return [];
      const values = item.period
        .map((period, index) => [Number(period), Number(item.value[index])] as [number, number])
        .filter(([year, value]) => Number.isFinite(year) && Number.isFinite(value));
      return values.length ? [{ iso3, ...country, values }] : [];
    });
}

async function fetchSeries(source: Source, indicator: string, countries: Archive["countries"], signal: AbortSignal) {
  if (source === "dbnomics") return fetchDbnomicsSeries(indicator, countries, signal);
  const response = await fetch(`/data/series/${source}/${encodeURIComponent(indicator)}.json`, { signal });
  if (!response.ok) throw new Error("This indicator is temporarily unavailable.");
  return response.json() as Promise<Series[]>;
}

function CountryBars({ series, unit }: { series?: Series; unit: string }) {
  const values = (series?.values || []).slice(-14);
  if (!values.length) return <p className="chart-empty">No time series is available for this selection.</p>;

  const width = 760;
  const height = 280;
  const margin = { top: 24, right: 22, bottom: 38, left: 46 };
  const plotHeight = height - margin.top - margin.bottom;
  const minimum = Math.min(0, ...values.map(([, value]) => value));
  const maximum = Math.max(0, ...values.map(([, value]) => value));
  const span = maximum - minimum || 1;
  const y = (value: number) => margin.top + ((maximum - value) / span) * plotHeight;
  const zero = y(0);
  const step = (width - margin.left - margin.right) / values.length;
  const barWidth = Math.max(8, step * 0.56);
  const depth = Math.min(7, step * 0.14);

  return (
    <svg className="country-bars" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${series?.country} annual values, ${unit}`}>
      <line className="bar-zero" x1={margin.left} x2={width - margin.right} y1={zero} y2={zero} />
      <text className="bar-axis-label" x={margin.left - 8} y={margin.top + 4} textAnchor="end">{formatValue(maximum)}</text>
      <text className="bar-axis-label" x={margin.left - 8} y={height - margin.bottom} textAnchor="end">{formatValue(minimum)}</text>
      {values.map(([year, value], index) => {
        const x = margin.left + index * step + (step - barWidth) / 2;
        const valueY = y(value);
        const top = Math.min(valueY, zero);
        const barHeight = Math.max(1, Math.abs(zero - valueY));
        const tone = value < 0 ? "negative" : "positive";
        return (
          <g className={`bar-mark ${tone}`} key={year}>
            <title>{`${year}: ${formatValue(value)} ${unit}`}</title>
            <rect className="bar-front" x={x} y={top} width={barWidth} height={barHeight} />
            <polygon className="bar-side" points={`${x + barWidth},${top} ${x + barWidth + depth},${top - depth} ${x + barWidth + depth},${top + barHeight - depth} ${x + barWidth},${top + barHeight}`} />
            <polygon className="bar-top" points={`${x},${top} ${x + depth},${top - depth} ${x + barWidth + depth},${top - depth} ${x + barWidth},${top}`} />
            {(index === 0 || index === values.length - 1 || index % 3 === 0) && (
              <text className="bar-year" x={x + barWidth / 2} y={height - 14} textAnchor="middle">{year}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function MacroAtlas() {
  const [source, setSource] = useState<Source>("weo");
  const [metric, setMetric] = useState(DEFAULTS.weo);
  const [year, setYear] = useState(2026);
  const [archive, setArchive] = useState<Archive | null>(null);
  const [features, setFeatures] = useState<MapFeature[]>([]);
  const [remoteSeries, setRemoteSeries] = useState<Record<string, Series[]>>({});
  const [selectedIso, setSelectedIso] = useState("CHE");
  const [hovered, setHovered] = useState<Datum | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [error, setError] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/world.json").then((response) => {
        if (!response.ok) throw new Error("Map boundaries are unavailable.");
        return response.json();
      }),
      fetch("/data/catalog.json").then((response) => {
        if (!response.ok) throw new Error("The daily macro archive is unavailable.");
        return response.json() as Promise<Archive>;
      }),
    ])
      .then(([topology, macro]) => {
        const collection = feature(topology, topology.objects.countries) as unknown as GeoJSON.FeatureCollection;
        setFeatures(collection.features as MapFeature[]);
        setArchive(macro);
      })
      .catch((reason) => setError(reason.message));
  }, []);

  const sourceBlock = archive?.sources[source];
  const indicator = sourceBlock?.metrics[metric];
  const cacheKey = `${source}:${metric}`;

  useEffect(() => {
    if (!archive || remoteSeries[cacheKey]) return;
    const controller = new AbortController();
    fetchSeries(source, metric, archive.countries, controller.signal)
      .then((series) => setRemoteSeries((current) => ({ ...current, [cacheKey]: series })))
      .catch((reason) => {
        if (reason.name !== "AbortError") setError(reason.message);
      });
    return () => controller.abort();
  }, [archive, cacheKey, metric, remoteSeries, source]);

  const series = useMemo(() => remoteSeries[cacheKey] || [], [cacheKey, remoteSeries]);
  const remoteLoading = Boolean(archive) && !remoteSeries[cacheKey] && !error;
  const bounds = useMemo(() => {
    const years = series.flatMap((item) => item.values.map(([value]) => value));
    return { min: Math.min(...years, 1990), max: Math.max(...years, 2030) };
  }, [series]);
  const data = useMemo(() => series.flatMap((item) => observationAt(item, year) || []), [series, year]);
  const byId = useMemo(() => new Map(data.map((datum) => [datum.mapId, datum])), [data]);
  const selectedSeries = series.find((item) => item.iso3 === selectedIso);
  const selected = selectedSeries ? observationAt(selectedSeries, year) : null;
  const extent = useMemo(() => {
    const values = data.map((datum) => Math.abs(datum.value)).filter(Number.isFinite).sort((a, b) => a - b);
    return values[Math.floor(values.length * 0.9)] || 1;
  }, [data]);
  const path = useMemo(() => geoPath(geoEqualEarth().fitExtent([[14, 14], [986, 526]], { type: "Sphere" })), []);
  const categories = useMemo(() => {
    const grouped = new Map<string, [string, Indicator][]>();
    for (const entry of Object.entries(sourceBlock?.metrics || {})) {
      const group = grouped.get(entry[1].category) || [];
      group.push(entry);
      grouped.set(entry[1].category, group);
    }
    return [...grouped].map(([category, entries]) => [category, entries.sort((a, b) => a[1].label.localeCompare(b[1].label))] as const);
  }, [sourceBlock]);

  function changeSource(next: Source) {
    setSource(next);
    setMetric(DEFAULTS[next]);
    setError("");
  }

  return (
    <section className="atlas-workspace">
      <div className="atlas-controls" aria-label="Map controls">
        <label>
          <span>Source</span>
          <select value={source} onChange={(event) => changeSource(event.target.value as Source)}>
            {SOURCES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="indicator-control">
          <span>Indicator · {Object.keys(sourceBlock?.metrics || {}).length.toLocaleString("en")} available</span>
          <select value={metric} onChange={(event) => setMetric(event.target.value)}>
            {categories.map(([category, entries]) => (
              <optgroup key={category} label={category}>
                {entries.map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="year-control">
          <span>Year</span>
          <div>
            <input type="range" min={bounds.min} max={bounds.max} value={Math.min(bounds.max, Math.max(bounds.min, year))} onChange={(event) => setYear(Number(event.target.value))} />
            <output>{year}</output>
          </div>
        </label>
      </div>

      <div
        className="map-stage"
        ref={stageRef}
        onMouseMove={(event) => {
          const rect = stageRef.current?.getBoundingClientRect();
          if (rect) setPointer({ x: event.clientX - rect.left + 12, y: event.clientY - rect.top + 12 });
        }}
      >
        <div className="map-caption">
          <div>
            <strong>{indicator?.label || "Loading indicator catalog"}</strong>
            <span>{indicator?.unit || ""} · nearest available observation at or before {year}</span>
          </div>
          <span>{data.length} economies</span>
        </div>
        <svg className="world-map" viewBox="0 0 1000 540" role="img" aria-label={`${indicator?.label || "Indicator"} world map for ${year}`}>
          {features.map((country) => {
            const datum = byId.get(String(country.id).padStart(3, "0"));
            return (
              <path
                className={`country ${datum?.iso3 === selectedIso ? "selected" : ""}`}
                d={path(country) || ""}
                fill={mapColor(datum?.value, extent)}
                key={String(country.id)}
                tabIndex={datum ? 0 : -1}
                aria-label={datum ? `${datum.country}: ${formatValue(datum.value)} ${indicator?.unit}` : country.properties?.name}
                onMouseEnter={() => setHovered(datum || null)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(datum || null)}
                onBlur={() => setHovered(null)}
                onClick={() => datum && setSelectedIso(datum.iso3)}
              />
            );
          })}
        </svg>
        {(!archive || remoteLoading) && <div className="map-loading">{remoteLoading ? "Loading indicator from DBnomics…" : "Loading atlas…"}</div>}
        {error && <div className="map-loading atlas-error">{error}</div>}
        {hovered && (
          <div className="map-tooltip" style={{ left: Math.min(pointer.x, 760), top: Math.min(pointer.y, 455) }}>
            <strong>{hovered.country} · {hovered.year}</strong>
            <span>{formatValue(hovered.value)} {indicator?.unit}</span>
          </div>
        )}
      </div>

      <div className="country-panel">
        <div className="country-heading">
          <div>
            <p className="overline">Country history · click map to change</p>
            <h2>{selectedSeries?.country || "Select a country"}</h2>
          </div>
          <p className="country-value">
            {selected ? formatValue(selected.value) : "—"}
            <span>{indicator?.unit}</span>
          </p>
        </div>
        <CountryBars series={selectedSeries} unit={indicator?.unit || "source units"} />
        <div className="atlas-notes">
          <p>{sourceBlock?.note}</p>
          <p>
            Refreshed {archive ? new Date(archive.generatedAt).toLocaleDateString("en-GB") : "—"}.{" "}
            {sourceBlock?.url && <a href={sourceBlock.url} target="_blank" rel="noreferrer">Source ↗</a>}
          </p>
        </div>
      </div>
    </section>
  );
}
