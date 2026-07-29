import type { Block } from 'payload'
import { blockKeyField } from '@/fields/block-key'

export const Video: Block = {
  slug: 'video',
  labels: { singular: 'Video', plural: 'Videos' },
  fields: [
    blockKeyField(),
    { name: 'title', type: 'text', required: true },
    { name: 'video', type: 'upload', relationTo: 'media' },
    { name: 'videoLabel', type: 'text', label: 'Video description (for editors)' },
    { name: 'caption', type: 'text' },
  ],
}
