export const buttonBaseClass =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 has-[img]:h-auto has-[img]:max-h-none has-[video]:h-auto has-[video]:max-h-none [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0";

export const buttonVariantClasses = {
  primary: "border-foreground/25 bg-primary/5 hover:border-foreground/35 hover:bg-primary/10",
  default: "border-foreground/25 bg-primary/5 hover:border-foreground/35 hover:bg-primary/10",
  secondary: "border-border bg-secondary/70 text-secondary-foreground backdrop-blur-md hover:border-foreground/30 hover:bg-secondary",
  ghost: "border-transparent bg-transparent text-foreground hover:border-border hover:bg-accent/70 hover:text-accent-foreground",
  destructive: "border-destructive/70 bg-destructive text-destructive-foreground hover:border-destructive/85 hover:bg-destructive/90",
} as const;

export const buttonSizeClasses = {
  sm: "h-9 min-h-9 max-h-9 px-2",
  md: "h-9 min-h-9 max-h-9 px-4",
  lg: "h-9 min-h-9 max-h-9 px-8",
} as const;

export const iconButtonSizeClasses = {
  sm: "h-9 min-h-9 max-h-9 w-9",
  md: "h-9 min-h-9 max-h-9 w-9",
} as const;

export type ButtonVariant = keyof typeof buttonVariantClasses;
export type ButtonSize = keyof typeof buttonSizeClasses;
export type IconButtonSize = keyof typeof iconButtonSizeClasses;
