const SOURCES = [
  { label: "Readings", detail: "OpenAQ, EEA reference-grade stations" },
  { label: "Limits", detail: "EU Directives 2008/50/EC (today) and 2024/2881 (2030)" },
]

export function CommuneSources() {
  return (
    <div className="p-5 border-b">
      <h2 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Sources</h2>
      <div className="space-y-2">
        {SOURCES.map((source) => (
          <div key={source.label}>
            <div className="text-sm font-medium">{source.label}</div>
            <div className="text-xs text-muted-foreground">{source.detail}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
