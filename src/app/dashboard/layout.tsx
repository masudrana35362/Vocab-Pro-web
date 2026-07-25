import ProtectedRoute from "@/components/auth/ProtectedRoute";
import TopNav from "@/components/navigation/TopNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <TopNav />

        <main className="max-w-7xl mx-auto py-6 pb-24 md:pb-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
