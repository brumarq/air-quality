"use client"

import { Fragment, useState } from "react"
import { ChevronDown } from "lucide-react"
import { CardContent } from "@/shared/ui/card"
import { FloatingCard } from "@/shared/ui/floating-card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible"

const SOURCES = [
  { label: "Readings", detail: "OpenAQ, EEA reference-grade stations" },
  { label: "Limits", detail: "EU Directives 2008/50/EC (today) and 2024/2881 (2030)" },
  { label: "Averages", detail: "Mean of available hourly or daily values; gaps are not filled" },
]

export function ReportCard() {
  const [open, setOpen] = useState(false)

  return (
    <FloatingCard className="w-72">
      <CardContent className="p-4 flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Report</h2>

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex items-center justify-between gap-2 w-full text-xs font-medium text-ink-soft">
            <span>Sources and method</span>
            <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
              <ChevronDown className="h-4 w-4" />
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 grid grid-cols-[64px_1fr] gap-x-2 gap-y-2 text-xs">
            {SOURCES.map((source) => (
              <Fragment key={source.label}>
                <span className="text-muted-foreground">{source.label}</span>
                <span>{source.detail}</span>
              </Fragment>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </FloatingCard>
  )
}
