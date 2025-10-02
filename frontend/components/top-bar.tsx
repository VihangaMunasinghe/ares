"use client"

import { MdNotifications, MdSettings, MdPerson } from "react-icons/md"
import { Button } from "@/components/ui/button"

export function TopBar() {
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-foreground">Mars Mission Optimizer</h1>
        <p className="text-xs text-muted-foreground">NASA Operations Center</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <MdNotifications className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <MdSettings className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <MdPerson className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}
