import React, { forwardRef, useEffect } from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    [key: string]: any; // Allow other props like onKeyDown
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ children, className, ...props }, ref) => {
    return (
        <div ref={ref} className={`bg-secondary border border-border rounded-xl p-6 shadow-glow-white-subtle transition-all duration-300 ${className}`} {...props}>
            {children}
        </div>
    );
});
Card.displayName = 'Card';


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);
  
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" 
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-secondary border border-border rounded-xl shadow-lg w-full max-w-md animate-slide-up" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-text-secondary hover:text-text-primary text-2xl leading-none"
            aria-label="Закрити"
          >
            &times;
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};