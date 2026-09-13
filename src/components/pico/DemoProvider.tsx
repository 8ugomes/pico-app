"use client";

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import { mock } from "@/data/mock";
import { createDemoState, demoReducer, type DemoAction } from "@/lib/demo-state";
import type { DemoState, Player } from "@/types/social";

type DemoContext = { state: DemoState; dispatch: Dispatch<DemoAction>; now: number; me: Player };
const Context = createContext<DemoContext | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, mock, createDemoState);
  const now = 0; // Illustrative publication ages remain fixed; no live polling.
  const me = state.players.find(p => p.id === state.currentUserId)!;
  return <Context.Provider value={{ state, dispatch, now, me }}>{children}</Context.Provider>;
}

export function useDemo() {
  const context = useContext(Context);
  if (!context) throw new Error("Social screens must be inside DemoProvider");
  return context;
}
