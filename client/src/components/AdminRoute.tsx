import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

/**
 * Wraps admin pages to prevent unauthorized access.
 * Shows a loading spinner while checking auth, then either renders
 * the admin page or shows an access denied message.
 */
export function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">This page requires administrator access.</p>
          <a href="/" className="inline-block text-primary hover:underline">
            Go to homepage
          </a>
        </div>
      </div>
    );
  }

  return <Component />;
}
