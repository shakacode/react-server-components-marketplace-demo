// Server-only async component — streams hourly distribution chart
import React from 'react';
import HourlyChart from './HourlyChart';

interface Props {
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default async function AsyncHourlyChartRSC({ getReactOnRailsAsyncProp }: Props) {
  const data = await getReactOnRailsAsyncProp('hourly_data');
  return <HourlyChart data={data} />;
}
