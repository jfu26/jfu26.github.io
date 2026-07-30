"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";

type Metric = "growth" | "inflation" | "debt";
type Source = "weo" | "gmd" | "dbnomics";
type Series = {
  iso3: string;
  mapId: string;
  country: string;
  values: [year: number, value: number][];
};
type SourceBlock = {
  label: string;
  url: string;
  note: string;
  metrics: Record<Metric, Series[]>;
};
type Archive = {
  generatedAt: string;
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

const METRICS: { id: Metric; label: string; unit: string }[] = [
  { id: "growth", label: "Real GDP growth", unit: "%" },
  { id: "inflation", label: "Inflation", unit: "%" },
  { id: "debt", label: "Public debt / GDP", unit: "%" },
];
const SOURCES: { id: Source; label: string }[] = [
  { id: "weo", label: "IMF WEO" },
  { id: "gmd", label: "Global Macro DB" },
  { id: "dbnomics", label: "DBnomics" },
];

function color(value: number | undefined, metric: Metric, extent: number) {
  if (value === undefined) return "#26312e";
  if (metric === "debt") {
    const t = Math.max(0, Math.min(1, value / Math.max(extent, 120)));
    return `color-mix(in srgb, #273633 ${(1 - t) * 100}%, #9bd8c9)`;
  }
  const t = Math.min(1, Math.abs(value) / extent);
  const target = value < 0 ? "#c4685b" : "#9bd8c9";
  return `color-mix(in srgb, #273633 ${(1 - t) * 100}%, ${target})`;
}

function atYear(series: Series, requestedYear: number): Datum | null {
  const exact = series.values.find(([year]) => year === requestedYear);
  const nearest = exact || [...series.values].reverse().find(([year]) => year <= requestedYear);
  return nearest
    ? { iso3: series.iso3, mapId: series.mapId, country: series.country, year: nearest[0], value: nearest[1] }
    : null;
}

export default function MacroAtlas() {
  const [metric, setMetric] = useState<Metric>("growth");
  const [source, setSource] = useState<Source>("weo");
  const [year, setYear] = useState(2026);
  const [archive, setArchive] = useState<Archive | null>(null);
  const [features, setFeatures] = useState<MapFeature[]>([]);
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
      fetch("/data/macro.json").then((response) => {
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
  const data = useMemo(
    () => sourceBlock?.metrics[metric].flatMap((series) => atYear(series, year) || []) || [],
    [metric, sourceBlock, year],
  );
  const byId = useMemo(() => new Map(data.map((datum) => [datum.mapId, datum])), [data]);
  const selected = data.find((datum) => datum.iso3 === selectedIso)
    || data.find((datum) => datum.iso3 === "CHE")
    || data[0];
  const extent = useMemo(() => {
    const values = data.map((datum) => Math.abs(datum.value)).filter(Number.isFinite).sort((a, b) => a - b);
    return values[Math.floor(values.length * .9)] || 10;
  }, [data]);
  const path = useMemo(
    () => geoPath(geoEqualEarth().fitExtent([[18, 18], [982, 522]], { type: "Sphere" })),
    [],
  );
  const activeMetric = METRICS.find((item) => item.id === metric)!;

  return (
    <div className="atlas-grid">
      <aside className="control-rail">
        <div className="control-group">
          <span className="control-label">Indicator</span>
          <div className="control-options">
            {METRICS.map((item) => (
              <button className={metric === item.id ? "active" : ""} key={item.id} onClick={() => setMetric(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="control-group">
          <span className="control-label">Source</span>
          <div className="control-options">
            {SOURCES.map((item) => (
              <button className={source === item.id ? "active" : ""} key={item.id} onClick={() => setSource(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="control-group">
          <label className="control-label" htmlFor="year">Reference year</label>
          <input
            className="year-input"
            id="year"
            type="range"
            min="1990"
            max="2030"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          />
          <div className="year-readout"><span>1990</span><strong>{year}</strong><span>2030</span></div>
        </div>
        <p className="source-note">
          GitHub Actions refreshes the public-source snapshot every day. The
          generated archive is deployed directly and is never committed to
          this repository.
        </p>
      </aside>

      <div
        className="map-stage"
        ref={stageRef}
        onMouseMove={(event) => {
          const rect = stageRef.current?.getBoundingClientRect();
          if (rect) setPointer({ x: event.clientX - rect.left + 12, y: event.clientY - rect.top + 12 });
        }}
      >
        <svg className="world-map" viewBox="0 0 1000 540" role="img" aria-label={`${activeMetric.label} world map for ${year}`}>
          {features.map((country) => {
            const datum = byId.get(String(country.id).padStart(3, "0"));
            return (
              <path
                className="country"
                d={path(country) || ""}
                fill={color(datum?.value, metric, extent)}
                key={String(country.id)}
                tabIndex={datum ? 0 : -1}
                aria-label={datum ? `${datum.country}: ${datum.value.toFixed(2)} percent` : country.properties?.name}
                onMouseEnter={() => setHovered(datum || null)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(datum || null)}
                onBlur={() => setHovered(null)}
                onClick={() => datum && setSelectedIso(datum.iso3)}
              />
            );
          })}
        </svg>
        {!archive && !error && <div className="map-loading">Reading the world economy…</div>}
        {error && <div className="map-loading atlas-error">{error}</div>}
        {hovered && (
          <div className="map-tooltip" style={{ left: Math.min(pointer.x, 760), top: Math.min(pointer.y, 460) }}>
            <strong>{hovered.country} · {hovered.year}</strong>
            <span>{hovered.value.toFixed(2)}{activeMetric.unit}</span>
          </div>
        )}
        <div className="legend" aria-label="Map color scale">
          <div className="legend-bar" />
          <div className="legend-values">
            <span>{metric === "debt" ? "0" : `−${extent.toFixed(1)}`}</span>
            <span>{metric === "debt" ? `${extent.toFixed(0)}+` : "0"}</span>
            {metric !== "debt" && <span>+{extent.toFixed(1)}</span>}
          </div>
        </div>
      </div>

      <aside className="detail-rail">
        <span className="detail-kicker">{activeMetric.label}</span>
        <h2>{selected?.country || "Select a country"}</h2>
        <p className="detail-value">
          {selected ? selected.value.toFixed(2) : "—"} <span>{activeMetric.unit}</span>
        </p>
        <div className="detail-meta">
          <div><span>Observation</span><strong>{selected?.year || year}</strong></div>
          <div><span>Source</span><strong>{sourceBlock?.label || "—"}</strong></div>
          <div><span>Coverage</span><strong>{data.length} economies</strong></div>
          <div><span>Refresh</span><strong>{archive ? new Date(archive.generatedAt).toLocaleDateString("en-GB") : "—"}</strong></div>
        </div>
        <p className="detail-copy">
          {sourceBlock?.note || "Country values are shown as published by the source. Missing observations remain unfilled."}
        </p>
        <div className="source-links">
          {sourceBlock?.url && <a href={sourceBlock.url} target="_blank" rel="noreferrer">Open source ↗</a>}
          <a href="https://www.worldmonitor.app/docs/documentation" target="_blank" rel="noreferrer">Interface inspiration: World Monitor ↗</a>
        </div>
      </aside>
    </div>
  );
}
