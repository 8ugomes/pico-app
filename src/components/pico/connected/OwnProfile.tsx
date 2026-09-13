'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useRemoteRead } from './useRemoteRead';

const OwnProfile = createContext<ReturnType<typeof useRemoteRead> | null>(null);

export function OwnProfileProvider({ children }: { children: ReactNode }) {
  const profile = useRemoteRead('resource=profile');
  return <OwnProfile.Provider value={profile}>{children}</OwnProfile.Provider>;
}

// Standalone profile surfaces retain their own reader; the social shell shares one.
export function useOwnProfile() {
  const shared = useContext(OwnProfile);
  const standalone = useRemoteRead('resource=profile', !shared);
  return shared ?? standalone;
}
