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
} from "react-icons/md"
import { cn } from "@/lib/utils"

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

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col relative">
      {/* NASA-style background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
        <div className="absolute top-16 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
      </div>
      
      <div className="p-6 border-b border-sidebar-border relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 nasa-gradient rounded-lg flex items-center justify-center relative overflow-hidden">
            <MdRocket className="w-7 h-7 text-white z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          </div>
          <div>
            <h2 className="font-bold text-xl text-sidebar-foreground tracking-tight">ARES</h2>
            <p className="text-xs text-sidebar-foreground/70 font-technical tracking-wider uppercase">Mission Control</p>
          </div>
        </div>
        
        {/* Mission status indicator */}
        <div className="mt-4 p-3 bg-sidebar-accent/50 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-technical text-sidebar-foreground/80">SYS STATUS</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-blue"></div>
              <span className="text-xs font-technical text-green-400">NOMINAL</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 relative z-10">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg mission-card-glow"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20"></div>
              )}
              <Icon className={cn(
                "w-5 h-5 relative z-10 transition-transform group-hover:scale-110",
                isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70"
              )} />
              <span className={cn(
                "font-medium relative z-10 tracking-wide",
                isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70"
              )}>{item.name}</span>
              {isActive && (
                <div className="absolute right-2 w-1 h-6 bg-accent rounded-full animate-data-flow"></div>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border relative z-10">
        <div className="px-4 py-3 bg-sidebar-accent/30 rounded-lg border border-accent/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-technical text-sidebar-foreground/80 uppercase tracking-wider">System Health</span>
            <div className="text-xs font-technical text-accent">98.7%</div>
          </div>
          <div className="mt-2 w-full h-1 bg-sidebar-border rounded-full overflow-hidden">
            <div className="h-full w-[98.7%] bg-gradient-to-r from-green-400 to-accent rounded-full"></div>
          </div>
        </div>
      </div>
    </aside>
  )
}
