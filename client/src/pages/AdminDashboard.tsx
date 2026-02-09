import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ShoppingCart, Loader2, CheckCircle2, XCircle, Gift, Ban } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [productId, setProductId] = useState("");
  const [note, setNote] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const trpcUtils = trpc.useUtils();

  // Queries
  const { data: users, isLoading: usersLoading } = trpc.admin.getAllUsers.useQuery();
  const { data: purchases, isLoading: purchasesLoading } = trpc.admin.getAllPurchases.useQuery();

  // Mutations
  const grantAccess = trpc.admin.grantCourseAccess.useMutation({
    onSuccess: () => {
      trpcUtils.admin.getAllUsers.invalidate();
      trpcUtils.admin.getAllPurchases.invalidate();
      setSelectedUserId(null);
      setProductId("");
      setNote("");
    },
  });

  const revokeAccess = trpc.admin.revokeCourseAccess.useMutation({
    onSuccess: () => {
      trpcUtils.admin.getAllUsers.invalidate();
      trpcUtils.admin.getAllPurchases.invalidate();
      setRevokeReason("");
    },
  });

  const filteredUsers = users?.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPurchases = purchases?.filter(
    (purchase) =>
      purchase.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.productId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage users, purchases, and course access
            </p>
          </div>
          <Link href="/admin/content">
            <Button variant="outline">Content Admin →</Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="purchases">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Purchases
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Users</CardTitle>
                  <div className="flex items-center gap-4">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Login Method</TableHead>
                          <TableHead>Purchases</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Last Sign In</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers?.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name || "—"}</TableCell>
                            <TableCell>{user.email || "—"}</TableCell>
                            <TableCell className="capitalize">{user.loginMethod || "—"}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                {user.purchaseCount}
                              </span>
                            </TableCell>
                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                            <TableCell>{formatDate(user.lastSignedIn)}</TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedUserId(user.id)}
                                  >
                                    <Gift className="mr-2 h-4 w-4" />
                                    Grant Access
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Grant Course Access</DialogTitle>
                                    <DialogDescription>
                                      Give {user.name || user.email} free access to a course
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="product">Course</Label>
                                      <Select value={productId} onValueChange={setProductId}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="7-day-reset">
                                            7-Day REWIRED Reset
                                          </SelectItem>
                                          <SelectItem value="from-broken-to-whole">
                                            From Broken to Whole (30-Day)
                                          </SelectItem>
                                          <SelectItem value="bent-not-broken-circle">
                                            Bent Not Broken Circle (Monthly)
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="note">Note (optional)</Label>
                                      <Textarea
                                        id="note"
                                        placeholder="Reason for granting access (e.g., scholarship, comp, etc.)"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      onClick={() => {
                                        if (selectedUserId && productId) {
                                          grantAccess.mutate({
                                            userId: selectedUserId,
                                            productId,
                                            note,
                                          });
                                        }
                                      }}
                                      disabled={!productId || grantAccess.isPending}
                                    >
                                      {grantAccess.isPending ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Granting...
                                        </>
                                      ) : (
                                        "Grant Access"
                                      )}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Purchases</CardTitle>
                  <Input
                    placeholder="Search purchases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {purchasesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPurchases?.map((purchase) => (
                          <TableRow key={purchase.id}>
                            <TableCell className="font-medium">
                              {purchase.userName || "—"}
                            </TableCell>
                            <TableCell>{purchase.userEmail || "—"}</TableCell>
                            <TableCell className="capitalize">
                              {purchase.productId.replace(/-/g, " ")}
                            </TableCell>
                            <TableCell>
                              {purchase.amount === 0 ? (
                                <span className="text-muted-foreground">Free</span>
                              ) : (
                                formatPrice(purchase.amount)
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  purchase.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : purchase.status === "refunded"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : purchase.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {purchase.status === "completed" && (
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                )}
                                {purchase.status === "cancelled" && (
                                  <XCircle className="mr-1 h-3 w-3" />
                                )}
                                {purchase.status}
                              </span>
                            </TableCell>
                            <TableCell>{formatDate(purchase.purchasedAt)}</TableCell>
                            <TableCell>
                              {purchase.status === "completed" && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      <Ban className="mr-2 h-4 w-4" />
                                      Revoke
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Revoke Access</DialogTitle>
                                      <DialogDescription>
                                        This will cancel access for {purchase.userEmail}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="reason">Reason</Label>
                                        <Textarea
                                          id="reason"
                                          placeholder="Reason for revoking access"
                                          value={revokeReason}
                                          onChange={(e) => setRevokeReason(e.target.value)}
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button
                                        variant="destructive"
                                        onClick={() => {
                                          revokeAccess.mutate({
                                            purchaseId: purchase.id,
                                            reason: revokeReason,
                                          });
                                        }}
                                        disabled={revokeAccess.isPending}
                                      >
                                        {revokeAccess.isPending ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Revoking...
                                          </>
                                        ) : (
                                          "Revoke Access"
                                        )}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
