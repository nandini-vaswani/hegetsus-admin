import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { fieldKind } from '@/lib/personalizable-fields'
import { nextStepOptionFields } from '@/blocks/NextStep'

// One document = one rule/key, targeting one page and (optionally) one block on
// it. Scope is inferred from how far the editor drills in, not chosen directly:
//   - no `block` picked                          -> page  (`blocks`: which of
//                                                    the page's blocks show, and
//                                                    in what order)
//   - `block` picked, no field overrides           -> block (`blockVisible` /
//                                                    `blockOrder`)
//   - a field override targets a text/media field  -> field (one or more
//                                                    `overrideText`/`overrideMedia`
//                                                    entries)
//   - a field override targets a list field        -> list (a set of named
//                                                    alternatives, each with its
//                                                    own key + item list)
// A single document can carry blockVisible/blockOrder AND fieldOverrides
// together -- they aren't mutually exclusive.

type FieldOverrideRow = {
  field?: string
  variants?: unknown[]
}

const computeScope: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data
  const overrides = (data.fieldOverrides || []) as FieldOverrideRow[]
  const hasList = overrides.some((o) => fieldKind(data.blockType, o.field) === 'list')
  const hasField = overrides.length > 0
  data.scope = hasList ? 'list' : hasField ? 'field' : data.block ? 'block' : 'page'
  return data
}

const computeSurfaceKey: CollectionBeforeValidateHook = async ({ data, req }) => {
  if (!data || !data.page) return data
  const journey = await req.payload.findByID({ collection: 'journeys', id: data.page, depth: 0 })
  const slug = journey?.slug as string | undefined
  if (!slug) return data
  if (data.block) {
    const blocks = (journey?.blocks || []) as Record<string, unknown>[]
    const match = blocks.find((b) => String(b.id) === String(data.block))
    const blockKey = match?.key as string | undefined
    data.surfaceKey = blockKey ? `${slug}.${blockKey}` : slug
  } else {
    data.surfaceKey = slug
  }
  return data
}

export const Variants: CollectionConfig = {
  slug: 'variants',
  labels: {
    singular: 'Variant',
    plural: 'Variants',
  },
  admin: {
    useAsTitle: 'key',
    defaultColumns: ['key', 'name', 'page', 'scope', 'updatedAt'],
    description: 'Personalized content for a page, block, field, or list.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    beforeValidate: [computeScope, computeSurfaceKey],
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      required: true,
      admin: {
        description: 'Must match the variant key configured for this rule, e.g. "variant1".',
      },
    },
    {
      name: 'name',
      type: 'text',
      label: 'Label',
      admin: { description: 'e.g. "Cricket"' },
    },
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'journeys',
      required: true,
    },
    {
      name: 'block',
      type: 'text',
      label: 'Block',
      admin: {
        description: 'Pick one block to narrow scope to block/field/list. Leave empty for page scope.',
        components: {
          Field: {
            path: '@/components/BlockPicker#BlockPicker',
            clientProps: { withBlockType: true },
          },
        },
      },
    },
    {
      name: 'blockType',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'blocks',
      type: 'array',
      label: 'Blocks to show (page scope)',
      labels: { singular: 'Block', plural: 'Blocks' },
      admin: {
        condition: (_, siblingData) => !siblingData?.block,
        description:
          "Which of the page's existing blocks to show, and in what order -- blocks not listed are hidden.",
      },
      fields: [
        {
          name: 'block',
          type: 'text',
          label: 'Block',
          admin: {
            components: { Field: '@/components/BlockPicker#BlockPicker' },
          },
        },
      ],
    },
    {
      name: 'blockVisible',
      type: 'checkbox',
      label: 'Show this block',
      defaultValue: true,
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.block),
      },
    },
    {
      name: 'blockOrder',
      type: 'number',
      label: 'Position',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.block),
        description: "Reposition this block, without touching the rest of the page's order.",
      },
    },
    {
      name: 'fieldOverrides',
      type: 'array',
      label: 'Field overrides',
      labels: { singular: 'Field override', plural: 'Field overrides' },
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.block),
        description: 'Override one or more fields (or a list field) of the selected block.',
      },
      fields: [
        {
          name: 'field',
          type: 'text',
          label: 'Field',
          admin: {
            components: { Field: '@/components/FieldPicker#FieldPicker' },
          },
        },
        {
          name: 'overrideText',
          type: 'textarea',
          label: 'Override value',
          admin: {
            condition: (data, siblingData) => fieldKind(data?.blockType, siblingData?.field) === 'text',
          },
        },
        {
          name: 'overrideMedia',
          type: 'relationship',
          relationTo: 'media',
          label: 'Override media',
          admin: {
            condition: (data, siblingData) => fieldKind(data?.blockType, siblingData?.field) === 'upload',
          },
        },
        {
          name: 'variants',
          type: 'array',
          label: 'List variants',
          labels: { singular: 'Variant', plural: 'Variants' },
          admin: {
            condition: (data, siblingData) => fieldKind(data?.blockType, siblingData?.field) === 'list',
            description: 'Named alternatives for this list -- e.g. "control", "expanded", "reordered".',
          },
          fields: [
            {
              name: 'key',
              type: 'text',
              required: true,
              admin: { description: 'e.g. "control", "expanded"' },
            },
            { name: 'label', type: 'text' },
            {
              name: 'items',
              type: 'array',
              labels: { singular: 'Item', plural: 'Items' },
              fields: nextStepOptionFields(),
            },
          ],
        },
      ],
    },
    {
      name: 'surfaceKey',
      type: 'text',
      label: 'Surface key',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'scope',
      type: 'select',
      options: [
        { label: 'Page', value: 'page' },
        { label: 'Block', value: 'block' },
        { label: 'Field', value: 'field' },
        { label: 'List', value: 'list' },
      ],
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
