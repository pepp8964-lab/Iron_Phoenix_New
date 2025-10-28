import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'normal' | 'large';
  children: React.ReactNode;
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'normal', children, ...props }) => {
  const baseClasses = "rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeClasses = {
    normal: 'px-4 py-2 text-sm',
    large: 'px-8 py-3 text-base',
  };

  const variantClasses = {
    primary: 'bg-brand text-white hover:opacity-90 focus:ring-brand focus:shadow-glow-brand hover:shadow-glow-brand',
    secondary: 'bg-accent text-text-primary hover:bg-opacity-80 focus:ring-accent',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-text-secondary hover:bg-secondary hover:text-text-primary focus:ring-accent',
  };

  return (
    <button {...props} className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`}>
      {children}
    </button>
  );
};