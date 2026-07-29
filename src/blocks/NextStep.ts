import type { Block, Field } from 'payload'
import { blockKeyField } from '@/fields/block-key'

// Exported so a Variant's list-scope override can reuse the exact same row
// shape when overriding this block's `options` field.
export function nextStepOptionFields(): Field[] {
  return [
    { name: 'label', type: 'text', required: true },
    { name: 'targetJourney', type: 'relationship', relationTo: 'journeys' },
  ]
}

export const NextStep: Block = {
  slug: 'next_step',
  labels: { singular: 'Next Step', plural: 'Next Step blocks' },
  fields: [
    blockKeyField(),
    {
      name: 'options',
      type: 'array',
      labels: { singular: 'Option', plural: 'Options' },
      fields: nextStepOptionFields(),
    },
  ],
}
