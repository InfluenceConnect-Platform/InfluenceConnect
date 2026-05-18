'use client';

import { useState } from 'react';

interface InputProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  error?: string;
  prefix?: string;
  showPasswordToggle?: boolean;
}

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  helper,
  error,
  prefix,
  showPasswordToggle = false,
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password' && showPasswordToggle;
  const inputType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <div className="flex relative">
        {prefix && (
          <span className="px-3 py-2.5 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-600 font-medium">
            {prefix}
          </span>
        )}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 border rounded-lg bg-white
            focus:outline-none focus:ring-2 focus:ring-[#7FA8AD] focus:border-[#7FA8AD]
            transition-all duration-150
            ${prefix ? 'rounded-l-none' : ''}
            ${isPasswordField ? 'pr-10' : ''}
            ${error ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'}
          `}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {helper && !error && (
        <p className="text-xs text-gray-500">{helper}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
