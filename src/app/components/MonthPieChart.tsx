"use client";

export type PieSlice = {
  label: string;
  value: number;
  color: string;
};

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(cx: number, cy: number, r: number, start: number, end: number) {
  const a = polar(cx, cy, r, start);
  const b = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

export default function MonthPieChart({
  slices,
  format,
  caption,
}: {
  slices: PieSlice[];
  format: (n: number) => string;
  caption: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const size = 220;
  const c = size / 2;
  const r = 92;
  let cursor = 0;
  const wedges = total <= 0 ? [] : slices.map((slice) => {
    const sweep = (slice.value / total) * 360;
    const start = cursor;
    cursor += sweep;
    return { ...slice, start, end: cursor, pct: (slice.value / total) * 100 };
  });

  return (
    <div className="pie-wrap">
      {total <= 0 || wedges.length === 0 ? (
        <p className="pie-empty">Nothing to chart for this month yet.</p>
      ) : (
      <>
      <p className="pie-caption">{caption}</p>
      <div className="pie-layout">
        <svg className="pie-svg" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={caption}>
          {wedges.length === 1 ? (
            <circle cx={c} cy={c} r={r} fill={wedges[0].color}>
              <title>{`${wedges[0].label}: ${format(wedges[0].value)} (100%)`}</title>
            </circle>
          ) : (
            wedges.map((wedge, index) => (
              <path key={`${wedge.label}-${index}`} d={wedgePath(c, c, r, wedge.start, wedge.end)} fill={wedge.color}>
                <title>{`${wedge.label}: ${format(wedge.value)} (${wedge.pct.toFixed(1)}%)`}</title>
              </path>
            ))
          )}
        </svg>
        <ul className="pie-legend">
          {wedges.map((wedge, index) => (
            <li key={`${wedge.label}-${index}`} className="pie-legend-row">
              <span className="pie-swatch" style={{ background: wedge.color }} />
              <span className="pie-legend-label">{wedge.label}</span>
              <span className="pie-legend-val">
                {format(wedge.value)}
                <span className="pie-legend-pct">{wedge.pct.toFixed(1)}%</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      </>
      )}
      <style jsx>{`
        .pie-wrap { padding-top: 14px; }
        .pie-caption { margin: 0 0 14px; font-size: 13px; color: #8a9080; }
        .pie-empty { margin: 14px 0; font-size: 13px; color: #5a6080; font-style: italic; }
        .pie-layout {
          display: flex;
          align-items: center;
          gap: 28px;
          flex-wrap: wrap;
        }
        .pie-svg { width: 200px; height: 200px; flex-shrink: 0; }
        .pie-legend {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 220px;
          flex: 1;
        }
        .pie-legend-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #c8c3b8;
        }
        .pie-swatch {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .pie-legend-label { flex: 1; }
        .pie-legend-val {
          font-weight: 700;
          color: #e8e3d9;
          white-space: nowrap;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .pie-legend-pct { font-weight: 500; color: #6d7386; font-size: 11px; }
      `}</style>
    </div>
  );
}
