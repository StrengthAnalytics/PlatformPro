import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'info' | 'warning' | 'success';
}

const IconButton: React.FC<IconButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
  const baseClasses = "flex items-center justify-center px-4 py-2 rounded-lg font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm transform hover:-translate-y-px active:translate-y-0 disabled:transform-none";
  
  const variantClasses = {
    primary: "bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 focus:ring-slate-500 border border-slate-900/50",
    secondary: "bg-gradient-to-b from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 focus:ring-slate-400 border border-slate-600/50",
    danger: "bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:ring-red-500 border border-red-800/50",
    info: "bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 focus:ring-sky-400 border border-sky-700/50",
    warning: "bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 focus:ring-amber-500 border border-amber-800/50",
    success: "bg-gradient-to-b from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500 border border-green-800/50",
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`} {...props}>
      <span>{children}</span>
    </button>
  );
};

export default IconButton;