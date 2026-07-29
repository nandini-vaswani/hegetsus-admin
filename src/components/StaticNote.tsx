export function StaticNote() {
  return (
    <p style={{ fontSize: '13px', opacity: 0.75, margin: '8px 0' }}>
      Pulls a random prayer submitted by another visitor on every page load. Resolved dynamically
      at request time — not personalizable by segment.
    </p>
  )
}
