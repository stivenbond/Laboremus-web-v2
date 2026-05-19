'use client';

import { useState } from "react";
import TiptapEditor from "@/components/editor/TiptapEditor";

interface FormatterEditorProps {
  documentId: string;
  initialContent: string;
}

export default function FormatterEditor({ initialContent }: FormatterEditorProps) {
  const [content, setContent] = useState(initialContent);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Editor Pane */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Markup Editor</h2>
          <span className="text-xs text-muted-foreground">Format with Tiptap</span>
        </div>
        <TiptapEditor content={content} onChange={setContent} editable={true} />
      </div>

      {/* Live Preview Pane */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Live Preview</h2>
          <span className="text-xs text-muted-foreground">Final render</span>
        </div>
        <div className="border rounded-md p-6 bg-background min-h-[400px] overflow-auto">
          <article
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  );
}
