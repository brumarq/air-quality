import { ArrowLeft } from "lucide-react"
import { Button } from "./button"

/** The "Back to …" link at the top of a detail card. */
export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="h-6 -ml-2 px-2 w-fit text-xs text-muted-foreground" onClick={onClick}>
      <ArrowLeft className="h-3.5 w-3.5 mr-1" />
      {label}
    </Button>
  )
}
