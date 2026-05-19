import { getPendingBriefsAction } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function OverseerDashboard() {
  const response = await getPendingBriefsAction();
  const pendingBriefs = (Array.isArray(response) ? response : []) as any[];

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Overseer Command Center</h1>
        <Badge variant="default" className="text-lg px-4 py-1">Overseer</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle>Brief Approvals</CardTitle>
            <CardDescription>Approve newly created briefs so writers can begin drafting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingBriefs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No briefs currently pending approval.</p>
            ) : (
              pendingBriefs.map((brief: any) => (
                <div key={brief.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <span className="font-semibold block">{brief.title}</span>
                    <span className="text-xs text-muted-foreground">Status: {brief.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm">Approve</Button>
                    <Button size="sm" variant="destructive">Reject</Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
