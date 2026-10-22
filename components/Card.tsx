import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  badge,
  icon,
  footer,
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`
        group relative rounded-2xl bg-white p-6 
        border border-slate-100/90 shadow-sm
        transition-all duration-300 ease-in-out
        hover:-translate-y-1 hover:shadow-lg hover:border-slate-200
        dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700
        ${className}
      `}
      {...props}
    >
      {/* Optional Top Badge & Icon Header */}
      {(badge || icon) && (
        <div className="flex items-center justify-between mb-4">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors duration-300 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/60 dark:text-indigo-400 dark:group-hover:bg-indigo-600 dark:group-hover:text-white">
              {icon}
            </div>
          )}
          {badge && (
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Card Title & Description */}
      {title && (
        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors duration-200 dark:text-white dark:group-hover:text-indigo-400">
          {title}
        </h3>
      )}

      {description && (
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </p>
      )}

      {/* Card Body / Custom Children */}
      {children && <div className="mt-4">{children}</div>}

      {/* Optional Card Footer */}
      {footer && (
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
