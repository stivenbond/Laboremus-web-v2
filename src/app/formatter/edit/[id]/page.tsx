import { db } from "@/db";
import { documents, documentVersions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import FormatterEditor from "@/components/editor/FormatterEditor";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FormatterEditPage({ params }: Props) {
  const { id } = await params;

  const docs = await db.select().from(documents).where(eq(documents.id, id));
  const doc = docs[0];
  if (!doc) return notFound();

  const versions = await db.select().from(documentVersions)
    .where(eq(documentVersions.documentId, id))
    .orderBy(desc(documentVersions.createdAt))
    .limit(1);

  const initialContent = versions[0]?.content ?? "<p>No approved content found.</p>";

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Formatting: {doc.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Apply markup, images, and styling. Preview updates live on the right.
          </p>
        </div>
        <form>
          <Button type="submit">Submit for Approval</Button>
        </form>
      </div>

      <FormatterEditor documentId={id} initialContent={initialContent} />
    </div>
  );
}
