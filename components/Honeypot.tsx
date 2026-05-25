import React from 'react';

interface HoneypotProps {
  name?: string;
}

const Honeypot: React.FC<HoneypotProps> = ({ name = 'website' }) => {
  return (
    <div style={{
      position: 'absolute',
      left: '-9999px',
      opacity: 0,
      height: 0,
      width: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
    }} aria-hidden="true">
      <label htmlFor={name}>No llenar</label>
      <input
        id={name}
        name={name}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value=""
        onChange={() => {}}
      />
    </div>
  );
};

export default Honeypot;
