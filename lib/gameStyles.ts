import type { AiStyle } from './types'

export interface StyleDefinition {
  label: string
  prompt: string
  color: string // tailwind bg color for the badge
}

export const STYLE_DEFINITIONS: Record<AiStyle, StyleDefinition> = {
  none: {
    label: 'No Style',
    prompt: 'Vibrant colorful illustration, use the sketch as a rough guide: ',
    color: 'bg-gray-500',
  },
  watercolour: {
    label: 'Watercolour',
    prompt:
      'a beautiful detailed watercolour painting of the subject shown in this sketch. Enhance and render the drawing with soft wet brushstrokes, flowing colour washes, delicate bleeding ink edges, warm natural tones. The subject should be clearly recognisable from the original sketch. High quality illustration, professional artwork, vibrant yet soft colours on white paper.',
    color: 'bg-blue-500',
  },
  pencil: {
    label: 'Oil Painting',
    prompt:
      'a rich detailed oil painting of the subject shown in this sketch, painted in the expressive style of Van Gogh. Enhance the drawing with thick swirling impasto brushstrokes, vivid saturated colours, emotional energy. The subject and composition from the sketch should remain clearly identifiable. Museum quality fine art, masterpiece.',
    color: 'bg-orange-500',
  },
  cubist: {
    label: 'Cubist',
    prompt:
      'a bold cubist painting of the subject shown in this sketch, in the style of Picasso. Enhance the drawing by breaking the subject into geometric angular fragments, showing multiple perspectives at once, using vivid primary colours and strong black outlines. The subject from the sketch should still be recognisable despite the cubist abstraction. Professional fine art.',
    color: 'bg-amber-500',
  },
}

export const STYLES = Object.keys(STYLE_DEFINITIONS) as AiStyle[]
