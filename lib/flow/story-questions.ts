import type { StoryOccasion } from './story'

// The two or three short questions Pixie asks after a template is picked. They are all optional, and they exist for one
// reason: the answers (who, where, what mattered) are what make the generated captions and the title sound like the
// customer's own story instead of generic lines.

export type Question = { id: string; ask: string; placeholder?: string; chips?: string[] }

/** Keyed by the template's tag ("Travel", "Wedding", …), with `none` for "no template". */
export const QUESTIONS: Record<string, Question[]> = {
  Travel: [
    { id: 'where', ask: 'Ooh, a trip! Where did you go?', placeholder: 'e.g. Lisbon, the Grand Canyon, Goa…' },
    { id: 'who', ask: 'And who came along?', chips: ['Family', 'My partner', 'Friends', 'Solo', 'Colleagues'] },
    { id: 'highlight', ask: 'What was the highlight?', placeholder: 'e.g. sunrise at the beach, the street food…' },
  ],
  Wedding: [
    { id: 'names', ask: 'A wedding, lovely! What are the couple’s names?', placeholder: 'e.g. Maya & Arjun' },
    { id: 'venue', ask: 'Where did it happen?', placeholder: 'e.g. a garden in Jaipur' },
    { id: 'moment', ask: 'Which moment do you replay the most?', placeholder: 'e.g. the first dance, the vows…' },
  ],
  Family: [
    { id: 'who', ask: 'Who’s in this book?', chips: ['Our kids', 'Parents & grandparents', 'The whole family', 'Just the two of us'] },
    { id: 'when', ask: 'What’s the occasion or time of year?', chips: ['A holiday', 'A birthday', 'Everyday life', 'A whole year'] },
    { id: 'remember', ask: 'One thing you never want to forget?', placeholder: 'e.g. their laughter at bedtime…' },
  ],
  Journal: [
    { id: 'about', ask: 'What is this journal about?', placeholder: 'e.g. my first year in a new city' },
    { id: 'when', ask: 'When did it happen?', chips: ['This year', 'The last few months', 'Over many years'] },
  ],
  Minimal: [
    { id: 'kind', ask: 'What kind of photos are these?', chips: ['Portraits', 'Landscapes', 'Street', 'A bit of everything'] },
    { id: 'title', ask: 'Anything you’d like the book called?', placeholder: 'e.g. Quiet Mornings' },
  ],
  Gift: [
    { id: 'forWho', ask: 'A gift! Who is it for?', placeholder: 'e.g. Mom, my best friend…' },
    { id: 'occasion', ask: 'What’s the occasion?', chips: ['Birthday', 'Anniversary', 'Thank you', 'Just because'] },
    { id: 'line', ask: 'A line you’d like on the first page?', placeholder: 'e.g. Thank you for everything' },
  ],
  none: [
    { id: 'about', ask: 'What’s this book about?', placeholder: 'e.g. our summer, the new baby, a school year…' },
    { id: 'who', ask: 'Who’s in the photos?', chips: ['Family', 'Friends', 'Just me', 'Pets'] },
  ],
}

export const OCCASION_FOR_TAG: Record<string, StoryOccasion> = {
  Travel: 'travel',
  Wedding: 'wedding',
  Family: 'family',
  Gift: 'milestone',
  Journal: 'general',
  Minimal: 'general',
  none: 'general',
}

const t = (s?: string) => (s ?? '').trim()
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const clip = (s: string, n = 40) => (s.length > n ? s.slice(0, n).trim() : s)

/** Turn the answers into the sentences the caption writer works from, plus a title when the answers imply one. */
export function describe(tag: string, a: Record<string, string>): { description: string; title?: string } {
  const g = (k: string) => t(a[k])
  const parts: string[] = []
  let title: string | undefined

  switch (tag) {
    case 'Travel': {
      if (g('where')) {
        parts.push(`Our trip to ${g('where')}`)
        title = `Our trip to ${g('where')}`
      }
      if (g('who')) parts.push(g('who') === 'Solo' ? 'A solo adventure' : `Together with ${g('who').toLowerCase()}`)
      if (g('highlight')) parts.push(cap(g('highlight')))
      break
    }
    case 'Wedding': {
      if (g('names')) {
        parts.push(`${g('names')}’s wedding`)
        title = `${g('names')}’s Wedding`
      }
      if (g('venue')) parts.push(`At ${g('venue')}`)
      if (g('moment')) parts.push(cap(g('moment')))
      break
    }
    case 'Family': {
      if (g('who')) parts.push(`Moments with ${g('who').toLowerCase()}`)
      if (g('when')) parts.push(cap(g('when')))
      if (g('remember')) parts.push(cap(g('remember')))
      break
    }
    case 'Journal': {
      if (g('about')) {
        parts.push(cap(g('about')))
        title = cap(g('about'))
      }
      if (g('when')) parts.push(g('when'))
      break
    }
    case 'Minimal': {
      if (g('kind')) parts.push(g('kind'))
      if (g('title')) title = cap(g('title'))
      break
    }
    case 'Gift': {
      if (g('forWho')) {
        parts.push(`A gift for ${g('forWho')}`)
        title = `For ${g('forWho')}`
      }
      if (g('occasion')) parts.push(g('occasion'))
      if (g('line')) parts.push(cap(g('line')))
      break
    }
    default: {
      if (g('about')) {
        parts.push(cap(g('about')))
        title = cap(g('about'))
      }
      if (g('who')) parts.push(`With ${g('who').toLowerCase()}`)
    }
  }
  return { description: parts.join('. '), title: title ? clip(title) : undefined }
}
