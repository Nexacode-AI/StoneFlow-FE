import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Tracker – Stone Co.',
  description: 'Track your stone fabrication job progress in real time.',
};

// This layout intentionally has NO AppShell / Sidebar — it is the public client portal.
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
