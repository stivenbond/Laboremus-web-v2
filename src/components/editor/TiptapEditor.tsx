'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
}

export default function TiptapEditor({ content, onChange, editable = true }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-md shadow-sm p-4 bg-background prose dark:prose-invert max-w-none">
      {editable && (
        <div className="flex gap-2 mb-4 border-b pb-4">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'font-bold bg-muted px-2 py-1 rounded' : 'px-2 py-1'}
          >
            Bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'italic bg-muted px-2 py-1 rounded' : 'px-2 py-1'}
          >
            Italic
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'font-bold bg-muted px-2 py-1 rounded' : 'px-2 py-1'}
          >
            H2
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}
