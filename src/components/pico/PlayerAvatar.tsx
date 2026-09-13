import { cn } from "@/lib/utils";
import type { Player } from "@/types/social";

export function PlayerAvatar({ player, size = "medium" }: { player: Player; size?: "small" | "medium" | "large" | "profile" }) {
  return <span className={cn("player-avatar", `avatar-size-${size}`)} role="img" aria-label={`Foto ilustrativa de ${player.name}`}>
    <span className={cn("portrait", `portrait-${player.avatar}`)} />
  </span>;
}
