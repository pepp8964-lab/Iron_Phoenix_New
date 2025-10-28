import React from 'react';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: React.ReactNode;
  containerClassName?: string;
};

export const Select: React.FC<SelectProps> = ({ label, children, containerClassName, ...props }) => (
  <div className={`w-full ${containerClassName}`}>
    <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
    <select
      {...props}
      className="w-full bg-secondary border border-accent rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-200 appearance-none"
    >
      {children}
    </select>
  </div>
);