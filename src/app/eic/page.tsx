import { db } from "@/db";
import { documents, users } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reassignDocumentAction } from "@/app/actions";

const STATUS_COLORS: Record<string, string> = {
  draft: "secondary",
  in_review: "default",
  approved: "default",
  formatting: "default",
  formatting_review: "default",
  scheduled: "outline",
  published: "default",
  rejected: "destructive",
};

export default async function EICDashboard() {
  // Live pipeline — all documents
  const allDocs = await db.select().from(documents);
  const writers = (await db.select().from(users)) as any[];
  const editors = writers; // same pool, different role filter done in UI

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Editor-in-Chief Command</h1>
        <Badge variant="destructive" className="text-lg px-4 py-1">EIC</Badge>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Content Pipeline</CardTitle>
          <CardDescription>
            All articles across every stage — you can interject and reassign at any point.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {allDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No articles in the pipeline yet.</p>
          ) : (
            allDocs.map((doc) => (
              <div key={doc.id} className="border rounded-md p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <p className="font-semibold">{doc.title}</p>
                  <Badge variant={(STATUS_COLORS[doc.status] as any) ?? "outline"}>
                    {doc.status.replace(/_/g, " ")}
                  </Badge>
                </div>

                {/* Reassignment form */}
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    const newWriterId = formData.get("writerId") as string | null;
                    const newEditorId = formData.get("editorId") as string | null;
                    await reassignDocumentAction(doc.id, newWriterId, newEditorId);
                  }}
                  className="flex flex-wrap gap-3 items-end"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Reassign Writer</label>
                    <select name="writerId" defaultValue={doc.assignedWriterId ?? ""} className="p-2 border rounded-md text-sm">
                      <option value="">— No change —</option>
                      {writers
                        .filter((u) => u.role === "writer")
                        .map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Reassign Editor</label>
                    <select name="editorId" defaultValue={doc.assignedEditorId ?? ""} className="p-2 border rounded-md text-sm">
                      <option value="">— No change —</option>
                      {writers
                        .filter((u) => u.role === "editor")
                        .map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                  </div>
                  <Button type="submit" size="sm" variant="outline">Reassign</Button>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
