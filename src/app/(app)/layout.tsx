import { MainNav } from '@/components/nav/main-nav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <MainNav />

      {/* Main content - pt-14 for mobile header, pb-20 for mobile bottom nav */}
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
