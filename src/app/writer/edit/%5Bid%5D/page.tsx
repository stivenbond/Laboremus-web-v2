import { db } from "@/db";
import { documentDrafts, documents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import InteractiveEditor from "@/components/editor/InteractiveEditor";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface Props {
  params: Promise<{ id: string }>
}

export default async function WriterEditPage({ params }: Props) {
  const resolvedParams = await params;
  const documentId = resolvedParams.id;

  // Retrieve session to identify current user
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders
  });

  if (!session?.user) {
    throw new Error("Unauthorized: No session found");
  }

  // Load the document details
  const docs = await db.select().from(documents).where(eq(documents.id, documentId));
  const doc = docs[0];

  if (!doc) return notFound();

  // Load active draft for this user and document
  const drafts = await db.select().from(documentDrafts).where(
    and(
      eq(documentDrafts.documentId, documentId),
      eq(documentDrafts.authorId, session.user.id)
    )
  );

  const initialContent = drafts[0]?.content || "<p>Start writing your article here...</p>";

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col space-y-2 border-b pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Editing: {doc.title}</h1>
        <p className="text-muted-foreground text-sm">Autosave is enabled. Changes will be saved dynamically.</p>
      </div>
      
      <InteractiveEditor documentId={documentId} initialContent={initialContent} />
    </div>
  );
}
