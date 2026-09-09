import { cn } from "@/lib/utils";

export function Avatar({ initials, tone = "sand" }: { initials: string; tone?: "sand" | "ocean" | "coral" }) {
  return <span className={cn("avatar", `avatar-${tone}`)} aria-hidden="true">{initials}</span>;
}
