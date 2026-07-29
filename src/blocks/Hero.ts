import type { Block } from 'payload'
import { blockKeyField } from '@/fields/block-key'

export const Hero: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    blockKeyField(),
    { name: 'headline', type: 'text', required: true },
    { name: 'subhead', type: 'textarea' },
    { name: 'media', type: 'upload', relationTo: 'media' },
  ],
}
