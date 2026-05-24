interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  loading = false
}: ButtonProps) {

  const base = 'inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer active:scale-[0.985]';

  const variants = {
    primary: 'bg-gradient-to-r from-[#5D8A8F] via-[#4E7A80] to-[#3D5087] hover:from-[#4A7A7F] hover:via-[#3D6B70] hover:to-[#2B3B68] text-white shadow-md hover:shadow-lg',
    secondary: 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 hover:border-gray-300 hover:shadow-sm',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 border border-transparent'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${base}
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Please wait…
        </>
      ) : children}
    </button>
  );
}
