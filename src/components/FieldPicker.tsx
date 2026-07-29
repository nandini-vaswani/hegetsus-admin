'use client'

import type { CSSProperties } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'
import { PERSONALIZABLE_FIELDS } from '@/lib/personalizable-fields'

type Props = {
  path: string
}

const wrapperStyle: CSSProperties = {
  margin: '0 0 20px',
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  marginBottom: '6px',
}

const selectStyle: CSSProperties = {
  width: '100%',
  padding: '8px',
  background: 'var(--theme-input-bg)',
  color: 'inherit',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: '4px',
}

export function FieldPicker({ path }: Props) {
  const { value, setValue } = useField<string>({ path })
  const blockType = useFormFields(([fields]) => fields.blockType?.value as string | undefined)

  const options = (blockType && PERSONALIZABLE_FIELDS[blockType]) || []

  if (!blockType) {
    return (
      <div style={wrapperStyle}>
        <label style={labelStyle}>Field</label>
        <p style={{ fontSize: '13px', opacity: 0.7, margin: 0 }}>Select a block first.</p>
      </div>
    )
  }

  if (options.length === 0) {
    return (
      <div style={wrapperStyle}>
        <label style={labelStyle}>Field</label>
        <p style={{ fontSize: '13px', opacity: 0.7, margin: 0 }}>This block type has no personalizable fields.</p>
      </div>
    )
  }

  return (
    <div style={wrapperStyle}>
      <label style={labelStyle}>Field</label>
      <select value={value || ''} onChange={(e) => setValue(e.target.value || null)} style={selectStyle}>
        <option value="">— Select a field —</option>
        {options.map((o) => (
          <option key={o.name} value={o.name}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
