import { MainNav } from '@/components/nav/main-nav';
import { Shield } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Disclaimer banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
        <Shield className="inline-block w-4 h-4 mr-1" />
        Not medical advice. Stop if pain spikes; consult your clinician.
      </div>

      <MainNav />

      {/* Main content */}
      <main className="md:ml-64 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
