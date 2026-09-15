import React from "react";
import { Search, X } from "lucide-react";
import { controlClass, controlLabelClass } from "./controlStyles";
import { IconButton } from "./IconButton";

const plainInputTypes = new Set(["checkbox", "radio", "range", "file", "color", "hidden"]);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string }>(function Input({ label, className = "", type = "text", ...props }, ref) {
  const input = <input ref={ref} type={type} {...props} className={`${plainInputTypes.has(String(type)) ? "" : controlClass} ${className}`.trim()} />;
  if (!label) return input;
  return <div className="w-full"><label className={controlLabelClass}>{label}</label>{input}</div>;
});

export function SearchInput({ value, onChange, onClear, placeholder = "Search…", className = "", ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & { value: string; onChange: (event: React.ChangeEvent<HTMLInputElement>) => void; onClear?: () => void }) {
  return (
    <div className={`app-search-field relative h-9 w-full ${className}`}>
      <span className="pointer-events-none absolute inset-y-0 left-4 z-10 flex items-center" aria-hidden="true">
        <Search className="h-4 w-4 text-muted-foreground" />
      </span>
      <input {...props} type="search" value={value} onChange={onChange} placeholder={placeholder} className={`${controlClass} h-9 pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden`} />
      {value && onClear && (
        <span className="absolute inset-y-0 right-2 z-10 flex items-center">
          <IconButton label="Clear search" icon={<X />} onClick={onClear} />
        </span>
      )}
    </div>
  );
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }>(function Textarea({ label, className = "", ...props }, ref) {
  const textarea = <textarea ref={ref} {...props} className={`${controlClass} min-h-24 max-h-28 resize-y ${className}`} />;
  if (!label) return textarea;
  return <div className="w-full"><label className={controlLabelClass}>{label}</label>{textarea}</div>;
});
