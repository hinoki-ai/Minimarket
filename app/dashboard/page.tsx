import type { Metadata } from 'next';
import DashboardPageClient from './dashboard-client';

export const metadata: Metadata = {
  title: 'Panel | Minimarket ARAMAC',
  description: 'Resumen y acciones principales de tu cuenta en Minimarket ARAMAC.',
  alternates: { canonical: '/dashboard' },
  openGraph: {
    title: 'Panel | Minimarket ARAMAC',
    description: 'Resumen y acciones principales de tu cuenta en Minimarket ARAMAC.',
    url: '/dashboard',
  },
};

export default function Page() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold">Panel</h1>
      <DashboardPageClient />
    </main>
  );
}
