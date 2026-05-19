import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>
}

import { db } from "@/db";
import { documents, documentVersions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

interface Props {
  params: Promise<{ slug: string }>
}

// Dynamically generate SEO metadata based on the specific post from database
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.slug;
  
  const docs = await db.select().from(documents).where(eq(documents.id, id));
  const doc = docs[0];
  
  const title = doc ? doc.title : "Article Not Found";
  const description = `Read this amazing publication on Laboremus: ${title}.`;

  return {
    title: `${title} | Laboremus`,
    description: description,
    openGraph: {
      title,
      description,
      type: 'article',
    }
  };
}

export default async function BlogPost({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.slug;
  
  if (!id) return notFound();

  // Load document
  const docs = await db.select().from(documents).where(eq(documents.id, id));
  const doc = docs[0];

  if (!doc) return notFound();

  // Load latest version content
  const versions = await db.select().from(documentVersions)
    .where(eq(documentVersions.documentId, id))
    .orderBy(desc(documentVersions.createdAt))
    .limit(1);
  const content = versions[0]?.content || "<p>This article does not have any content yet.</p>";

  return (
    <article className="container mx-auto py-12 max-w-3xl">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8 capitalize leading-tight">
        {doc.title}
      </h1>
      <div 
        className="prose prose-lg dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  );
}
