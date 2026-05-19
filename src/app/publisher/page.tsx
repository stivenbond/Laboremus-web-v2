import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { schedulePublishingAction } from "@/app/actions";

export default async function PublisherDashboard() {
  // Documents approved for publishing (post-approver sign-off)
  const scheduledDocs = await db.select().from(documents).where(eq(documents.status, "approved"));

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Publisher Dashboard</h1>
        <Badge className="text-lg px-4 py-1">Publisher</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schedule for Publishing</CardTitle>
            <CardDescription>Set a publish date for approved articles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scheduledDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No articles awaiting scheduling.</p>
            ) : (
              scheduledDocs.map((doc) => (
                <div key={doc.id} className="border rounded-md p-4 space-y-3">
                  <div className="font-semibold">{doc.title}</div>
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      const date = formData.get("publishDate") as string;
                      await schedulePublishingAction(doc.id, new Date(date));
                    }}
                    className="flex gap-3 items-end"
                  >
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Publish Date</label>
                      <input
                        type="datetime-local"
                        name="publishDate"
                        className="w-full p-2 border rounded-md text-sm"
                        required
                      />
                    </div>
                    <Button type="submit" size="sm">Schedule</Button>
                  </form>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduled Articles</CardTitle>
            <CardDescription>Articles with a confirmed publish date</CardDescription>
          </CardHeader>
          <CardContent>
            {scheduledDocs.filter(d => d.scheduledPublishAt).map((doc) => (
              <div key={doc.id} className="flex justify-between items-center p-3 border rounded-md mb-2">
                <span className="font-medium text-sm">{doc.title}</span>
                <Badge variant="outline">{doc.scheduledPublishAt?.toLocaleString()}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
