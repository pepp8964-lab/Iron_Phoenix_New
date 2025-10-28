import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helperText?: string;
  containerClassName?: string;
  endAdornment?: React.ReactNode;
};

export const Input: React.FC<InputProps> = ({ label, helperText, containerClassName, endAdornment, ...props }) => (
  <div className={`w-full ${containerClassName}`}>
    <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
    <div className="relative">
      <input
        {...props}
        className="w-full bg-secondary border border-accent rounded-lg px-3 py-2 text-text-primary placeholder-accent focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-200"
      />
      {endAdornment && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {endAdornment}
        </div>
      )}
    </div>
    {helperText && <p className="text-xs text-accent mt-1.5">{helperText}</p>}
  </div>
);