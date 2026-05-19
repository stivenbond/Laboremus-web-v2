'use client';

import { useState, useEffect } from 'react';
import TiptapEditor from './TiptapEditor';
import { saveDraftAction, commitVersionAction, analyzeDocumentAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function InteractiveEditor({ documentId, initialContent }: { documentId: string, initialContent: string }) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Autosave Draft
  useEffect(() => {
    const handler = setTimeout(async () => {
      setIsSaving(true);
      await saveDraftAction(documentId, content);
      setIsSaving(false);
    }, 3000); // Autosave 3 seconds after typing stops

    return () => clearTimeout(handler);
  }, [content, documentId]);

  const handleCommit = async () => {
    await commitVersionAction(documentId, "Committed new version.");
    
    // Fetch live AI recommendations using the real backend AI REST/fallback integration
    const res = await analyzeDocumentAction(content);
    if (res && Array.isArray(res)) {
      setRecommendations(res);
    } else {
      setRecommendations([
        { suggestion: "Could not retrieve live AI recommendations at this moment.", severity: "medium" }
      ]);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {isSaving ? "Saving draft..." : "All changes saved."}
          </span>
          <Button onClick={handleCommit}>Commit Version</Button>
        </div>
        <TiptapEditor content={content} onChange={setContent} />
      </div>
      
      {/* AI Sidebar */}
      <div className="w-full md:w-80 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Commit a version to see AI recommendations.</p>
            ) : (
              <ul className="space-y-4">
                {recommendations.map((rec, i) => (
                  <li key={i} className="p-3 border rounded-md text-sm">
                    <span className="font-semibold block mb-1">Suggestion ({rec.severity}):</span>
                    {rec.suggestion}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
