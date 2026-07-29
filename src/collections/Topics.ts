import type { CollectionConfig } from 'payload'

// A shared content taxonomy — orthogonal to Segments. A topic classifies
// content ("this is about grief"); a segment classifies a visitor ("this
// visitor is on mobile in India"). Referenced from Journeys.topics.
export const Topics: CollectionConfig = {
  slug: 'topics',
  labels: {
    singular: 'Topic',
    plural: 'Topics',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    description: 'Content taxonomy shared across pillars — what a piece of content is about.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
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
            if (!value && data?.name) {
              return (data.name as string)
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
      name: 'description',
      type: 'textarea',
    },
  ],
}
