export const dynamic = "force-dynamic";

import { db } from "@/db";
import { documentVersions, documents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reviewDocumentAction } from "@/app/actions";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditorReviewPage({ params }: Props) {
  const resolvedParams = await params;
  const documentId = resolvedParams.id;

  // Retrieve document
  const docs = await db.select().from(documents).where(eq(documents.id, documentId));
  const doc = docs[0];

  if (!doc) return notFound();

  // Retrieve the latest committed version
  const versions = await db.select().from(documentVersions)
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(desc(documentVersions.createdAt))
    .limit(1);
  const latestVersion = versions[0];

  return (
    <div className="container mx-auto py-10 max-w-4xl space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Reviewing: {doc.title}</h1>
          <p className="text-sm text-muted-foreground">Please review the committed content below and decide.</p>
        </div>
        <Link href="/editor">
          <Button variant="outline">Back to Queue</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Committed Content</CardTitle>
        </CardHeader>
        <CardContent>
          {latestVersion ? (
            <div 
              className="prose dark:prose-invert max-w-none p-4 border rounded-md"
              dangerouslySetInnerHTML={{ __html: latestVersion.content }} 
            />
          ) : (
            <p className="text-muted-foreground text-sm">No committed versions found.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review Verdict</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea 
            className="w-full p-2 border rounded-md" 
            placeholder="Provide comments or recommendations if rejecting..." 
            rows={4}
          />
        </CardContent>
        <CardFooter className="flex gap-4">
          <form action={async () => {
            'use server';
            await reviewDocumentAction(documentId, true, "Looks good!");
          }}>
            <Button type="submit">Approve Content</Button>
          </form>

          <form action={async () => {
            'use server';
            await reviewDocumentAction(documentId, false, "Please revise.");
          }}>
            <Button type="submit" variant="destructive">Reject Content</Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
