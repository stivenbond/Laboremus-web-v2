import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FormatterDashboard() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Formatter Workspace</h1>
        <Badge variant="default" className="text-lg px-4 py-1">Formatter</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle>Awaiting Formatting</CardTitle>
            <CardDescription>Approved content ready for markdown & layout</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No items currently available.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
