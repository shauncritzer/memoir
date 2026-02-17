import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useState } from "react";

/**
 * Wraps admin pages to prevent unauthorized access.
 * Shows a loading spinner while checking auth, then either renders
 * the admin page or shows an access denied message.
 * If logged in but not admin, shows a promote form.
 */
export function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [promoting, setPromoting] = useState(false);

  const promoteMutation = trpc.admin.promoteToAdmin.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
    onError: (err) => {
      setError(err.message);
      setPromoting(false);
    },
  });

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
          {isAuthenticated && user && (
            <div className="mt-6 max-w-sm mx-auto space-y-3">
              <p className="text-sm text-gray-500">Site owner? Enter your admin secret to activate access:</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setError("");
                  setPromoting(true);
                  promoteMutation.mutate({ secret });
                }}
                className="flex gap-2"
              >
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Admin secret"
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <button
                  type="submit"
                  disabled={promoting || !secret}
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm disabled:opacity-50"
                >
                  {promoting ? "..." : "Activate"}
                </button>
              </form>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          )}
          <a href="/" className="inline-block text-primary hover:underline">
            Go to homepage
          </a>
        </div>
      </div>
    );
  }

  return <Component />;
}
