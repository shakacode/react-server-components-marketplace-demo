'use client';

import React, { useState } from 'react';
import { StatusBadge } from './restaurant/StatusBadge';
import { RatingBadge } from './restaurant/RatingBadge';
import { WaitTimeBadge } from './restaurant/WaitTimeBadge';
import { SpecialsList } from './restaurant/SpecialsList';
import { Spinner } from './shared/Spinner';
import { CardWidgetsSkeleton } from './shared/CardWidgetsSkeleton';

interface HelloWorldProps {
  name: string;
}

const HelloWorld: React.FC<HelloWorldProps> = ({ name }) => {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Hello, {name}!</h1>
      <StatusBadge status='closed' />
      <StatusBadge status='open' />
      <WaitTimeBadge minutes={20} />
      <RatingBadge count={2} rating={3} />

      <SpecialsList promotions={[
        {
          id: 1,
          restaurant_id: 2,
          title: "Title",
          description: "Description",
          discount_type: 'percentage',
          discount_value: 22,
          code: '222222',
          starts_at: '222222',
          ends_at: '33333333',
        }
      ]} />
      <hr style={{ margin: '20px 0' }} />
      <h2>Shared Components Preview</h2>
      <h3>Spinner (no label):</h3>
      <Spinner />
      <h3>Spinner (with label):</h3>
      <Spinner label="Loading restaurant data..." />
      <h3>CardWidgetsSkeleton:</h3>
      <div style={{ maxWidth: '320px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
        <CardWidgetsSkeleton />
      </div>
      <hr style={{ margin: '20px 0' }} />
      <p>React on Rails is working with TypeScript!</p>
      <p>Count: {count}</p>
      <button
        onClick={() => setCount(count + 1)}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        Click me
      </button>
    </div>
  );
};

export default HelloWorld;
