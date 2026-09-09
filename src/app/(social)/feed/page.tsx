import type { Metadata } from "next";
import { FeedView } from "@/components/pico/FeedView";
export const metadata: Metadata = { title: "Seu feed" };
export default function FeedPage() { return <FeedView />; }
