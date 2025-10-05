"use client"

import { useState } from "react"
import { MdNotifications, MdMenu, MdClose } from "react-icons/md"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/contexts/sidebar-context"
import { useRealTimeClock, useBackendHealth } from "@/hooks/use-realtime"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TopBar() {
  const { toggleSidebar } = useSidebar()
  const currentTime = useRealTimeClock()
  const { isOnline, isChecking } = useBackendHealth()
  const [notifications] = useState([
    { id: 1, message: "Mission optimization completed", time: "2 min ago", isRead: false },
    { id: 2, message: "Resource allocation updated", time: "5 min ago", isRead: false },
    { id: 3, message: "System health check passed", time: "10 min ago", isRead: true },
  ])

  const unreadCount = notifications.filter(n => !n.isRead).length
  
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between relative overflow-hidden fixed top-0 left-0 right-0 z-50">
      {/* NASA-style background accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      
      <div className="flex items-center gap-4 relative z-10 px-6">
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
          <h1 className="text-xl font-bold text-foreground tracking-tight font-technical">ARES</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-muted-foreground font-technical uppercase tracking-wider">Mission Control</p>
            <div className={`w-1 h-1 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className={`text-xs font-technical ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
              {isChecking ? 'CHECKING...' : isOnline ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 relative z-10 px-6">
        {/* Real-time indicators */}
        <div className="hidden md:flex items-center gap-4 mr-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className={`text-xs font-technical ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
              {isOnline ? 'CONN' : 'DISC'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-technical text-blue-400">DATA</span>
          </div>
            <div className="text-xs font-technical text-muted-foreground">
            {new Date(currentTime.getTime() + 5 * 60 * 60 * 1000 + 30 * 60 * 1000).toLocaleTimeString('en-US', { 
              hour12: false, 
              timeZone: 'UTC' 
            })} UTC
            </div>
        </div>
        
        <div className="h-8 w-px bg-border"></div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground hover:bg-accent/20 relative group"
            >
              <MdNotifications className="w-5 h-5" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full text-[10px] font-technical flex items-center justify-center text-white">
                  {unreadCount}
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <p className="text-xs text-muted-foreground">
                {unreadCount} unread notifications
              </p>
            </div>
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="p-3 cursor-pointer">
                <div className="flex items-start gap-3 w-full">
                  <div className={`w-2 h-2 rounded-full mt-2 ${notification.isRead ? 'bg-muted' : 'bg-accent'}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
