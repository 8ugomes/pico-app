import type { Metadata } from "next";
import { DiscoverView } from "@/components/pico/DiscoverView";
export const metadata: Metadata = { title: "Descobrir pessoas" };
export default function DiscoverPage() { return <DiscoverView />; }
