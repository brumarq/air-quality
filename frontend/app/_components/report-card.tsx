"use client"

import { Fragment, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const SOURCES = [
  { label: "Readings", detail: "OpenAQ, EEA reference-grade stations" },
  { label: "Limits", detail: "EU Directives 2008/50/EC (today) and 2024/2881 (2030)" },
  { label: "Averages", detail: "Mean of available hourly or daily values; gaps are not filled" },
]

export function ReportCard() {
  const [open, setOpen] = useState(false)

  return (
    <Card className="pointer-events-auto w-72 shadow-lg">
      <CardContent className="p-4 flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Report</h2>

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex items-center justify-between gap-2 w-full text-xs font-medium text-neutral-600">
            <span>Sources and method</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
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
    </Card>
  )
}
