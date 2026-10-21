import { StoryTheme } from '@/components/story/story-theme'

export default function StoryModeLayout({ children }: { children: React.ReactNode }) {
  return <StoryTheme>{children}</StoryTheme>
}
