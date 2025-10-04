"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MdDashboard,
  MdRocket,
  MdRestaurantMenu,
  MdInventory,
  MdWork,
  MdCompareArrows,
  MdCalendarMonth,
  MdMenu,
  MdMenuOpen,
} from "react-icons/md"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/contexts/sidebar-context"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/", icon: MdDashboard },
  { name: "Missions", href: "/missions", icon: MdRocket },
  { name: "Recipes", href: "/recipes", icon: MdRestaurantMenu },
  { name: "Items", href: "/items", icon: MdInventory },
  { name: "Job Center", href: "/jobs", icon: MdWork },
  { name: "Diff Viewer", href: "/diff", icon: MdCompareArrows },
  { name: "Scheduler", href: "/scheduler", icon: MdCalendarMonth },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebar()

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <aside className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col relative transition-all duration-300 ease-in-out",
        "lg:relative lg:translate-x-0", // Desktop: always visible and positioned
        "fixed top-0 left-0 h-full z-50", // Mobile: fixed position
        isCollapsed 
          ? "lg:w-16 -translate-x-full lg:translate-x-0" // Mobile: hidden, Desktop: collapsed
          : "w-64" // Both: full width when expanded
      )}>
        {/* NASA-style background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
          <div className="absolute top-16 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        </div>
        
        <div className={cn(
          "border-b border-sidebar-border relative z-10 transition-all duration-300",
          isCollapsed ? "p-3" : "p-6"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 nasa-gradient rounded-lg flex items-center justify-center relative overflow-hidden shrink-0">
              <MdRocket className="w-7 h-7 text-white z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h2 className="font-bold text-xl text-sidebar-foreground tracking-tight">ARES</h2>
                <p className="text-xs text-sidebar-foreground/70 font-technical tracking-wider uppercase">Mission Control</p>
              </div>
            )}
          </div>
          
          {/* Collapse/Expand Toggle Button */}
          <div className={cn(
            "flex justify-end mt-4",
            isCollapsed && "justify-center mt-3"
          )}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 w-8 h-8"
            >
              {isCollapsed ? (
                <MdMenu className="w-5 h-5" />
              ) : (
                <MdMenuOpen className="w-5 h-5" />
              )}
            </Button>
          </div>
          
          {/* Mission status indicator */}
          {!isCollapsed && (
            <div className="mt-4 p-3 bg-sidebar-accent/50 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-technical text-sidebar-foreground/80">SYS STATUS</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-blue"></div>
                  <span className="text-xs font-technical text-green-400">NOMINAL</span>
                </div>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="mt-3 flex justify-center">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse-blue"></div>
            </div>
          )}
        </div>

        <nav className={cn(
          "flex-1 relative z-10 transition-all duration-300",
          isCollapsed ? "p-2 space-y-1" : "p-4 space-y-2"
        )}>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  // Close sidebar on mobile when navigating
                  if (window.innerWidth < 1024) {
                    toggleSidebar()
                  }
                }}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-200 group relative overflow-hidden",
                  isCollapsed 
                    ? "gap-0 px-2 py-3 justify-center" 
                    : "gap-3 px-4 py-3",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg mission-card-glow"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
                title={isCollapsed ? item.name : undefined}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20"></div>
                )}
                <Icon className={cn(
                  "relative z-10 transition-transform group-hover:scale-110 shrink-0",
                  isCollapsed ? "w-6 h-6" : "w-5 h-5",
                  isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70"
                )} />
                {!isCollapsed && (
                  <span className={cn(
                    "font-medium relative z-10 tracking-wide min-w-0",
                    isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70"
                  )}>{item.name}</span>
                )}
                {isActive && !isCollapsed && (
                  <div className="absolute right-2 w-1 h-6 bg-accent rounded-full animate-data-flow"></div>
                )}
                {isActive && isCollapsed && (
                  <div className="absolute right-1 w-1 h-4 bg-accent rounded-full animate-data-flow"></div>
                )}
              </Link>
            )
          })}
        </nav>

        <div className={cn(
          "border-t border-sidebar-border relative z-10 transition-all duration-300",
          isCollapsed ? "p-2" : "p-4"
        )}>
          {!isCollapsed && (
            <div className="px-4 py-3 bg-sidebar-accent/30 rounded-lg border border-accent/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-technical text-sidebar-foreground/80 uppercase tracking-wider">System Health</span>
                <div className="text-xs font-technical text-accent">98.7%</div>
              </div>
              <div className="mt-2 w-full h-1 bg-sidebar-border rounded-full overflow-hidden">
                <div className="h-full w-[98.7%] bg-gradient-to-r from-green-400 to-accent rounded-full"></div>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-sidebar-accent/30 rounded-lg border border-accent/20 flex items-center justify-center">
                <div className="text-xs font-technical text-accent">98</div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
