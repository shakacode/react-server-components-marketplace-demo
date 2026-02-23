import React from 'react';

interface Props {
  specs: Record<string, string>;
}

export function ProductSpecs({ specs }: Props) {
  const entries = Object.entries(specs);
  if (entries.length === 0) return null;

  return (
    <section className="border-t border-gray-200 pt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Technical Specifications</h2>
      <div className="bg-gray-50 rounded-xl overflow-hidden">
        <table className="w-full">
          <tbody>
            {entries.map(([key, value], index) => (
              <tr
                key={key}
                className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
              >
                <td className="px-6 py-3.5 text-sm font-medium text-gray-600 w-2/5">{key}</td>
                <td className="px-6 py-3.5 text-sm text-gray-900">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
