"use client";

import { createContext, useContext, useReducer, useEffect, useState, type Dispatch, type ReactNode } from "react";
import { mock } from "@/data/mock";
import { createDemoState, demoReducer, activeCheckins, type DemoAction } from "@/lib/demo-state";
import type { DemoState, Player, Checkin } from "@/types/social";

type DemoContext = { state: DemoState; dispatch: Dispatch<DemoAction>; now: number; me: Player; present: Checkin[] };
const Context = createContext<DemoContext | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, mock, createDemoState);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const interval = window.setInterval(() => setNow(Date.now() - start), 15000);
    return () => window.clearInterval(interval);
  }, []);
  const me = state.players.find(p => p.id === state.currentUserId)!;
  return <Context.Provider value={{ state, dispatch, now, me, present: activeCheckins(state, now) }}>{children}</Context.Provider>;
}

export function useDemo() {
  const context = useContext(Context);
  if (!context) throw new Error("Social screens must be inside DemoProvider");
  return context;
}
