export const dynamic = "force-dynamic";

import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveForPublishingAction, rejectPublishedAction } from "@/app/actions";

export default async function ApproverDashboard() {
  const pendingApproval = await db.select().from(documents).where(eq(documents.status, "scheduled"));

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Approver Dashboard</h1>
        <Badge variant="secondary" className="text-lg px-4 py-1">Approver</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Final Approval</CardTitle>
          <CardDescription>
            Approve to publish immediately or on schedule; reject to send back to Overseer & EIC.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingApproval.length === 0 ? (
            <p className="text-sm text-muted-foreground">No articles awaiting approval.</p>
          ) : (
            pendingApproval.map((doc) => (
              <div key={doc.id} className="border rounded-md p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{doc.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Scheduled: {doc.scheduledPublishAt?.toLocaleString() ?? "Immediate"}
                    </p>
                  </div>
                  <Badge variant="outline">{doc.status}</Badge>
                </div>

                <textarea
                  name="comment"
                  className="w-full p-2 border rounded-md text-sm"
                  placeholder="Rejection comment (optional)..."
                  rows={2}
                />

                <div className="flex gap-3">
                  <form action={async () => {
                    "use server";
                    await approveForPublishingAction(doc.id);
                  }}>
                    <Button type="submit" size="sm">Approve & Publish</Button>
                  </form>
                  <form action={async () => {
                    "use server";
                    await rejectPublishedAction(doc.id, "Requires further review.");
                  }}>
                    <Button type="submit" size="sm" variant="destructive">Reject</Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
