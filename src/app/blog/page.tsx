export const dynamic = "force-dynamic";

import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: 'Laboremus Blog | Official Publications',
  description: 'Read the latest insights and articles published on the Laboremus platform.',
  openGraph: {
    title: 'Laboremus Blog',
    description: 'Read the latest insights and articles.',
    type: 'website',
  }
};

export default async function BlogIndex() {
  // Fetch live published documents from the database
  const posts = await db.select().from(documents).where(eq(documents.status, 'published'));

  return (
    <div className="container mx-auto py-12 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl text-primary">Laboremus Journal</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Explore the latest thoughts, tutorials, and research from our expert writers.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
        {posts.length === 0 ? (
          <p className="text-muted-foreground text-center col-span-full">No articles have been published yet.</p>
        ) : (
          posts.map(post => (
            <Link href={`/blog/${post.id}`} key={post.id} className="transition-transform hover:-translate-y-1">
              <Card className="h-full border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-2xl">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">Read full article...</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
