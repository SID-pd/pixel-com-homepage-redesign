import type { Metadata } from 'next'
import { EditorView } from '@/components/flow/editor/editor-view'

export const metadata: Metadata = {
  title: 'Design your photo book | Pixovo',
  robots: { index: false },
}

export default function EditorPage() {
  return <EditorView />
}
