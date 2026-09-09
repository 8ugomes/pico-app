import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; hint?: string };

export function Input({ id, label, hint, className, ...props }: InputProps) {
  return (
    <div className="input-group">
      <label htmlFor={id}>{label}</label>
      <input id={id} className={cn("input", className)} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
      {hint && <span id={`${id}-hint`} className="input-hint">{hint}</span>}
    </div>
  );
}
