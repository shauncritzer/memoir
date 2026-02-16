import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

type AuthMode = "login" | "register";

export default function Login() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.loginWithPassword.useMutation({
    onSuccess: () => {
      toast.success("Welcome back!");
      utils.auth.me.invalidate();
      navigate("/members");
    },
    onError: (err) => {
      toast.error(err.message || "Login failed");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Account created! Welcome!");
      utils.auth.me.invalidate();
      navigate("/members");
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed");
    },
  });

  // If already logged in, redirect to members
  if (!authLoading && user) {
    navigate("/members");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (mode === "login") {
      loginMutation.mutate({ email, password });
    } else {
      if (!name.trim()) {
        toast.error("Please enter your name");
        return;
      }
      registerMutation.mutate({ email, password, name: name.trim() });
    }
  };

  const isSubmitting = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />

      <div className="pt-28 pb-20 flex items-center justify-center px-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <p className="text-muted-foreground">
              {mode === "login"
                ? "Log in to access your courses and member content"
                : "Start your recovery journey today"}
            </p>
          </CardHeader>

          <CardContent>
            {/* Mode Toggle */}
            <div className="flex rounded-lg bg-muted p-1 mb-6">
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  mode === "login"
                    ? "bg-white shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setMode("login")}
              >
                Log In
              </button>
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  mode === "register"
                    ? "bg-white shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setMode("register")}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name (register only) */}
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Shaun Critzer"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "login" ? "Logging in..." : "Creating account..."}
                  </>
                ) : (
                  mode === "login" ? "Log In" : "Create Account"
                )}
              </Button>
            </form>

            {/* Footer help text */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <p>
                  Already purchased a course?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => setMode("register")}
                  >
                    Create your account
                  </button>{" "}
                  using the same email from your purchase.
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => setMode("login")}
                  >
                    Log in here
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
