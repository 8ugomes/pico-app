"use client";
import { useState } from "react";
import { useDemo } from "./DemoProvider";
import { SportFilter, EmptyState } from "./SocialUI";
import { HomeContexts } from "./HomeContexts";
import { demoFeed } from "@/lib/demo-state";
import { PostCard } from "./PostCard";
import { PostComposer } from "./PostComposer";
import type { SportId } from "@/types/social";

export function FeedView() {
  const { state, me } = useDemo();
  const [sport, setSport] = useState<SportId | "all">("all");
  const [tab, setTab] = useState<"all" | "connections">("all");
  const posts = demoFeed(state, undefined, tab === "connections").filter(({ post }) => sport === "all" || post.sportId === sport);
  return <>
    <HomeContexts demo places={{ arenas: state.arenas.filter(a => state.followedArenaIds.includes(a.id)), communities: state.communities.filter(c => c.members.includes(me.id)) }} />
    <PostComposer />
    <div className="feed-tabs" role="group" aria-label="Origem dos posts"><button type="button" className={tab === "all" ? "active-tab" : ""} aria-pressed={tab === "all"} onClick={() => setTab("all")}>Publicações</button><button type="button" className={tab === "connections" ? "active-tab" : ""} aria-pressed={tab === "connections"} onClick={() => setTab("connections")}>Acompanhando</button></div>
    <SportFilter value={sport} onChange={setSport} />
    <div className="post-list">{posts.length ? posts.map(({ post, repost }) => <PostCard post={post} repost={repost} key={post.id} />) : <EmptyState title="A resenha ainda vai começar.">Troque o esporte ou acompanhe mais pessoas para encontrar posts por aqui.</EmptyState>}</div>
  </>;
}
