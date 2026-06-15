import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Signal Entities — Archive Interface',
  description: 'A cinematic pre-mint signal-hunting interface for Signal Entities.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
