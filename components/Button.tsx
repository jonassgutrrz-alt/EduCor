import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  // Base classes with quick transition and scale-down click interaction
  const baseStyles =
    "inline-flex items-center justify-center font-bold rounded-full select-none cursor-pointer tracking-wide transition-all duration-150 active:scale-95 disabled:pointer-events-none disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500";

  // Size variations
  const sizeStyles = {
    sm: "px-4 py-1.5 text-xs gap-1.5",
    md: "px-6 py-2.5 text-sm gap-2",
    lg: "px-8 py-3.5 text-base gap-2.5",
  };

  // Modern variants with subtle gradients & glow effects
  const variantStyles = {
    primary:
      "bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800 hover:shadow-lg hover:shadow-indigo-500/35 hover:brightness-105",
    secondary:
      "bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-md shadow-slate-900/15 hover:from-slate-700 hover:to-slate-800 hover:shadow-lg",
    outline:
      "bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 active:scale-95 dark:hover:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-400",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-slate-800",
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Loading Spinner */}
      {isLoading ? (
        <svg
          className="h-4 w-4 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      ) : (
        leftIcon
      )}

      <span>{children}</span>

      {!isLoading && rightIcon}
    </button>
  );
};

export default Button;
