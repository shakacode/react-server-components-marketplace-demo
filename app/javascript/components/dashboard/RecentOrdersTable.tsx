// Server component — renders recent orders table
// date-fns stays server-side in RSC → 30KB less JS for client
import React from 'react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import type { RecentOrder } from '../../types/dashboard';

interface RecentOrdersTableProps {
  orders: RecentOrder[];
}

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  preparing: 'bg-amber-50 text-amber-700 border-amber-200',
  pending: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ready: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  if (!orders || orders.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          <span className="text-sm text-gray-500">{orders.length} orders</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left py-3 px-6 font-medium text-gray-500">Order</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Items</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
              <th className="text-right py-3 px-6 font-medium text-gray-500">Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => {
              const placedDate = parseISO(order.placed_at);
              const relativeTime = formatDistanceToNow(placedDate, { addSuffix: true });
              const absoluteTime = format(placedDate, 'MMM d, h:mm a');
              const badgeClass = STATUS_BADGE[order.status] || 'bg-gray-50 text-gray-700 border-gray-200';

              return (
                <tr key={order.id} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                  <td className="py-3 px-6">
                    <span className="font-mono text-xs text-gray-900">{order.order_number}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="text-gray-700 truncate max-w-[200px]">
                        {order.item_names.join(', ')}
                      </span>
                      <span className="text-xs text-gray-400">{order.items_count} items</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    ${order.total_price.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs ${order.is_delivery ? 'text-blue-600' : 'text-gray-500'}`}>
                      {order.is_delivery ? 'Delivery' : 'Pickup'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-gray-700">{relativeTime}</span>
                      <span className="text-xs text-gray-400">{absoluteTime}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
