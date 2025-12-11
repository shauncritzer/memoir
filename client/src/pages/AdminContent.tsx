import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function AdminContent() {
  const [blogStatus, setBlogStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [blogMessage, setBlogMessage] = useState("");
  const [pdfStatus, setPdfStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pdfMessage, setPdfMessage] = useState("");

  const seedBlogMutation = trpc.admin.seedNewBlogPosts.useMutation({
    onSuccess: (data) => {
      setBlogStatus("success");
      setBlogMessage(data.message || `Successfully seeded ${data.postsCreated} blog posts!`);
    },
    onError: (error) => {
      setBlogStatus("error");
      setBlogMessage(error.message);
    },
  });

  const updatePdfMutation = trpc.admin.updateProductPDFs.useMutation({
    onSuccess: (data) => {
      setPdfStatus("success");
      setPdfMessage(data.message || "Successfully updated all PDFs!");
    },
    onError: (error) => {
      setPdfStatus("error");
      setPdfMessage(error.message);
    },
  });

  const handleSeedBlogs = () => {
    setBlogStatus("loading");
    setBlogMessage("");
    seedBlogMutation.mutate({});
  };

  const handleUpdatePdfs = () => {
    setPdfStatus("loading");
    setPdfMessage("");
    updatePdfMutation.mutate({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-center space-y-2 flex-1">
            <h1 className="text-3xl font-bold">Content Admin</h1>
            <p className="text-muted-foreground">
              Manage blog posts and product PDFs
            </p>
          </div>
          <Link href="/admin/seed">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Main Admin
            </Button>
          </Link>
        </div>

        <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-200">
            <strong>⚠️ Important:</strong> Each button below performs a separate, independent action.
            Clicking one will NOT trigger the others. Review what each button does before clicking.
          </p>
        </div>

        {/* Blog Posts Section */}
        <div className="space-y-4 border-b pb-6">
          <h3 className="font-semibold text-lg">Blog Posts</h3>
          <p className="text-sm text-muted-foreground">
            <strong>What this does:</strong> Seeds the database with 5 new blog posts about trauma-informed recovery:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-4">
            <li>Your Addiction Isn't a Moral Failing, It's a Nervous System Problem</li>
            <li>The Most Underrated Tool in Recovery: Self-Compassion</li>
            <li>Why Your Inner Child Might Be Driving Your Addiction</li>
            <li>Why You Can't Think Your Way Out of Trauma (And What to Do Instead)</li>
            <li>Beyond Sobriety: Introducing the REWIRED Method for Lasting Recovery</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This will NOT overwrite existing blog posts. It only adds new ones if they don't already exist.
          </p>

          <Button
            onClick={handleSeedBlogs}
            disabled={blogStatus === "loading"}
            variant="default"
            className="w-full h-12 text-lg bg-teal-600 hover:bg-teal-700 text-white font-bold"
          >
            {blogStatus === "loading" ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Seeding Blog Posts...
              </>
            ) : (
              "Seed 5 New Blog Posts"
            )}
          </Button>

          {blogMessage && (
            <div className={`flex items-center gap-2 p-4 rounded-lg ${
              blogStatus === "success" ? "bg-green-900/20 text-green-200" : "bg-red-900/20 text-red-200"
            }`}>
              {blogStatus === "success" ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <p className="text-sm">{blogMessage}</p>
            </div>
          )}
        </div>

        {/* PDFs Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Product PDFs</h3>
          <p className="text-sm text-muted-foreground">
            <strong>What this does:</strong> Updates the database with the latest product PDF URLs:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-4">
            <li><strong>Recovery Toolkit</strong> - 10-page nervous system recovery guide (UTF-8 encoded)</li>
            <li><strong>REWIRED 7-Day Reset</strong> - New workbook mapped to REWIRED framework</li>
            <li><strong>From Broken to Whole</strong> - 30-day course workbook (Part 1 & 2)</li>
            <li><strong>Thriving Sober</strong> - 50+ practical tips (renamed from Living Sober)</li>
            <li><strong>REWIRED Relief Toolkit</strong> - Crisis-focused freebie for refund policy</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This will update the PDF URLs in the database to point to the latest versions. 
            Make sure the PDFs are already uploaded to the correct location before running this.
          </p>

          <Button
            onClick={handleUpdatePdfs}
            disabled={pdfStatus === "loading"}
            variant="default"
            className="w-full h-12 text-lg bg-amber-600 hover:bg-amber-700 text-black font-bold"
          >
            {pdfStatus === "loading" ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Updating PDFs...
              </>
            ) : (
              "Update Product PDF URLs"
            )}
          </Button>

          {pdfMessage && (
            <div className={`flex items-center gap-2 p-4 rounded-lg ${
              pdfStatus === "success" ? "bg-green-900/20 text-green-200" : "bg-red-900/20 text-red-200"
            }`}>
              {pdfStatus === "success" ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <p className="text-sm">{pdfMessage}</p>
            </div>
          )}
        </div>

        <div className="pt-6 border-t">
          <p className="text-xs text-center text-muted-foreground">
            Need to run database migrations? <Link href="/admin/seed" className="underline">Go to Main Admin</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
