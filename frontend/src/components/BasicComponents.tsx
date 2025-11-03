import React from 'react';

export function Button({ children, onClick, variant = 'primary', disabled }: {
  children: React.ReactNode,
  onClick?: () => void,
  variant?: 'primary' | 'danger' | 'success' | 'warning',
  disabled?: boolean
}) {
  const color = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  }[variant];
  return (
    <button
      className={`px-4 py-2 rounded transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${color} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <div className="spinner" style={{ display: 'inline-block', width: 24, height: 24 }}>
      <svg viewBox="0 0 50 50" style={{ width: 24, height: 24 }}>
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#3949ab"
          strokeWidth="5"
          strokeDasharray="31.415, 31.415"
          transform="rotate(0 25 25)"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}
