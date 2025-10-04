"use client"

import { MdNotifications, MdSettings, MdPerson, MdMenu } from "react-icons/md"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/contexts/sidebar-context"

export function TopBar() {
  const { toggleSidebar } = useSidebar()
  
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between relative overflow-hidden">
      {/* NASA-style background accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      
      <div className="flex items-center gap-4 relative z-10">
        {/* Sidebar Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-muted-foreground hover:text-foreground hover:bg-accent/20 lg:hidden"
        >
          <MdMenu className="w-5 h-5" />
        </Button>
        
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">MARS MISSION OPTIMIZER</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-muted-foreground font-technical uppercase tracking-wider">NASA Operations Center</p>
            <div className="w-1 h-1 bg-accent rounded-full animate-pulse"></div>
            <span className="text-xs text-accent font-technical">LIVE</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 relative z-10">
        {/* Real-time indicators */}
        <div className="hidden md:flex items-center gap-4 mr-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-technical text-green-400">CONN</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-technical text-blue-400">DATA</span>
          </div>
          <div className="text-xs font-technical text-muted-foreground">
            {new Date().toLocaleTimeString('en-US', { 
              hour12: false, 
              timeZone: 'UTC' 
            })} UTC
          </div>
        </div>
        
        <div className="h-8 w-px bg-border"></div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground hover:bg-accent/20 relative group"
        >
          <MdNotifications className="w-5 h-5" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full text-[10px] font-technical flex items-center justify-center text-white">3</div>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground hover:bg-accent/20"
        >
          <MdSettings className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground hover:bg-primary/20"
        >
          <MdPerson className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}
