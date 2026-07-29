import type { Block } from 'payload'
import { blockKeyField } from '@/fields/block-key'

// Pulls a random prayer submitted by another visitor on every page load —
// resolved dynamically at request time, a different mechanism from
// segment-based personalization, so this block carries no personalization
// field (see the equivalent note in the old mockup's store.js).
export const RotatingPrayer: Block = {
  slug: 'rotating_prayer',
  labels: { singular: 'Rotating Prayer', plural: 'Rotating Prayer blocks' },
  fields: [
    blockKeyField(),
    {
      name: 'note',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/StaticNote#StaticNote',
        },
      },
    },
  ],
}
