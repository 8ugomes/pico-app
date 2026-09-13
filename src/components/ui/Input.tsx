import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; hint?: string; error?: string; trailing?: ReactNode; inputRef?: Ref<HTMLInputElement> };

export function Input({ id, label, hint, error, trailing, inputRef, className, ...props }: InputProps) {
  const describedBy = [props['aria-describedby'], hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const field = <input {...props} ref={inputRef} id={id} className={cn("input", className)} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={describedBy} />;
  return (
    <div className="input-group">
      <label htmlFor={id}>{label}</label>
      {trailing ? <div className="input-with-action">{field}{trailing}</div> : field}
      {hint && <span id={`${id}-hint`} className="input-hint">{hint}</span>}
      {error && <span id={`${id}-error`} className="form-error" role="alert">{error}</span>}
    </div>
  );
}
