"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarHeaderProps {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export function SidebarHeader({ sidebarCollapsed, toggleSidebar }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between p-5 border-b">
      <div className="flex items-center">
        <span className="text-xl text-teal-500 mr-2 filter drop-shadow">◎</span>
        {!sidebarCollapsed && <h1 className="text-lg font-semibold">LuxAir</h1>}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </div>
  )
}

