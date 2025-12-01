import React from "react";

export const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div
    className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ title, description, icon: Icon }: {
  title: string,
  description?: string,
  icon?: React.ElementType
}) => (
  <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
    <div className="flex items-center gap-2 mb-1">
      {Icon && <Icon className="w-5 h-5 text-indigo-500" />}
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
    </div>
    {description && <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-7">{description}</p>}
  </div>
);

export const CardContent = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
);

export const Badge = ({ children, variant = "default", className = "" }: {
  children: React.ReactNode,
  variant?: "default" | "outline" | "success" | "warning" | "destructive",
  className?: string
}) => {
  const variants = {
    default: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
    outline: "border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    destructive: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const Button = ({ children, onClick, variant = "primary", size = "md", disabled = false, className = "" }: any) => {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
    ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
    outline: "border border-zinc-200 bg-transparent hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2 text-sm",
    icon: "h-9 w-9"
  };

  return (
    <button onClick={onClick} disabled={disabled}
            className={`${base} ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]} ${className}`}>
      {children}
    </button>
  );
};

export const Switch = ({ checked, onCheckedChange }: { checked: boolean, onCheckedChange: (c: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={`
      relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
      ${checked ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"}
    `}
  >
    <span
      className={`
        pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform
        ${checked ? "translate-x-5" : "translate-x-0"}
      `}
    />
  </button>
);