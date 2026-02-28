// Server component — SVG bar chart, d3 stays server-side in RSC
import React from 'react';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import type { HourlyDataPoint } from '../../types/dashboard';

interface HourlyChartProps {
  data: HourlyDataPoint[];
}

const WIDTH = 720;
const HEIGHT = 260;
const MARGIN = { top: 16, right: 16, bottom: 36, left: 50 };
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;

function formatHour(h: number): string {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

export default function HourlyChart({ data }: HourlyChartProps) {
  if (!data || data.length === 0) return null;

  const xScale = scaleBand<number>()
    .domain(data.map(d => d.hour))
    .range([0, INNER_W])
    .padding(0.25);

  const yMax = max(data, d => d.orders) || 0;
  const yScale = scaleLinear().domain([0, yMax * 1.1]).range([INNER_H, 0]).nice();

  const yTicks = yScale.ticks(4);
  const barWidth = xScale.bandwidth();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Orders by Hour</h3>
        <span className="text-sm text-gray-500">Average daily</span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label="Hourly orders chart">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Grid lines */}
          {yTicks.map(tick => (
            <line key={tick} x1={0} x2={INNER_W} y1={yScale(tick)} y2={yScale(tick)} stroke="#f1f5f9" strokeWidth={1} />
          ))}
          {/* Bars */}
          {data.map(d => {
            const x = xScale(d.hour) || 0;
            const barH = INNER_H - yScale(d.orders);
            return (
              <rect
                key={d.hour}
                x={x}
                y={yScale(d.orders)}
                width={barWidth}
                height={barH}
                fill="url(#barGradient)"
                rx={3}
              />
            );
          })}
          {/* Y axis labels */}
          {yTicks.map(tick => (
            <text key={tick} x={-8} y={yScale(tick)} textAnchor="end" dominantBaseline="middle" className="fill-gray-400" fontSize={11}>
              {tick.toLocaleString()}
            </text>
          ))}
          {/* X axis labels — show every 2nd or 3rd hour to avoid crowding */}
          {data.filter((_, i) => i % (data.length > 16 ? 3 : 2) === 0).map(d => (
            <text
              key={d.hour}
              x={(xScale(d.hour) || 0) + barWidth / 2}
              y={INNER_H + 24}
              textAnchor="middle"
              className="fill-gray-400"
              fontSize={11}
            >
              {formatHour(d.hour)}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}
