'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'

type BlockOption = { id: string; blockType: string; label: string }

type Props = {
  path: string
  // Only the singular top-level `block` field also drives the `field` picker, so
  // only it needs to write the sibling `blockType`. Rows inside the `blocks` array
  // (page-level scope) just need the block id.
  withBlockType?: boolean
}

function labelForBlock(block: Record<string, unknown>): string {
  const key = block.key as string | undefined
  const text = (block.headline || block.title || block.body) as string | undefined
  const name = key || (block.blockType as string)
  return `${name}${text ? ` — ${text.slice(0, 40)}` : ''}`
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

export function BlockPicker({ path, withBlockType }: Props) {
  const { value, setValue } = useField<string>({ path })
  const { setValue: setBlockType } = useField<string>({ path: 'blockType' })
  const pageId = useFormFields(([fields]) => fields.page?.value as string | undefined)

  const [options, setOptions] = useState<BlockOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!pageId) {
      setOptions([])
      return
    }
    setLoading(true)
    fetch(`/api/journeys/${pageId}?depth=0`)
      .then((res) => res.json())
      .then((doc) => {
        const blocks = (doc.blocks || []) as Record<string, unknown>[]
        setOptions(
          blocks.map((b) => ({ id: String(b.id), blockType: String(b.blockType), label: labelForBlock(b) })),
        )
      })
      .finally(() => setLoading(false))
  }, [pageId])

  if (!pageId) {
    return (
      <div style={wrapperStyle}>
        <label style={labelStyle}>Block</label>
        <p style={{ fontSize: '13px', opacity: 0.7, margin: 0 }}>Select a page first.</p>
      </div>
    )
  }

  return (
    <div style={wrapperStyle}>
      <label style={labelStyle}>Block</label>
      <select
        value={value || ''}
        onChange={(e) => {
          const blockId = e.target.value
          setValue(blockId || null)
          if (withBlockType) {
            const selected = options.find((o) => o.id === blockId)
            setBlockType(selected ? selected.blockType : null)
          }
        }}
        style={selectStyle}
      >
        <option value="">{loading ? 'Loading blocks…' : '— Select a block —'}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
