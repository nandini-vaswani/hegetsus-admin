// Which fields of each block type can be overridden by a Variant, and whether
// the override is a text-like field, an upload/media field, or a list field —
// drives both FieldPicker's dropdown and which override input
// (overrideText/overrideMedia/list variants) a field override row shows.
// `rotating_prayer` isn't listed — it offers no personalizable fields at all.

export type FieldKind = 'text' | 'upload' | 'list'

export type PersonalizableField = {
  name: string
  label: string
  kind: FieldKind
}

export const PERSONALIZABLE_FIELDS: Record<string, PersonalizableField[]> = {
  hero: [
    { name: 'headline', label: 'Headline', kind: 'text' },
    { name: 'subhead', label: 'Subhead', kind: 'text' },
    { name: 'media', label: 'Media', kind: 'upload' },
  ],
  video: [
    { name: 'title', label: 'Title', kind: 'text' },
    { name: 'video', label: 'Video', kind: 'upload' },
    { name: 'videoLabel', label: 'Video description', kind: 'text' },
    { name: 'caption', label: 'Caption', kind: 'text' },
  ],
  text: [{ name: 'body', label: 'Body', kind: 'text' }],
  next_step: [{ name: 'options', label: 'Options', kind: 'list' }],
}

export function fieldKind(blockType?: string | null, fieldName?: string | null): FieldKind | null {
  if (!blockType || !fieldName) return null
  const fields = PERSONALIZABLE_FIELDS[blockType]
  if (!fields) return null
  return fields.find((f) => f.name === fieldName)?.kind ?? null
}
