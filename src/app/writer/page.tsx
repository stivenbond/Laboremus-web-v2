import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WriterDashboard() {
  // Dummy data for briefs
  const assignedBriefs = [
    { id: '1', title: 'The Future of Agentic Platforms', status: 'draft' },
  ];

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Writer Workspace</h1>
        <Badge variant="secondary" className="text-lg px-4 py-1">Writer</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle>My Assignments</CardTitle>
            <CardDescription>Briefs assigned by the EIC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedBriefs.map(brief => (
              <div key={brief.id} className="flex justify-between items-center p-3 border rounded-md">
                <span className="font-medium">{brief.title}</span>
                <Link href={`/writer/edit/${brief.id}`}>
                  <Button size="sm">Open Editor</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
