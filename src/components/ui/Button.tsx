import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva("button", {
  variants: {
    variant: { primary: "button-primary", secondary: "button-secondary", quiet: "button-quiet" },
    size: { small: "button-small", default: "button-default", large: "button-large" },
  },
  defaultVariants: { variant: "primary", size: "default" },
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
