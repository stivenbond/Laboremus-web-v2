import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EditorDashboard() {
  const pendingReviews = [
    { id: '1', title: 'The Future of Agentic Platforms', status: 'in_review', writer: 'Alice' },
  ];

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Editor Workspace</h1>
        <Badge variant="outline" className="text-lg px-4 py-1">Editor</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle>Pending Reviews</CardTitle>
            <CardDescription>Review submitted versions from writers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingReviews.map(doc => (
              <div key={doc.id} className="flex justify-between items-center p-3 border rounded-md">
                <div className="flex flex-col">
                  <span className="font-medium">{doc.title}</span>
                  <span className="text-xs text-muted-foreground">By: {doc.writer}</span>
                </div>
                <Link href={`/editor/review/${doc.id}`}>
                  <Button size="sm" variant="secondary">Review</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
