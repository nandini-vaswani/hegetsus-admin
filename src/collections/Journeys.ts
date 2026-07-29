import type { CollectionConfig } from 'payload'
import { journeyBlocks } from '@/blocks'

export const Journeys: CollectionConfig = {
  slug: 'journeys',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.title) {
              return (data.title as string)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'intro',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Short intro text shown below the journey title',
      },
    },
    {
      name: 'topics',
      type: 'relationship',
      relationTo: 'topics',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'What this journey is about — used to surface related content across pillars.',
      },
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: journeyBlocks,
    },
  ],
}
