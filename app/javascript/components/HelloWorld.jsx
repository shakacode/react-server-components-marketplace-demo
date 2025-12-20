'use client';

import React, { useState } from 'react';

const HelloWorld = ({ name }) => {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Hello, {name}!</h1>
      <p>React on Rails is working!</p>
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
