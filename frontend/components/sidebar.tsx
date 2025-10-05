"use client"

import { useState } from "react"
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
  MdSwapHoriz,
} from "react-icons/md"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: MdDashboard },
  { name: "Missions", href: "/missions", icon: MdRocket },
  { name: "Recipes", href: "/recipes", icon: MdRestaurantMenu },
  { name: "Items", href: "/items", icon: MdInventory },
  { name: "Substitutes", href: "/substitutes", icon: MdSwapHoriz },
  { name: "Jobs", href: "/jobs", icon: MdWork },
  { name: "Scheduler", href: "/scheduler", icon: MdCalendarMonth },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <>
      <aside 
        className={cn(
          "bg-sidebar border-r border-sidebar-border flex flex-col relative transition-all duration-300 ease-in-out",
          "fixed top-6 left-0 h-[calc(100vh-4rem)] z-40 lg:relative lg:translate-x-0 lg:top-0 lg:h-full",
          "group", // Add group class for hover effects
          isHovered ? "w-64" : "w-16"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* NASA-style background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
          <div className="absolute top-16 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        </div>

        <nav className={cn(
          "flex-1 relative z-10 transition-all duration-300",
          !isHovered ? "p-2 space-y-1" : "p-4 space-y-1"
        )}>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center transition-all duration-200 group relative overflow-hidden border-l-4",
                  !isHovered 
                    ? "gap-0 px-3 py-3 justify-center" // Consistent padding
                    : "gap-3 px-4 py-3",
                  isActive
                    ? "bg-sidebar-primary/10 text-sidebar-primary-foreground border-l-accent shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground border-l-transparent hover:border-l-accent/50",
                )}
                title={!isHovered ? item.name : undefined}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/5"></div>
                )}
                <Icon className={cn(
                  "relative z-10 transition-all duration-200 group-hover:scale-105 shrink-0",
                  "w-5 h-5", // Keep consistent icon size
                  isActive ? "text-accent" : "text-sidebar-foreground/70"
                )} />
                {isHovered && (
                  <span className={cn(
                    "font-technical font-medium relative z-10 tracking-wide min-w-0 transition-opacity duration-200 uppercase",
                    isActive ? "text-sidebar-foreground font-semibold" : "text-sidebar-foreground/70"
                  )}>{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className={cn(
          "border-t border-sidebar-border relative z-10 transition-all duration-300",
          !isHovered ? "p-2" : "p-4"
        )}>
          {isHovered && (
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
          {!isHovered && (
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
