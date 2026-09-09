import Link from "next/link";
import { MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
export default function NotFound() {
  return <section className="social-empty"><MapPin size={32} aria-hidden="true" /><h1>Esse Pico não apareceu.</h1><p>A arena ou pessoa que você procura não faz parte desta demonstração.</p><Link href="/feed" className={buttonVariants()}>Voltar ao feed</Link></section>;
}
