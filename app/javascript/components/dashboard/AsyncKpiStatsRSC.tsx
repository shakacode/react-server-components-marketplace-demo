// Server-only async component — streams KPI stat cards
import React from 'react';
import StatCards from './StatCards';

interface Props {
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default async function AsyncKpiStatsRSC({ getReactOnRailsAsyncProp }: Props) {
  const stats = await getReactOnRailsAsyncProp('kpi_stats');
  return <StatCards stats={stats} />;
}
