import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
        <Badge variant="destructive" className="text-lg px-4 py-1">Super User</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
            <CardDescription>System health and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">All systems operational.</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Assign Overseers & Publishers</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Table component goes here */}
            <p className="text-muted-foreground text-sm">User list loading...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
