import type { Block } from 'payload'
import { blockKeyField } from '@/fields/block-key'

export const Text: Block = {
  slug: 'text',
  labels: { singular: 'Text', plural: 'Text blocks' },
  fields: [blockKeyField(), { name: 'body', type: 'textarea', required: true }],
}
