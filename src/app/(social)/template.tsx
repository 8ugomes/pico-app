import type { ReactNode } from 'react';

export default function SocialTemplate({ children }: { children: ReactNode }) {
  return <div className="social-route-transition">{children}</div>;
}
