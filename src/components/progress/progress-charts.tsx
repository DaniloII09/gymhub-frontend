import type { ProgressEntry } from "@/src/types/progress";
import { formatProgressShortDate } from "./progress-logic";

interface SeriesSpec {
  id: string;
  label: string;
  color: string;
  values: number[];
}

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  dateLabel: string;
}

const SVG_WIDTH = 520;
const SVG_HEIGHT = 200;
const PAD_LEFT = 46;
const PAD_RIGHT = 20;
const PAD_TOP = 18;
const PAD_BOTTOM = 30;

function computeBounds(allValues: number[]): { min: number; max: number } {
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  if (rawMin === rawMax) {
    return { min: Math.max(0, rawMin - 2), max: rawMax + 2 };
  }
  const margin = (rawMax - rawMin) * 0.15;
  return {
    min: Math.max(0, rawMin - margin),
    max: rawMax + margin,
  };
}

function buildPoints(
  values: number[],
  dates: string[],
  min: number,
  max: number,
): ChartPoint[] {
  const plotWidth = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const span = max - min || 1;
  const count = values.length;

  return values.map((value, idx) => {
    const x =
      count <= 1
        ? PAD_LEFT + plotWidth / 2
        : PAD_LEFT + (idx / (count - 1)) * plotWidth;
    const y = PAD_TOP + ((max - value) / span) * plotHeight;
    return {
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      value,
      dateLabel: formatProgressShortDate(dates[idx] ?? ""),
    };
  });
}

function LineChartCard({
  title,
  unit,
  dates,
  series,
}: {
  title: string;
  unit: "kg" | "cm";
  dates: string[];
  series: SeriesSpec[];
}) {
  const allValues = series.flatMap((s) => s.values);
  if (allValues.length === 0) return null;

  const { min, max } = computeBounds(allValues);
  const mid = (min + max) / 2;
  const plotBottom = SVG_HEIGHT - PAD_BOTTOM;
  const plotted = series.map((item) => ({
    ...item,
    points: buildPoints(item.values, dates, min, max),
  }));

  const tickIndices =
    dates.length <= 4
      ? dates.map((_, idx) => idx)
      : [0, Math.floor((dates.length - 1) / 2), dates.length - 1];

  const primaryPoints = plotted[0]?.points ?? [];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <div className="flex flex-wrap gap-3 text-xs text-zinc-600 dark:text-zinc-300">
          {series.map((item) => (
            <span key={item.id} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label} ({unit})
            </span>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        role="img"
        aria-label={title}
        className="h-auto w-full overflow-visible"
      >
        {[max, mid, min].map((tick, idx) => {
          const y =
            idx === 0
              ? PAD_TOP
              : idx === 1
                ? PAD_TOP + (plotBottom - PAD_TOP) / 2
                : plotBottom;
          return (
            <g key={idx}>
              <line
                x1={PAD_LEFT}
                y1={y}
                x2={SVG_WIDTH - PAD_RIGHT}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.14"
                strokeDasharray="3 3"
              />
              <text
                x={PAD_LEFT - 6}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="currentColor"
                opacity="0.65"
              >
                {tick.toFixed(1)}
              </text>
            </g>
          );
        })}

        {plotted.map((item) => {
          const polylinePoints = item.points.map((p) => `${p.x},${p.y}`).join(" ");
          return (
            <g key={item.id}>
              {item.points.length >= 2 && (
                <polyline
                  fill="none"
                  stroke={item.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylinePoints}
                />
              )}
              {item.points.map((point, pointIdx) => (
                <circle
                  key={`${item.id}-${pointIdx}`}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={item.color}
                >
                  <title>{`${item.label} (${point.dateLabel}): ${point.value} ${unit}`}</title>
                </circle>
              ))}
            </g>
          );
        })}

        {tickIndices.map((idx) => {
          const point = primaryPoints[idx];
          if (!point) return null;
          return (
            <text
              key={`x-${idx}`}
              x={point.x}
              y={SVG_HEIGHT - 8}
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              opacity="0.7"
            >
              {point.dateLabel}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/** Gráficas de línea de peso (kg) y medidas corporales (cm) para H19. */
export function ProgressCharts({ entries }: { entries: ProgressEntry[] }) {
  if (entries.length === 0) return null;

  const dates = entries.map((e) => e.date);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <LineChartCard
        title="Evolución del peso"
        unit="kg"
        dates={dates}
        series={[
          {
            id: "weight",
            label: "Peso",
            color: "#4f46e5",
            values: entries.map((e) => e.weightKg),
          },
        ]}
      />

      <LineChartCard
        title="Evolución de medidas corporales"
        unit="cm"
        dates={dates}
        series={[
          {
            id: "chest",
            label: "Pecho",
            color: "#0284c7",
            values: entries.map((e) => e.chestCm),
          },
          {
            id: "waist",
            label: "Cintura",
            color: "#d97706",
            values: entries.map((e) => e.waistCm),
          },
          {
            id: "arm",
            label: "Brazo",
            color: "#0d9488",
            values: entries.map((e) => e.armCm),
          },
        ]}
      />
    </div>
  );
}
