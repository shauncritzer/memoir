import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

/**
 * Magic-link landing page. Buyers arrive here from the access email
 * (/access?token=...) — we redeem the token, set the session cookie,
 * and send them to their courses.
 */
export default function AccessLink() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"redeeming" | "success" | "error">("redeeming");
  const [errorMessage, setErrorMessage] = useState("");
  const attempted = useRef(false);

  const utils = trpc.useUtils();
  const redeem = trpc.auth.redeemAccessLink.useMutation({
    onSuccess: () => {
      setStatus("success");
      utils.auth.me.invalidate();
      setTimeout(() => navigate("/members"), 1500);
    },
    onError: (err) => {
      setStatus("error");
      setErrorMessage(err.message);
    },
  });

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setErrorMessage("No access token found in the link. Please use the full link from your email.");
      return;
    }
    redeem.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <div className="pt-28 pb-20 flex items-center justify-center px-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {status === "redeeming" && "Logging you in..."}
              {status === "success" && "You're in!"}
              {status === "error" && "Link problem"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === "redeeming" && (
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-[#D4AF37]" />
            )}
            {status === "success" && (
              <>
                <CheckCircle2 className="h-10 w-10 mx-auto text-green-600" />
                <p className="text-muted-foreground">Taking you to your courses...</p>
              </>
            )}
            {status === "error" && (
              <>
                <XCircle className="h-10 w-10 mx-auto text-red-600" />
                <p className="text-muted-foreground">{errorMessage}</p>
                <Button onClick={() => navigate("/login")} className="w-full">
                  Go to Login
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
