import type { PeriodBucket } from "@/lib/periodAggregation";

interface BarChartProps {
  buckets: PeriodBucket[];
}

/**
 * Small pure-SVG grouped bar chart (income vs. expense per bucket) — no
 * charting library. Adding one just for this would be another dependency
 * for electron-builder to bundle, working against the RAM-conscious build
 * constraints already established for this project.
 */
export function AccountingBarChart({ buckets }: BarChartProps): JSX.Element {
  const width = 720;
  const height = 220;
  const paddingBottom = 28;
  const paddingTop = 12;
  const chartHeight = height - paddingBottom - paddingTop;

  const maxValue = Math.max(1, ...buckets.map((b) => Math.max(b.income, b.expense)));
  const groupWidth = width / Math.max(1, buckets.length);
  const barWidth = Math.min(16, groupWidth / 3);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="نمودار درآمد و هزینه">
      {buckets.map((bucket, index) => {
        const groupCenter = groupWidth * index + groupWidth / 2;
        const incomeHeight = (bucket.income / maxValue) * chartHeight;
        const expenseHeight = (bucket.expense / maxValue) * chartHeight;
        return (
          <g key={bucket.key}>
            <rect
              x={groupCenter - barWidth - 2}
              y={paddingTop + chartHeight - incomeHeight}
              width={barWidth}
              height={incomeHeight}
              fill="var(--sv-success)"
              rx={2}
            >
              <title>{`${bucket.label} — درآمد: ${bucket.income.toLocaleString("fa-IR")} تومان`}</title>
            </rect>
            <rect
              x={groupCenter + 2}
              y={paddingTop + chartHeight - expenseHeight}
              width={barWidth}
              height={expenseHeight}
              fill="var(--sv-danger)"
              rx={2}
            >
              <title>{`${bucket.label} — هزینه: ${bucket.expense.toLocaleString("fa-IR")} تومان`}</title>
            </rect>
            <text
              x={groupCenter}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="var(--sv-text-600)"
              style={{ fontFamily: "inherit" }}
            >
              {bucket.label}
            </text>
          </g>
        );
      })}
      <line x1={0} y1={paddingTop + chartHeight} x2={width} y2={paddingTop + chartHeight} stroke="var(--sv-border)" />
    </svg>
  );
}
