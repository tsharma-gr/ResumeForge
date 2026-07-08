import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Input = React.forwardRef(({ className, label, error, ...props }, ref) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-[11px] font-bold text-[#7A7A94] uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full px-4 py-3 rounded-[10px] border border-[#E2DCEB] bg-white hover:border-[#C4B8D8] focus:ring-[3px] focus:ring-[#7C3AED]/15 focus:border-[#7C3AED] outline-none transition-all placeholder:text-[#A0A0B8] text-[15px] text-[#0F0F1A] font-medium shadow-[0px_2px_6px_rgba(20,15,50,0.02)]',
          error && 'border-red-500 focus:ring-red-500 bg-red-50',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
