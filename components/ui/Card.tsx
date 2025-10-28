import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
    return (
        <div className={`bg-secondary border border-brand/20 rounded-xl p-6 shadow-glow-white-subtle transition-all duration-300 ${className}`}>
            {children}
        </div>
    );
};