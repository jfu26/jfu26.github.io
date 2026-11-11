// The IV assumptions as a causal graph: instrument x → regressor z → outcome y, unobservable U → z, y.
export default function IvDag() {
  const node = (x: number, y: number, label: string) => (
    <g className="dag-node" transform={`translate(${x},${y})`}><circle r={19} /><text dy="0.35em" textAnchor="middle">{label}</text></g>
  );
  return (
    <svg className="plot dag" viewBox="0 0 640 250" role="img" aria-label="Causal graph: x affects z, z affects y, U affects z and y; x has no direct effect on y and is independent of U">
      <defs>
        <marker id="dag-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M0,0L10,5L0,10z" className="arrowhead" />
        </marker>
      </defs>
      <g className="dag-edges" markerEnd="url(#dag-arrow)">
        <line x1={99} y1={140} x2={281} y2={140} />
        <line x1={339} y1={140} x2={521} y2={140} />
        <line x1={414} y1={60} x2={326} y2={124} />
        <line x1={444} y1={57} x2={524} y2={126} />
      </g>
      <g className="dag-excluded">
        <path d="M84,160 C180,240 460,240 556,160" />
        <path d="M410,45 C280,20 120,40 88,118" />
        <text x={320} y={226} textAnchor="middle">× no direct effect (exclusion)</text>
        <text x={210} y={32} textAnchor="middle">× no link (independence)</text>
      </g>
      <text className="note" x={190} y={162} textAnchor="middle">relevance</text>
      <text className="note" x={430} y={162} textAnchor="middle">causal effect</text>
      {node(80, 140, "x")}{node(310, 140, "z")}{node(540, 140, "y")}{node(430, 45, "U")}
    </svg>
  );
}
