import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Database, FileText, BookOpen, Package, Users, Copy, Check } from "lucide-react";

export default function AdminSeed() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [copiedOpenId, setCopiedOpenId] = useState<string | null>(null);

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

  const { data: usersData, refetch: refetchUsers } = trpc.adminSetup.getUsers.useQuery(
    { password },
    { enabled: isAuthenticated }
  );

  const runMigrations = trpc.adminSetup.runMigrations.useMutation({
    onSuccess: () => {
      refetchStatus();
      refetchUsers();
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedOpenId(text);
      setTimeout(() => setCopiedOpenId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPassword.mutate({ password });
  };

  const handleRunMigrations = () => {
    if (confirm("This will create/update database tables. Continue?")) {
      runMigrations.mutate({ password });
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

        {/* Users & OpenID Section */}
        {usersData && usersData.users.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User OpenIDs
              </CardTitle>
              <CardDescription>
                After logging in, find your OpenID below and update the OWNER_OPEN_ID environment variable
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usersData.ownerOpenId && (
                  <Alert>
                    <AlertDescription>
                      <strong>Current OWNER_OPEN_ID:</strong> <code className="bg-muted px-2 py-1 rounded">{usersData.ownerOpenId}</code>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  {usersData.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{user.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            {user.role}
                          </span>
                          {user.openId === usersData.ownerOpenId && (
                            <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-700 dark:text-green-400">
                              Owner
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-xs bg-background px-2 py-1 rounded border">
                            {user.openId}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(user.openId)}
                            className="h-6 w-6 p-0"
                          >
                            {copiedOpenId === user.openId ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>

                {usersData.ownerOpenId === "temp123" && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Action Required:</strong> OWNER_OPEN_ID is still set to "temp123".
                      Copy your OpenID above and update the OWNER_OPEN_ID environment variable in Railway.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Seeding Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              2. Seed Data
            </CardTitle>
            <CardDescription>
              Populate your database with initial content. Make sure you've logged in to the website first to create your admin account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status?.users === 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  No users found. Please log in to the website first to create your admin account before seeding.
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
                <strong>Login First:</strong> Visit the homepage and log in via OAuth to create your admin account
              </li>
              <li>
                <strong>Copy Your OpenID:</strong> After logging in, refresh this page to see your OpenID in the "User OpenIDs" section above
              </li>
              <li>
                <strong>Update OWNER_OPEN_ID:</strong> In Railway, update the OWNER_OPEN_ID environment variable with your actual OpenID (replace "temp123")
              </li>
              <li>
                <strong>Seed Data:</strong> Click "Seed All Data" to populate content (blog posts + lead magnets)
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
