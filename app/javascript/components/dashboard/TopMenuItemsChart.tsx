// Server component — horizontal bar chart for top items, d3 stays server-side in RSC
import React from 'react';
import { scaleLinear, scaleBand } from 'd3-scale';
import { max } from 'd3-array';
import { format } from 'd3-format';
import type { TopMenuItem } from '../../types/dashboard';

interface TopMenuItemsChartProps {
  items: TopMenuItem[];
}

const WIDTH = 720;
const HEIGHT = 380;
const MARGIN = { top: 16, right: 80, bottom: 16, left: 180 };
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;

const formatCurrency = format('$,.0f');

const CATEGORY_COLORS: Record<string, string> = {
  Appetizers: '#f59e0b',
  Entrees: '#6366f1',
  Desserts: '#ec4899',
  Drinks: '#06b6d4',
  Sides: '#22c55e',
  Specials: '#8b5cf6',
};

export default function TopMenuItemsChart({ items }: TopMenuItemsChartProps) {
  if (!items || items.length === 0) return null;

  const yScale = scaleBand<string>()
    .domain(items.map(d => d.name))
    .range([0, INNER_H])
    .padding(0.3);

  const xMax = max(items, d => d.total_revenue) || 0;
  const xScale = scaleLinear().domain([0, xMax]).range([0, INNER_W]).nice();

  const barH = yScale.bandwidth();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Menu Items</h3>
        <span className="text-sm text-gray-500">By revenue (30 days)</span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label="Top menu items chart">
        <defs>
          {items.map((item, i) => {
            const baseColor = CATEGORY_COLORS[item.category] || '#6366f1';
            return (
              <linearGradient key={i} id={`itemGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={baseColor} stopOpacity={0.8} />
                <stop offset="100%" stopColor={baseColor} />
              </linearGradient>
            );
          })}
        </defs>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {items.map((item, i) => {
            const y = yScale(item.name) || 0;
            const barW = xScale(item.total_revenue);
            return (
              <g key={i}>
                {/* Bar */}
                <rect x={0} y={y} width={barW} height={barH} fill={`url(#itemGrad${i})`} rx={4} />
                {/* Item name */}
                <text x={-8} y={y + barH / 2} textAnchor="end" dominantBaseline="middle" className="fill-gray-700" fontSize={12}>
                  {item.name.length > 22 ? item.name.slice(0, 22) + '…' : item.name}
                </text>
                {/* Revenue label */}
                <text x={barW + 8} y={y + barH / 2} dominantBaseline="middle" className="fill-gray-600" fontSize={12} fontWeight="500">
                  {formatCurrency(item.total_revenue)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
