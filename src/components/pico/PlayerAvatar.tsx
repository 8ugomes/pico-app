import { cn } from "@/lib/utils";
import type { Player } from "@/types/social";

export function PlayerAvatar({ player, size = "medium", active = false }: { player: Player; size?: "small" | "medium" | "large" | "profile"; active?: boolean }) {
  return <span className={cn("player-avatar", `avatar-size-${size}`, active && "player-avatar-active")} role="img" aria-label={`Foto ilustrativa de ${player.name}`}>
    <span className={cn("portrait", `portrait-${player.avatar}`)} />
    {active && <span className="presence-dot" />}
  </span>;
}
