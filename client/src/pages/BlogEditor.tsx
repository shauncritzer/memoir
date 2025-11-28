import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Save, X } from "lucide-react";
// Simple toast alternative
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
    alert(`${title}${description ? '\n' + description : ''}`);
  }
});

export default function BlogEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    coverImage: "",
    category: "",
    tags: "",
    status: "draft" as "draft" | "published" | "archived",
  });

  // Fetch all posts (including drafts)
  const { data: posts, isLoading } = trpc.blog.listAll.useQuery(undefined, {
    enabled: !!user,
  });

  // Mutations
  const createMutation = trpc.blog.create.useMutation({
    onSuccess: () => {
      toast({ title: "Blog post created successfully!" });
      utils.blog.listAll.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error creating post", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = trpc.blog.update.useMutation({
    onSuccess: () => {
      toast({ title: "Blog post updated successfully!" });
      utils.blog.listAll.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error updating post", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = trpc.blog.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Blog post deleted successfully!" });
      utils.blog.listAll.invalidate();
    },
    onError: (error) => {
      toast({ title: "Error deleting post", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      excerpt: "",
      coverImage: "",
      category: "",
      tags: "",
      status: "draft",
    });
    setIsEditing(false);
    setEditingPost(null);
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || "",
      coverImage: post.coverImage || "",
      category: post.category || "",
      tags: post.tags ? JSON.parse(post.tags).join(", ") : "",
      status: post.status,
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tags = formData.tags
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    if (editingPost) {
      updateMutation.mutate({
        id: editingPost.id,
        ...formData,
        tags,
      });
    } else {
      createMutation.mutate({
        ...formData,
        tags,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Check if user is logged in
  if (!user) {
    return (
      <div className="container max-w-4xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>
              You must be logged in to access the blog editor. <a href={getLoginUrl()} className="text-primary underline">Click here to log in</a>.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check if user is owner
  const ownerOpenId = import.meta.env.VITE_OWNER_OPEN_ID;
  if (user.openId !== ownerOpenId) {
    return (
      <div className="container max-w-4xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription>
              Only the site owner can access the blog editor.
            </CardDescription>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Debug info:</p>
              <pre className="text-xs bg-muted p-2 rounded mt-2">
                Your openId: {user.openId}\n
                Expected: {ownerOpenId}
              </pre>
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Blog Editor</h1>
        <p className="text-muted-foreground">
          Create, edit, and manage your blog posts
        </p>
      </div>

      {/* Editor Form */}
      {isEditing ? (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{editingPost ? "Edit Post" : "New Post"}</CardTitle>
                <CardDescription>
                  {editingPost ? "Update your blog post" : "Create a new blog post"}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter post title"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Excerpt</label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief summary (optional)"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Content (Markdown supported)</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your blog post content here..."
                  rows={15}
                  required
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Recovery, Personal Story"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g., addiction, hope, recovery"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Cover Image URL</label>
                <Input
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://example.com/image.jpg (optional)"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "draft" | "published" | "archived") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingPost ? "Update Post" : "Create Post"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsEditing(true)} className="mb-8">
          <Plus className="h-4 w-4 mr-2" />
          New Blog Post
        </Button>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">All Posts</h2>
        
        {isLoading ? (
          <p className="text-muted-foreground">Loading posts...</p>
        ) : !posts || posts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No blog posts yet. Create your first post above!
            </CardContent>
          </Card>
        ) : (
          posts.map((post: any) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{post.title}</CardTitle>
                      <Badge variant={post.status === "published" ? "default" : "secondary"}>
                        {post.status}
                      </Badge>
                    </div>
                    {post.excerpt && (
                      <CardDescription>{post.excerpt}</CardDescription>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{post.viewCount} views</span>
                      <span>
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : "Not published"}
                      </span>
                      {post.category && <span className="text-primary">{post.category}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(post)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
