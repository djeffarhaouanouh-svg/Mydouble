import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2';
  
  const variantClasses = {
    default: 'bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white hover:scale-105',
    ghost: 'bg-transparent hover:bg-gray-800 text-white',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
