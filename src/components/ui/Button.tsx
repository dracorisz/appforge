import React from "react";

export function Button({
  children,
  variant = "primary",
  size = "sm",
  className = "max-w-[220px]",
  disabled,
  onClick,
  type = "button",
  title,
  ...props
}: {
  children: React.ReactNode;
  variant?: "default" | "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  title?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className" | "disabled" | "onClick" | "type" | "title">) {
  const base =
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0";
  const variants = {
    default: "border-primary/90 bg-primary text-primary-foreground hover:bg-primary/92",
    primary: "border-primary/90 bg-primary text-primary-foreground hover:bg-primary/92",
    secondary: "border-border/70 bg-secondary/72 text-secondary-foreground backdrop-blur-md hover:border-foreground/15 hover:bg-secondary/88",
    ghost: "border-transparent text-foreground hover:border-border/60 hover:bg-accent/70 hover:text-accent-foreground",
    destructive: "border-destructive/90 bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };
  const sizes = {
    sm: "h-8 px-2",
    md: "h-10 px-4",
    lg: "h-10 px-8",
  };
  return (
    <button {...props} type={type} title={title} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
