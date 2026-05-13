interface InputProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  error?: string;
  prefix?: string;
}

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  helper,
  error,
  prefix
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <div className="flex">
        {prefix && (
          <span className="px-3 py-2.5 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-600 font-medium">
            {prefix}
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 border rounded-lg bg-white
            focus:outline-none focus:ring-2 focus:ring-[#7FA8AD] focus:border-[#7FA8AD]
            transition-all duration-150
            ${prefix ? 'rounded-l-none' : ''}
            ${error ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'}
          `}
        />
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