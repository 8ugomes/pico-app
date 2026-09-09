import { CircleDot, Footprints, Volleyball } from "lucide-react";

const icons = { Futevôlei: Footprints, "Beach Tennis": CircleDot, "Vôlei de Praia": Volleyball };

export function SportChip({ sport }: { sport: keyof typeof icons }) {
  const Icon = icons[sport];
  return <span className="sport-chip"><Icon size={15} aria-hidden="true" />{sport}</span>;
}
