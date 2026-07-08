'use client';

import { useId, useState } from 'react';

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
  dark?: boolean;
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
  dark = false,
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const id = useId();
  const isPasswordField = type === 'password' && showPasswordToggle;
  const inputType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={`text-[0.7rem] font-bold uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-gray-600'}`}>
        {label}
      </label>
      <div className="flex relative">
        {prefix && (
          <span className={`px-3 py-3 border border-r-0 rounded-l-xl text-sm font-semibold flex items-center ${
            dark
              ? 'bg-slate-800/80 border-slate-700 text-slate-400'
              : 'bg-gray-50 border-gray-200 text-gray-500'
          }`}>
            {prefix}
          </span>
        )}
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
          className={`
            w-full px-4 py-3 text-sm border rounded-xl
            focus:outline-none focus:ring-2 focus:ring-[#7FA8AD]/25 focus:border-[#7FA8AD]
            hover:border-opacity-80
            transition-all duration-200
            ${prefix ? 'rounded-l-none' : ''}
            ${isPasswordField ? 'pr-10' : ''}
            ${dark
              ? `bg-[#0A1628] text-slate-100 placeholder-slate-600 ${error ? 'border-red-500/60 bg-red-900/10' : 'border-slate-700 hover:border-slate-600'}`
              : `bg-white text-gray-900 placeholder-gray-400/70 ${error ? 'border-red-400 bg-red-50/20' : 'border-gray-200 hover:border-gray-300'}`
            }
          `}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-150 cursor-pointer ${
              dark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {helper && !error && (
        <p id={`${id}-helper`} className={`text-[0.7rem] leading-relaxed ${dark ? 'text-slate-600' : 'text-gray-500'}`}>{helper}</p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className={`text-[0.7rem] font-medium ${dark ? 'text-red-400' : 'text-red-500'}`}>{error}</p>
      )}
    </div>
  );
}
