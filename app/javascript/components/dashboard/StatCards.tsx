// Server component — renders KPI stat cards
import React from 'react';
import type { KpiStats } from '../../types/dashboard';

interface StatCardsProps {
  stats: KpiStats;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

interface CardProps {
  title: string;
  value: string;
  change: number;
  icon: string;
  accentColor: string;
}

function Card({ title, value, change, icon, accentColor }: CardProps) {
  const isPositive = change >= 0;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${accentColor}`}>
          {icon}
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="flex items-center gap-1 text-sm">
        <span className={isPositive ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </span>
        <span className="text-gray-400">vs prev. period</span>
      </div>
    </div>
  );
}

export default function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        title="Total Revenue"
        value={formatCurrency(stats.revenue)}
        change={stats.revenue_change}
        icon="$"
        accentColor="bg-indigo-50 text-indigo-600"
      />
      <Card
        title="Orders"
        value={formatNumber(stats.order_count)}
        change={stats.order_count_change}
        icon="#"
        accentColor="bg-cyan-50 text-cyan-600"
      />
      <Card
        title="Avg. Order"
        value={formatCurrency(stats.avg_order_value)}
        change={stats.avg_order_value_change}
        icon="~"
        accentColor="bg-amber-50 text-amber-600"
      />
      <Card
        title="Completion"
        value={`${stats.completion_rate}%`}
        change={stats.delivery_rate}
        icon="!"
        accentColor="bg-emerald-50 text-emerald-600"
      />
    </div>
  );
}
