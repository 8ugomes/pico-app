import type { InputHTMLAttributes, ReactNode } from 'react';
import { Check } from 'lucide-react';

// Native checkbox semantics, with a persistent tick as well as color for selection.
export function ChoiceChip({ children, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { children: ReactNode }) {
  return <label className="choice-chip">
    <input {...props} type="checkbox" />
    <Check size={16} aria-hidden="true" />
    <span>{children}</span>
  </label>;
}
