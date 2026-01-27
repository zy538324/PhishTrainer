// src/components/Loader.jsx
import React from 'react';

export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="loader">
      <span className="loader-spinner" aria-hidden="true" />
      <span className="loader-label">{label}</span>
    </div>
  );
}
