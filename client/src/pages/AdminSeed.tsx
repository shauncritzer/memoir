import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Database, FileText, BookOpen, Package } from "lucide-react";

export default function AdminSeed() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");

  const verifyPassword = trpc.adminSetup.verifyPassword.useMutation({
    onSuccess: (data) => {
      if (data.valid) {
        setIsAuthenticated(true);
        setError("");
      } else {
        setError("Invalid password");
      }
    },
  });

  const { data: status, refetch: refetchStatus } = trpc.adminSetup.checkStatus.useQuery(
    { password },
    { enabled: isAuthenticated }
  );

  const runMigrations = trpc.adminSetup.runMigrations.useMutation({
    onSuccess: () => {
      refetchStatus();
    },
  });

  const createAdmin = trpc.adminSetup.createAdmin.useMutation({
    onSuccess: () => {
      refetchStatus();
    },
  });

  const seedBlogPosts = trpc.adminSetup.seedBlogPosts.useMutation({
    onSuccess: () => {
      refetchStatus();
    },
  });

  const seedLeadMagnets = trpc.adminSetup.seedLeadMagnets.useMutation({
    onSuccess: () => {
      refetchStatus();
    },
  });

  const seedAll = trpc.adminSetup.seedAll.useMutation({
    onSuccess: () => {
      refetchStatus();
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPassword.mutate({ password });
  };

  const handleRunMigrations = () => {
    if (confirm("This will create/update database tables. Continue?")) {
      runMigrations.mutate({ password });
    }
  };

  const handleCreateAdmin = () => {
    if (confirm("This will create an admin user for blog post authoring. Continue?")) {
      createAdmin.mutate({ password });
    }
  };

  const handleSeedBlogPosts = () => {
    if (confirm("This will seed blog posts. Continue?")) {
      seedBlogPosts.mutate({ password });
    }
  };

  const handleSeedLeadMagnets = () => {
    if (confirm("This will seed lead magnets. Continue?")) {
      seedLeadMagnets.mutate({ password });
    }
  };

  const handleSeedAll = () => {
    if (confirm("This will seed all data (blog posts + lead magnets). Continue?")) {
      seedAll.mutate({ password });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Setup Admin
            </CardTitle>
            <CardDescription>Enter the setup password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Setup password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={verifyPassword.isPending}>
                {verifyPassword.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Default password: <code className="bg-muted px-1 py-0.5 rounded">setup2025</code>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Database className="h-6 w-6" />
              Database Setup & Seeding
            </CardTitle>
            <CardDescription>
              Manage database migrations and seed your Railway deployment with initial data
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            {status ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Blog Posts</p>
                    <p className="text-2xl font-bold">{status.blogPosts}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Lead Magnets</p>
                    <p className="text-2xl font-bold">{status.leadMagnets}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Users</p>
                    <p className="text-2xl font-bold">{status.users}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Migration Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              1. Database Migrations
            </CardTitle>
            <CardDescription>
              Create or update database tables. Run this first if tables don't exist yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status?.needsMigration && (
              <Alert>
                <AlertDescription>
                  Database tables not found. Please run migrations first.
                </AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleRunMigrations}
              disabled={runMigrations.isPending}
              className="w-full"
            >
              {runMigrations.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Migrations...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Run Database Migrations
                </>
              )}
            </Button>
            {runMigrations.isSuccess && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{runMigrations.data.message}</AlertDescription>
              </Alert>
            )}
            {runMigrations.isError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{runMigrations.error.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Create Admin Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              2. Create Admin User
            </CardTitle>
            <CardDescription>
              Create an admin user account required for blog post authoring. Run this before seeding blog posts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status?.users > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Admin user already exists! You can proceed to seed data.
                </AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleCreateAdmin}
              disabled={createAdmin.isPending}
              className="w-full"
            >
              {createAdmin.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Admin User...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Create Admin User
                </>
              )}
            </Button>
            {createAdmin.isSuccess && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{createAdmin.data.message}</AlertDescription>
              </Alert>
            )}
            {createAdmin.isError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{createAdmin.error.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Seeding Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              3. Seed Data
            </CardTitle>
            <CardDescription>
              Populate your database with initial content. Make sure you've created an admin user first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status?.users === 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  No users found. Please create an admin user above before seeding blog posts.
                </AlertDescription>
              </Alert>
            )}

            {/* Seed All Button */}
            <div className="p-4 border-2 border-dashed rounded-lg space-y-3">
              <div>
                <h3 className="font-semibold mb-1">Quick Setup (Recommended)</h3>
                <p className="text-sm text-muted-foreground">
                  Seeds everything at once: 5 blog posts + 3 lead magnets
                </p>
              </div>
              <Button
                onClick={handleSeedAll}
                disabled={seedAll.isPending || status?.users === 0}
                variant="default"
                className="w-full"
              >
                {seedAll.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Seeding All Data...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Seed All Data
                  </>
                )}
              </Button>
              {seedAll.isSuccess && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {seedAll.data.messages.map((msg, i) => (
                        <p key={i}>{msg}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              {seedAll.isError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{seedAll.error.message}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Individual Seed Buttons */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">Or Seed Individually:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Button
                    onClick={handleSeedBlogPosts}
                    disabled={seedBlogPosts.isPending || status?.users === 0}
                    variant="outline"
                    className="w-full"
                  >
                    {seedBlogPosts.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Seeding...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Seed Blog Posts (5)
                      </>
                    )}
                  </Button>
                  {seedBlogPosts.isSuccess && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>{seedBlogPosts.data.message}</AlertDescription>
                    </Alert>
                  )}
                  {seedBlogPosts.isError && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{seedBlogPosts.error.message}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleSeedLeadMagnets}
                    disabled={seedLeadMagnets.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {seedLeadMagnets.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Seeding...
                      </>
                    ) : (
                      <>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Seed Lead Magnets (3)
                      </>
                    )}
                  </Button>
                  {seedLeadMagnets.isSuccess && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>{seedLeadMagnets.data.message}</AlertDescription>
                    </Alert>
                  )}
                  {seedLeadMagnets.isError && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{seedLeadMagnets.error.message}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <strong>Run Migrations:</strong> Click "Run Database Migrations" to create tables
              </li>
              <li>
                <strong>Create Admin:</strong> Click "Create Admin User" to create the user account
              </li>
              <li>
                <strong>Seed Data:</strong> Click "Seed All Data" to populate blog posts and lead magnets
              </li>
              <li>
                <strong>Verify:</strong> Check your blog and resources pages to confirm everything loaded
              </li>
            </ol>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> Paid products are managed in Stripe, not this database.
                Configure Stripe Price IDs in your Railway environment variables.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
