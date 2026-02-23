import React from 'react';

interface Props {
  features: string[];
}

export function ProductFeatures({ features }: Props) {
  if (features.length === 0) return null;

  return (
    <section className="border-t border-gray-200 pt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Key Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50/50">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mt-0.5">
              <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
