import type { Field } from 'payload'

// A stable, author-assigned, human-readable identifier for a block instance —
// e.g. "hero", "resources" — used to build permanent surface keys like
// "journey1.hero" or "journey1.resources.items". Same convention as
// Journeys.slug: authors set it once and shouldn't change it later, since
// external consumers address content by this key.
export function blockKeyField(): Field {
  return {
    name: 'key',
    type: 'text',
    required: true,
    admin: {
      description:
        'Stable identifier for this block (e.g. "hero"). Used to build its permanent surface key — avoid changing it after publishing.',
    },
  }
}
