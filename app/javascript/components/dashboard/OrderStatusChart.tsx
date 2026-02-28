// Server component — SVG donut chart, d3 stays server-side in RSC
import React from 'react';
import { pie, arc } from 'd3-shape';
import type { OrderStatusItem } from '../../types/dashboard';

interface OrderStatusChartProps {
  data: OrderStatusItem[];
}

const SIZE = 220;
const RADIUS = SIZE / 2;
const INNER_RADIUS = RADIUS * 0.6;

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  preparing: '#f59e0b',
  pending: '#6366f1',
  ready: '#06b6d4',
  cancelled: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  preparing: 'Preparing',
  pending: 'Pending',
  ready: 'Ready',
  cancelled: 'Cancelled',
};

export default function OrderStatusChart({ data }: OrderStatusChartProps) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.count, 0);

  const pieGen = pie<OrderStatusItem>()
    .value(d => d.count)
    .sort(null)
    .padAngle(0.02);

  const arcGen = arc<ReturnType<typeof pieGen>[0]>()
    .innerRadius(INNER_RADIUS)
    .outerRadius(RADIUS - 4)
    .cornerRadius(3);

  const arcs = pieGen(data);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
      <div className="flex items-center gap-6">
        <svg width={SIZE} height={SIZE} viewBox={`${-RADIUS} ${-RADIUS} ${SIZE} ${SIZE}`} className="flex-shrink-0">
          {arcs.map((d, i) => (
            <path
              key={i}
              d={arcGen(d) || ''}
              fill={STATUS_COLORS[d.data.status] || '#94a3b8'}
            />
          ))}
          <text textAnchor="middle" dominantBaseline="central" className="fill-gray-900" fontSize={24} fontWeight="bold">
            {total.toLocaleString()}
          </text>
          <text textAnchor="middle" y={20} className="fill-gray-500" fontSize={12}>
            orders
          </text>
        </svg>
        <div className="flex flex-col gap-2 min-w-0">
          {data.map(d => {
            const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : '0';
            return (
              <div key={d.status} className="flex items-center gap-2 text-sm">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[d.status] || '#94a3b8' }}
                />
                <span className="text-gray-600 truncate">{STATUS_LABELS[d.status] || d.status}</span>
                <span className="text-gray-900 font-medium ml-auto">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
